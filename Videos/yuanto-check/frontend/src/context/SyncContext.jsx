import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { fetchWithAuth, API_BASE } from '../api';
import * as db from '../offline/db';

const SyncContext = createContext(null);
const BASE_RETRY_MS = 4000;
const RETRY_POLICY = {
  network: { retryable: true, maxRetries: 6 },
  transient: { retryable: true, maxRetries: 4 },
  auth: { retryable: false, maxRetries: 0 },
  validation: { retryable: false, maxRetries: 0 },
  unknown: { retryable: true, maxRetries: 3 },
};

function buildBackoffMs(retryCount) {
  const exp = Math.min(2 ** retryCount, 64);
  const jitter = Math.floor(Math.random() * 1000);
  return BASE_RETRY_MS * exp + jitter;
}

function dispatchSyncEvent(kind, detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('yuanto-sync-event', { detail: { kind, ...detail } }));
}

function retryClassForStatus(status) {
  const s = Number(status || 0);
  if (!s) return 'network';
  if (s === 401 || s === 403) return 'auth';
  if (s >= 400 && s < 500) return 'validation';
  if (s >= 500) return 'transient';
  return 'unknown';
}

function retryClassForError(err) {
  if (err?.retryClass) return err.retryClass;
  if (err?.status) return retryClassForStatus(err.status);
  return 'network';
}

function getTypeRetryPolicy(type = '') {
  if (type === 'generic/json-post') {
    return { ...RETRY_POLICY.network, maxRetries: 5 };
  }
  if (type === 'inspection/event') {
    return { ...RETRY_POLICY.transient, maxRetries: 3 };
  }
  if (type === 'quality/defects' || type === 'field-report/confirm') {
    return { ...RETRY_POLICY.network, maxRetries: 5 };
  }
  return RETRY_POLICY.network;
}

function makeHttpError(endpoint, status) {
  const err = new Error(`${endpoint} status ${status}`);
  err.status = status;
  err.endpoint = endpoint;
  err.retryClass = retryClassForStatus(status);
  return err;
}

async function postInspectionEventWithFallback(item) {
  const body = JSON.stringify(item.payload || {});
  const headers = {
    'Content-Type': 'application/json',
    ...(item.idempotencyKey ? { 'X-Idempotency-Key': item.idempotencyKey } : {}),
  };
  const candidates = [
    item.endpoint,
    `${API_BASE}/inspection/events/upsert`,
    '/api/v1/inspection/events/upsert',
  ].filter(Boolean);
  let lastErr = null;
  for (const endpoint of candidates) {
    const res = await fetchWithAuth(endpoint, {
      method: 'POST',
      headers,
      body,
    });
    if (res.ok) return { ok: true, endpoint };
    // For event upsert, 404 is often env/proxy mismatch -> keep transient.
    const err = makeHttpError(`inspection/event@${endpoint}`, res.status);
    if (res.status === 404) err.retryClass = 'transient';
    lastErr = err;
  }
  throw lastErr || makeHttpError('inspection/event', 0);
}

function mapEntityTypeToType(entityType = '') {
  const key = String(entityType || '').toLowerCase();
  if (key === 'inspection/smart-complete') return 'smart/complete';
  if (key === 'inspection/submit-task') return 'submit-task';
  if (key === 'report/field') return 'field-report/confirm';
  if (key === 'report/quality-defect') return 'quality/defects';
  if (key === 'inspection/event') return 'inspection/event';
  return null;
}

function normalizeItemType(item = {}) {
  return item.type || mapEntityTypeToType(item.entityType) || null;
}

