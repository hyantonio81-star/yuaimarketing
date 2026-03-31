import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Loader2,
  QrCode,
  ScanLine,
} from 'lucide-react';
import { fetchWithAuth, API_BASE } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { useSync } from '../context/SyncContext';

const DEFECT_CODES = [
  { id: 'ADH-01', short: 'ADH-01' },
  { id: 'JNT-01', short: 'JNT-01' },
  { id: 'WRP-UP', short: 'WRP-UP' },
  { id: 'WRP-DN', short: 'WRP-DN' },
  { id: 'WRP-S', short: 'WRP-S' },
  { id: 'ONDA-01', short: 'ONDA-01' },
  { id: 'DIM-01', short: 'DIM-01' },
  { id: 'PRT-01', short: 'PRT-01' },
  { id: 'PRT-02', short: 'PRT-02' },
];

const RANGE_VIS = { min: 80, max: 100 };
const RANGE_TEMP = { min: 150, max: 180 };
const RANGE_HUM = { min: 7, max: 9 };

function parseNum(s) {
  const v = parseFloat(String(s).replace(',', '.'));
  return Number.isFinite(v) ? v : null;
}

export default function QcEntryPage({ backTo = '/mobile' }) {
  const { t } = useLanguage();
  const { isOnline, getCachedOrFetch, queueJsonPost, refreshPendingCount } = useSync();
  const scanTarget = backTo === '/dashboard' ? '/dashboard/inventario-escaner' : '/mobile/inventario-escaner';
  const sopTarget = backTo === '/dashboard' ? '/dashboard/sop-qc-01' : '/mobile/sop-qc-01';

  const [orderNo, setOrderNo] = useState('ORD-2026-001');
  const [clientName, setClientName] = useState('Cliente Demo S.A.');
  const [material, setMaterial] = useState('200DW / Onda BC');
  const [visc, setVisc] = useState('90');
  const [temp, setTemp] = useState('165');
  const [hum, setHum] = useState('8.2');
  const [selectedDefects, setSelectedDefects] = useState(() => new Set());
  const [action, setAction] = useState('');
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [err, setErr] = useState(null);
  const [recent, setRecent] = useState([]);
  const [skuCode, setSkuCode] = useState('');
  const [skuAlert, setSkuAlert] = useState(null);

  const warnings = useMemo(() => {
    const w = [];
    const v = parseNum(visc);
    const tp = parseNum(temp);
    const h = parseNum(hum);
    if (v != null && (v < RANGE_VIS.min || v > RANGE_VIS.max)) {
      w.push({
        key: 'visc',
        title: t('qc_entry_warn_visc_title'),
        body: v > RANGE_VIS.max ? t('qc_entry_warn_visc_high') : t('qc_entry_warn_visc_body'),
      });
    }
    if (tp != null && (tp < RANGE_TEMP.min || tp > RANGE_TEMP.max)) {
      w.push({ key: 'temp', title: t('qc_entry_warn_temp_title'), body: t('qc_entry_warn_temp_body') });
    }
    if (h != null && (h < RANGE_HUM.min || h > RANGE_HUM.max)) {
      w.push({ key: 'hum', title: t('qc_entry_warn_hum_title'), body: t('qc_entry_warn_hum_body') });
    }
    return w;
  }, [visc, temp, hum, t]);

  const loadRecent = useCallback(() => {
    getCachedOrFetch('quality/qc-line-entries/recent', () =>
      fetchWithAuth(`${API_BASE}/quality/qc-line-entries/recent?limit=8`).then((r) => (r.ok ? r.json() : []))
    )
      .then((rows) => setRecent(Array.isArray(rows) ? rows : []))
      .catch(() => setRecent([]));
  }, [getCachedOrFetch]);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  useEffect(() => {
    const s = skuCode.trim();
    if (s.length < 2) {
      setSkuAlert(null);
      return undefined;
    }
    const t = setTimeout(() => {
      getCachedOrFetch(`quality/claim-analyses/sku-alert:${s}`, () =>
        fetchWithAuth(`${API_BASE}/quality/claim-analyses/sku-alert?sku=${encodeURIComponent(s)}`).then((r) => (r.ok ? r.json() : null))
      )
        .then((data) => setSkuAlert(data && typeof data === 'object' ? data : null))
        .catch(() => setSkuAlert(null));
    }, 450);
    return () => clearTimeout(t);
  }, [getCachedOrFetch, skuCode]);

  const toggleDefect = (id) => {
    setSelectedDefects((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const simulateQr = () => {
    setOrderNo('ORD-2026-001');
    setClientName('Cliente Demo S.A.');
    setMaterial('200DW / Onda BC');
  };

  const save = async () => {
    setErr(null);
    setToast(null);
    const on = orderNo.trim();
    if (!on) {
      setErr(t('calidad_err_desc_required'));
      return;
    }
    setBusy(true);
    try {
      if (!isOnline) {
        await queueJsonPost({
          endpoint: `${API_BASE}/quality/qc-line-entries`,
          entityType: 'report/qc-line-entry',
          payload: {
            order_no: on,
            client_name: clientName,
            material_spec: material,
            viscosidad_seg: parseNum(visc),
            temperatura_c: parseNum(temp),
            humedad_pct: parseNum(hum),
            defect_codes_json: JSON.stringify([...selectedDefects]),
            accion_tomada: action || null,
          },
          maxRetries: 5,
        });
        await refreshPendingCount();
        setToast(t('sync_saved_local') || 'Guardado localmente. Se enviará al conectar.');
        return;
      }
      const fd = new FormData();
      fd.append('order_no', on);
      fd.append('client_name', clientName);
      fd.append('material_spec', material);
      const v = parseNum(visc);
      const tp = parseNum(temp);
      const h = parseNum(hum);
      if (v != null) fd.append('viscosidad_seg', String(v));
      if (tp != null) fd.append('temperatura_c', String(tp));
      if (h != null) fd.append('humedad_pct', String(h));
      fd.append('defect_codes_json', JSON.stringify([...selectedDefects]));
      if (action) fd.append('accion_tomada', action);
      if (photo) fd.append('file', photo);
      const res = await fetchWithAuth(`${API_BASE}/quality/qc-line-entries`, { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.detail || res.statusText);
        return;
      }
      setToast(t('qc_entry_ok_saved'));
      setPhoto(null);
      loadRecent();
    } catch (e) {
      setErr(e.message || 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-28">
      <header className="sticky top-0 z-10 flex items-center gap-2 px-3 py-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur border-b border-slate-200 dark:border-slate-700">
        <Link to={backTo} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
          <ArrowLeft size={22} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg leading-tight">{t('qc_entry_title')}</h1>
          <p className="text-xs text-slate-500">{t('qc_entry_subtitle')}</p>
        </div>
        <Link
          to={sopTarget}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap px-2"
        >
          SOP
        </Link>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-3 shadow-sm">
          <div className="flex justify-between items-start gap-2">
            <label className="block flex-1 text-xs font-medium">
              {t('qc_entry_order')}
              <input
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                className="mt-1 w-full text-base font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5"
              />
            </label>
            <button
              type="button"
              onClick={simulateQr}
              className="mt-6 flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-xs font-semibold"
            >
              <QrCode size={22} />
              {t('qc_entry_qr')}
            </button>
          </div>
          <label className="block text-xs font-medium">
            {t('qc_entry_client')}
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
            />
          </label>
          <label className="block text-xs font-medium">
            {t('qc_entry_material')}
            <input
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
            />
          </label>
          <label className="block text-xs font-medium">
            {t('qc_entry_sku')}
            <span className="text-slate-400 font-normal ml-1">({t('qc_entry_sku_hint')})</span>
            <input
              value={skuCode}
              onChange={(e) => setSkuCode(e.target.value)}
              className="mt-1 w-full font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
              placeholder="SKU-…"
            />
          </label>
          {skuAlert?.active && skuAlert.message_es && (
            <div className="rounded-xl border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/50 p-3 text-sm text-amber-950 dark:text-amber-100">
              <p className="font-bold text-xs uppercase tracking-wide text-amber-800 dark:text-amber-200 mb-1">
                {t('qc_entry_sku_alert_title')}
              </p>
              <p>{skuAlert.message_es}</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-3 shadow-sm">
          <div className="grid grid-cols-1 gap-3">
            <label className="text-xs font-medium">
              {t('qc_entry_visc')}
              <span className="text-slate-400 font-normal ml-1">({t('qc_entry_visc_hint')})</span>
              <input
                inputMode="decimal"
                value={visc}
                onChange={(e) => setVisc(e.target.value)}
                className="mt-1 w-full text-lg font-mono rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-3 bg-white dark:bg-slate-900"
              />
            </label>
            <label className="text-xs font-medium">
              {t('qc_entry_temp')}
              <span className="text-slate-400 font-normal ml-1">({t('qc_entry_temp_hint')})</span>
              <input
                inputMode="decimal"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className="mt-1 w-full text-lg font-mono rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-3 bg-white dark:bg-slate-900"
              />
            </label>
            <label className="text-xs font-medium">
              {t('qc_entry_hum')}
              <span className="text-slate-400 font-normal ml-1">({t('qc_entry_hum_hint')})</span>
              <input
                inputMode="decimal"
                value={hum}
                onChange={(e) => setHum(e.target.value)}
                className="mt-1 w-full text-lg font-mono rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-3 bg-white dark:bg-slate-900"
              />
            </label>
          </div>

          {warnings.length > 0 && (
            <div className="space-y-2 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-3">
              {warnings.map((w) => (
                <div key={w.key}>
                  <p className="text-sm font-bold text-red-800 dark:text-red-200">{w.title}</p>
                  <p className="text-xs text-red-900 dark:text-red-100/90 mt-0.5">{w.body}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">{t('qc_entry_defects')}</p>
          <div className="flex flex-wrap gap-2">
            {DEFECT_CODES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDefect(d.id)}
                className={`min-h-[44px] min-w-[88px] px-3 py-2 rounded-xl text-sm font-bold border-2 transition ${
                  selectedDefects.has(d.id)
                    ? 'border-amber-500 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100'
                    : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50'
                }`}
              >
                {d.short}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <Camera size={18} />
              <span>{t('qc_entry_photo')}</span>
              <input type="file" accept="image/*" capture="environment" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
            </label>
            <Link
              to={scanTarget}
              className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 dark:text-teal-400"
            >
              <ScanLine size={18} /> {t('qc_entry_link_scan')}
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm space-y-3">
          <label className="block text-xs font-medium">
            {t('qc_entry_action')}
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-3 text-base"
            >
              <option value="">—</option>
              <option value="Ajuste de temperatura">{t('qc_entry_action_heat')}</option>
              <option value="Ajuste de goma">{t('qc_entry_action_glue')}</option>
              <option value="Parada">{t('qc_entry_action_stop')}</option>
              <option value="Ninguna">{t('qc_entry_action_none')}</option>
            </select>
          </label>

          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="animate-spin" size={22} /> : null}
            {t('qc_entry_save')}
          </button>
          {toast && <p className="text-center text-sm text-emerald-600 dark:text-emerald-400">{toast}</p>}
          {err && <p className="text-center text-sm text-red-600">{err}</p>}
        </section>

        {recent.length > 0 && (
          <section className="text-xs text-slate-500 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('qc_entry_recent')}</p>
            <ul className="space-y-2">
              {recent.map((r) => (
                <li key={r.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-white/50 dark:bg-slate-800/50">
                  <span className="font-mono font-bold">{r.order_no}</span>
                  {r.defect_codes?.length ? (
                    <span className="ml-2 text-amber-700 dark:text-amber-300">{r.defect_codes.join(', ')}</span>
                  ) : (
                    <span className="ml-2 opacity-70">OK</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