export function SyncProvider({ children }) {
  const syncLockRef = useRef(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [deadLetterCount, setDeadLetterCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);
  const [lastFailedEndpoint, setLastFailedEndpoint] = useState(null);
  const [nextRetryAt, setNextRetryAt] = useState(null);

  const refreshPendingCount = useCallback(async () => {
    try {
      const queue = await db.getQueue();
      const rows = Array.isArray(queue) ? queue : [];
      const pending = rows.filter((item) => {
        const status = item.status || 'queued';
        return status === 'queued' || status === 'syncing';
      }).length;
      const failed = rows.filter((item) => (item.status || '') === 'failed').length;
      const dead = rows.filter((item) => (item.status || '') === 'dead_letter').length;
      const failedRows = rows.filter((item) => (item.status || '') === 'failed' || (item.status || '') === 'dead_letter');
      const lastFailed = failedRows.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))[0] || null;
      const nextDue = rows
        .filter((item) => (item.status || '') === 'queued')
        .map((item) => Number(item.nextRetryAt || 0))
        .filter((v) => Number.isFinite(v) && v > Date.now())
        .sort((a, b) => a - b)[0];
      setPendingCount(pending);
      setFailedCount(failed);
      setDeadLetterCount(dead);
      setLastFailedMessage(lastFailed?.lastError || null);
      setLastFailedEndpoint(lastFailed?.lastErrorEndpoint || lastFailed?.endpoint || null);
      setNextRetryAt(nextDue || null);
    } catch (_) {
      setPendingCount(0);
      setFailedCount(0);
      setDeadLetterCount(0);
      setLastFailedMessage(null);
      setLastFailedEndpoint(null);
      setNextRetryAt(null);
    }
  }, []);

  const getCachedOrFetch = useCallback(async (cacheKey, fetchFn) => {
    try {
      const data = await fetchFn();
      if (data !== undefined && data !== null) {
        try {
          await db.setCache(cacheKey, data);
        } catch (_) {}
      }
      return data;
    } catch (_) {
      try {
        const cached = await db.getCache(cacheKey);
        return cached;
      } catch (__) {
        return null;
      }
    }
  }, []);

  const queueAction = useCallback(async (payload) => {
    const normalizedType = payload.type || mapEntityTypeToType(payload.entityType) || 'unknown';
    const idempotencyKey = payload.idempotencyKey || db.createIdempotencyKey(normalizedType || payload.entityType || 'sync');
    const typePolicy = getTypeRetryPolicy(normalizedType);
    await db.addToQueue({
      ...payload,
      type: normalizedType,
      idempotencyKey,
      status: 'queued',
      retryClass: payload.retryClass || 'network',
      retryCount: 0,
      maxRetries: Number(payload.maxRetries || typePolicy.maxRetries || 0),
      nextRetryAt: Date.now(),
      createdAt: Date.now(),
    });
    await refreshPendingCount();
    dispatchSyncEvent('queued', { type: payload.type || payload.entityType, idempotencyKey });
    if (typeof navigator !== 'undefined' && navigator.serviceWorker?.ready) {
      navigator.serviceWorker.ready
        .then((reg) => reg.sync?.register?.('yuanto-sync'))
        .catch(() => {});
    }
    return idempotencyKey;
  }, [refreshPendingCount]);

  const queueSmartComplete = useCallback(async (payload) => {
    await queueAction({
      type: 'smart/complete',
      entityType: 'inspection/smart-complete',
      endpoint: `${API_BASE}/smart/complete`,
      method: 'POST',
      payload: {
        taskId: payload.taskId,
        improvement_note: payload.improvement_note ?? null,
      },
      fileBlob: payload.fileBlob ?? null,
    });
  }, [queueAction]);

  const queueSubmitTask = useCallback(async (payload) => {
    await queueAction({
      type: 'submit-task',
      entityType: 'inspection/submit-task',
      endpoint: `${API_BASE}/submit-task`,
      method: 'POST',
      payload: {
        task_id: payload.task_id,
      },
      fileBlob: payload.fileBlob ?? null,
    });
  }, [queueAction]);

  const queueFieldReportConfirm = useCallback(async (payload) => {
    await queueAction({
      type: 'field-report/confirm',
      entityType: 'report/field',
      endpoint: `${API_BASE}/field-reports/offline-submit`,
      method: 'POST',
      payload: {
        machine_or_zone: payload.machine_or_zone ?? null,
        item_falla: payload.item_falla ?? null,
        description: payload.description ?? '',
        requires_repuesto: !!payload.requires_repuesto,
        create_ot: !!payload.create_ot,
        prioridad: payload.prioridad ?? 'media',
        inspection_id: payload.inspection_id ?? null,
        source_module: payload.source_module ?? null,
        inspection_event_id: payload.inspection_event_id ?? null,
        equipment_id: payload.equipment_id ?? null,
        lot_no: payload.lot_no ?? null,
      },
      fileBlob: payload.fileBlob ?? null,
    });
  }, [queueAction]);

  const queueQualityDefect = useCallback(async (payload) => {
    await queueAction({
      type: 'quality/defects',
      entityType: 'report/quality-defect',
      endpoint: `${API_BASE}/quality/defects`,
      method: 'POST',
      payload: {
        description: payload.description,
        defect_category: payload.defect_category,
        quantity: payload.quantity,
        quantity_unit: payload.quantity_unit,
        production_line: payload.production_line,
        related_scan_id: payload.related_scan_id,
        duplicate_of_id: payload.duplicate_of_id,
        consent_ml_export: payload.consent_ml_export,
        inspection_id: payload.inspection_id ?? null,
        source_module: payload.source_module ?? null,
        inspection_event_id: payload.inspection_event_id ?? null,
        equipment_id: payload.equipment_id ?? null,
        lot_no: payload.lot_no ?? null,
      },
      files: Array.isArray(payload.files) ? payload.files : [],
    });
  }, [queueAction]);

  const queueInspectionEvent = useCallback(async (payload) => {
    await queueAction({
      type: 'inspection/event',
      entityType: 'inspection/event',
      endpoint: `${API_BASE}/inspection/events/upsert`,
      method: 'POST',
      payload,
    });
  }, [queueAction]);

  const queueJsonPost = useCallback(async ({ endpoint, payload, entityType = 'report/generic', maxRetries = 5 }) => {
    await queueAction({
      type: 'generic/json-post',
      entityType,
      endpoint,
      method: 'POST',
      payload: payload || {},
      maxRetries,
    });
  }, [queueAction]);

  const syncNow = useCallback(async () => {
    if (!isOnline || syncLockRef.current) return;
    syncLockRef.current = true;
    setSyncing(true);
    setSyncError(null);
    const failures = [];
    try {
      const queue = await db.getDueQueue(Date.now());
      for (const item of queue) {
        try {
          await db.updateQueueItem(item.id, { status: 'syncing' });
          const itemType = normalizeItemType(item);
          if (itemType === 'smart/complete') {
            const endpoint = `${API_BASE}/smart/complete`;
            const form = new FormData();
            form.append('task_id', String(item?.payload?.taskId ?? item.taskId));
            if (item?.payload?.improvement_note || item.improvement_note) {
              form.append('improvement_note', item?.payload?.improvement_note ?? item.improvement_note);
            }
            if (item.fileBlob) form.append('file', item.fileBlob);
            if (item.idempotencyKey) form.append('idempotency_key', item.idempotencyKey);
            const res = await fetchWithAuth(endpoint, {
              method: 'POST',
              body: form,
              headers: item.idempotencyKey ? { 'X-Idempotency-Key': item.idempotencyKey } : {},
            });
            if (!res.ok) throw makeHttpError('smart/complete', res.status);
            await db.removeQueueItem(item.id);
            dispatchSyncEvent('synced', { type: item.type, id: item.id });
          } else if (itemType === 'submit-task') {
            const endpoint = `${API_BASE}/submit-task`;
            const form = new FormData();
            form.append('task_id', String(item?.payload?.task_id ?? item.task_id));
            if (item.fileBlob) form.append('file', item.fileBlob);
            if (item.idempotencyKey) form.append('idempotency_key', item.idempotencyKey);
            const res = await fetchWithAuth(endpoint, {
              method: 'POST',
              body: form,
              headers: item.idempotencyKey ? { 'X-Idempotency-Key': item.idempotencyKey } : {},
            });
            if (!res.ok) throw makeHttpError('submit-task', res.status);
            await db.removeQueueItem(item.id);
            dispatchSyncEvent('synced', { type: item.type, id: item.id });
          } else if (itemType === 'field-report/confirm') {
            const endpoint = item.endpoint || `${API_BASE}/field-reports/offline-submit`;
            const form = new FormData();
            const p = item.payload || {};
            Object.entries(p).forEach(([k, v]) => {
              if (v !== null && v !== undefined && v !== '') form.append(k, String(v));
            });
            if (item.fileBlob) form.append('file', item.fileBlob);
            if (item.idempotencyKey) form.append('idempotency_key', item.idempotencyKey);
            const res = await fetchWithAuth(endpoint, {
              method: 'POST',
              body: form,
              headers: item.idempotencyKey ? { 'X-Idempotency-Key': item.idempotencyKey } : {},
            });
            if (!res.ok) throw makeHttpError('field-report/confirm', res.status);
            await db.removeQueueItem(item.id);
            dispatchSyncEvent('synced', { type: item.type, id: item.id });
          } else if (itemType === 'quality/defects') {
            const endpoint = item.endpoint || `${API_BASE}/quality/defects`;
            const form = new FormData();
            const p = item.payload || {};
            Object.entries(p).forEach(([k, v]) => {
              if (v !== null && v !== undefined && v !== '') form.append(k, String(v));
            });
            (item.files || []).forEach((file) => form.append('files', file));
            if (item.idempotencyKey) form.append('idempotency_key', item.idempotencyKey);
            const res = await fetchWithAuth(endpoint, {
              method: 'POST',
              body: form,
              headers: item.idempotencyKey ? { 'X-Idempotency-Key': item.idempotencyKey } : {},
            });
            if (!res.ok) throw makeHttpError('quality/defects', res.status);
            await db.removeQueueItem(item.id);
            dispatchSyncEvent('synced', { type: item.type, id: item.id });
          } else if (itemType === 'inspection/event') {
            await postInspectionEventWithFallback(item);
            await db.removeQueueItem(item.id);
            dispatchSyncEvent('synced', { type: item.type, id: item.id });
          } else if (itemType === 'generic/json-post') {
            const endpoint = item.endpoint;
            const res = await fetchWithAuth(endpoint, {
              method: item.method || 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(item.idempotencyKey ? { 'X-Idempotency-Key': item.idempotencyKey } : {}),
              },
              body: JSON.stringify(item.payload || {}),
            });
            if (!res.ok) throw makeHttpError(endpoint || 'generic/json-post', res.status);
            await db.removeQueueItem(item.id);
            dispatchSyncEvent('synced', { type: item.type, id: item.id });
          } else {
            await db.updateQueueItem(item.id, {
              status: 'failed',
              retryClass: 'validation',
              nextRetryAt: null,
              lastError: `unknown queue type: ${String(item.type || item.entityType || 'n/a')}`,
              lastErrorEndpoint: item.endpoint || null,
            });
            dispatchSyncEvent('failed', {
              type: item.type || item.entityType || 'unknown',
              id: item.id,
              message: 'unknown queue type',
            });
          }
        } catch (err) {
          const retryClass = retryClassForError(err);
          const policy = RETRY_POLICY[retryClass] || RETRY_POLICY.unknown;
          const endpointPolicy = getTypeRetryPolicy(item.type);
          const maxRetries = Number(item.maxRetries || endpointPolicy.maxRetries || policy.maxRetries || 0);
          const retryCount = Number(item.retryCount || 0) + 1;
          if (!policy.retryable) {
            await db.updateQueueItem(item.id, {
              status: 'failed',
              retryCount,
              retryClass,
              maxRetries,
              nextRetryAt: null,
              lastErrorCode: Number(err?.status || 0) || null,
              lastErrorEndpoint: err?.endpoint || item.endpoint || null,
              lastError: err?.message || 'sync-failed',
            });
          } else if (retryCount > maxRetries) {
            await db.updateQueueItem(item.id, {
              status: 'dead_letter',
              retryCount,
              retryClass,
              maxRetries,
              deadLetterAt: Date.now(),
              nextRetryAt: null,
              lastErrorCode: Number(err?.status || 0) || null,
              lastErrorEndpoint: err?.endpoint || item.endpoint || null,
              lastError: err?.message || 'sync-failed',
            });
          } else {
            await db.updateQueueItem(item.id, {
              status: 'queued',
              retryCount,
              retryClass,
              maxRetries,
              deadLetterAt: null,
              nextRetryAt: Date.now() + buildBackoffMs(retryCount),
              lastErrorCode: Number(err?.status || 0) || null,
              lastErrorEndpoint: err?.endpoint || item.endpoint || null,
              lastError: err?.message || 'sync-retry',
            });
          }
          failures.push(`${item.type || 'item'} #${item.id}: ${err?.message || 'error'}`);
          dispatchSyncEvent('failed', {
            type: item.type,
            id: item.id,
            message: err?.message || 'error',
            retryClass,
            endpoint: err?.endpoint || item.endpoint || null,
          });
        }
      }
      if (failures.length) {
        setSyncError(failures.slice(0, 3).join(' · ') + (failures.length > 3 ? '…' : ''));
      } else {
        setLastSyncedAt(Date.now());
      }
      await refreshPendingCount();
    } catch (e) {
      setSyncError(e?.message || 'Sync failed');
    } finally {
      setSyncing(false);
      syncLockRef.current = false;
    }
  }, [isOnline, refreshPendingCount]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    const onSwSync = () => {
      if (!syncing) syncNow();
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('yuanto-sw-sync', onSwSync);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('yuanto-sw-sync', onSwSync);
    };
  }, [syncNow, syncing]);

  // Ping server to confirm real connectivity (with auth so proxy is used)
  useEffect(() => {
    if (!isOnline) return;
    let cancelled = false;
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 8000);
    fetchWithAuth(`${API_BASE}/status`, { signal: ac.signal })
      .then((r) => (r.ok ? true : false))
      .then((ok) => {
        if (cancelled) return;
        if (ok) return;
        // Keep browser connectivity as source of truth to avoid false offline lock.
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setIsOnline(false);
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setIsOnline(false);
        }
      })
      .finally(() => clearTimeout(t));
    return () => { cancelled = true; ac.abort(); clearTimeout(t); };
  }, [isOnline]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount, syncing]);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !syncing) {
      syncNow();
    }
  }, [isOnline, pendingCount, syncing, syncNow]);

  useEffect(() => {
    if (!isOnline || syncing) return undefined;
    let timer;
    db.getQueue().then((rows) => {
      const all = Array.isArray(rows) ? rows : [];
      const now = Date.now();
      const nextDue = all
        .filter((item) => {
          const status = item.status || 'queued';
          return status === 'queued' && Number(item.nextRetryAt || 0) > now;
        })
        .sort((a, b) => Number(a.nextRetryAt || 0) - Number(b.nextRetryAt || 0))[0];
      if (!nextDue) return;
      const delay = Math.max(300, Number(nextDue.nextRetryAt || now) - now);
      timer = setTimeout(() => {
        syncNow();
      }, delay);
    }).catch(() => {});
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOnline, pendingCount, syncing, syncNow]);

  const retryFailedNow = useCallback(async () => {
    const rows = await db.getQueue();
    for (const item of Array.isArray(rows) ? rows : []) {
      const status = item.status || '';
      if (status !== 'failed' && status !== 'dead_letter') continue;
      await db.updateQueueItem(item.id, {
        status: 'queued',
        retryCount: status === 'dead_letter' ? 0 : Number(item.retryCount || 0),
        deadLetterAt: null,
        nextRetryAt: Date.now(),
      });
    }
    setSyncError(null);
    await refreshPendingCount();
    if (isOnline) syncNow();
  }, [isOnline, refreshPendingCount, syncNow]);

  const discardFailedNow = useCallback(async () => {
    await db.removeQueueByStatus(['failed', 'dead_letter']);
    setSyncError(null);
    await refreshPendingCount();
  }, [refreshPendingCount]);

  const value = {
    isOnline,
    syncing,
    pendingCount,
    failedCount,
    deadLetterCount,
    lastSyncedAt,
    syncError,
    lastFailedMessage,
    lastFailedEndpoint,
    nextRetryAt,
    getCachedOrFetch,
    queueAction,
    queueSmartComplete,
    queueSubmitTask,
    queueFieldReportConfirm,
    queueQualityDefect,
    queueInspectionEvent,
    queueJsonPost,
    syncNow,
    retryFailedNow,
    discardFailedNow,
    refreshPendingCount,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const ctx = useContext(SyncContext);
  return ctx || {
    isOnline: true,
    syncing: false,
    pendingCount: 0,
    failedCount: 0,
    deadLetterCount: 0,
    lastSyncedAt: null,
    syncError: null,
    lastFailedMessage: null,
    lastFailedEndpoint: null,
    nextRetryAt: null,
    getCachedOrFetch: async (_, fn) => (typeof fn === 'function' ? fn() : null),
    queueAction: async () => {},
    queueSmartComplete: async () => {},
    queueSubmitTask: async () => {},
    queueFieldReportConfirm: async () => {},
    queueQualityDefect: async () => {},
    queueInspectionEvent: async () => {},
    queueJsonPost: async () => {},
    syncNow: async () => {},
    retryFailedNow: async () => {},
    discardFailedNow: async () => {},
    refreshPendingCount: () => {},
  };
}
