import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { fetchWithAuth, API_BASE } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { useSync } from '../context/SyncContext';

export default function RcaReportPage({ backTo = '/mobile' }) {
  const { t } = useLanguage();
  const { isOnline, getCachedOrFetch, queueJsonPost, refreshPendingCount } = useSync();
  const [refData, setRefData] = useState(null);
  const [loadingRef, setLoadingRef] = useState(true);
  const [reclamoRef, setReclamoRef] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [skuCode, setSkuCode] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [ctqId, setCtqId] = useState('');
  const [inspectionPoint, setInspectionPoint] = useState('');
  const [prevDefects, setPrevDefects] = useState(null);
  const [dataNote, setDataNote] = useState('');
  const [orderForHint, setOrderForHint] = useState('');
  const [repeatSku, setRepeatSku] = useState(false);
  const [repeatShift, setRepeatShift] = useState(false);
  const [repeatMachine, setRepeatMachine] = useState(false);
  const [repeatMix, setRepeatMix] = useState(false);
  const [controlFailure, setControlFailure] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [notifyManager, setNotifyManager] = useState(true);
  const [busy, setBusy] = useState(false);
  const [hintBusy, setHintBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [err, setErr] = useState(null);
  const [recent, setRecent] = useState([]);

  const loadRef = useCallback(() => {
    setLoadingRef(true);
    Promise.all([
      getCachedOrFetch('quality/rca/reference-data', () =>
        fetchWithAuth(`${API_BASE}/quality/rca/reference-data`).then((r) => (r.ok ? r.json() : null))
      ),
      getCachedOrFetch('quality/rca/next-reclamo-ref', () =>
        fetchWithAuth(`${API_BASE}/quality/rca/next-reclamo-ref`).then((r) => (r.ok ? r.json() : null))
      ),
    ])
      .then(([data, next]) => {
        setRefData(data);
        if (next?.reclamo_ref) setReclamoRef(next.reclamo_ref);
      })
      .catch(() => setRefData(null))
      .finally(() => setLoadingRef(false));
  }, [getCachedOrFetch]);

  const loadRecent = useCallback(() => {
    getCachedOrFetch('quality/rca/reports/mine', () =>
      fetchWithAuth(`${API_BASE}/quality/rca/reports/mine?limit=12`).then((r) => (r.ok ? r.json() : []))
    )
      .then((rows) => setRecent(Array.isArray(rows) ? rows : []))
      .catch(() => setRecent([]));
  }, [getCachedOrFetch]);

  useEffect(() => {
    loadRef();
  }, [loadRef]);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const applyCorrelationHint = async () => {
    setHintBusy(true);
    setErr(null);
    try {
      const q = new URLSearchParams();
      if (skuCode.trim()) q.set('sku', skuCode.trim());
      if (orderForHint.trim()) q.set('order_no', orderForHint.trim());
      const data = await getCachedOrFetch(`quality/rca/correlation-hint:${q.toString()}`, () =>
        fetchWithAuth(`${API_BASE}/quality/rca/correlation-hint?${q.toString()}`).then((res) => (res.ok ? res.json() : {}))
      );
      if (data?.suggested_note_es) {
        setDataNote((prev) => (prev ? `${prev}\n\n${data.suggested_note_es}` : data.suggested_note_es));
      } else {
        setToast(t('rca_hint_empty'));
        setTimeout(() => setToast(null), 3000);
      }
    } catch (_) {
      setErr(t('rca_hint_error'));
    } finally {
      setHintBusy(false);
    }
  };

  const submit = async () => {
    setErr(null);
    setToast(null);
    if (!complaintText.trim() || complaintText.trim().length < 3) {
      setErr(t('claim_err_complaint'));
      return;
    }
    if (!reclamoRef.trim()) {
      setErr(t('rca_err_reclamo'));
      return;
    }
    if (prevDefects === null) {
      setErr(t('rca_err_prev_data'));
      return;
    }
    if (!controlFailure) {
      setErr(t('rca_err_control'));
      return;
    }
    setBusy(true);
    try {
      const body = {
        reclamo_ref: reclamoRef.trim(),
        customer_name: customerName.trim() || null,
        sku_code: skuCode.trim() || null,
        complaint_text: complaintText.trim(),
        ctq_id: ctqId.trim() || null,
        inspection_point: inspectionPoint.trim() || null,
        prev_defects_in_data: prevDefects,
        data_correlation_note: dataNote.trim() || null,
        repeat_same_sku: repeatSku,
        repeat_same_shift: repeatShift,
        repeat_same_machine: repeatMachine,
        repeat_same_mix: repeatMix,
        control_failure: controlFailure,
        corrective_action: correctiveAction.trim() || null,
        notify_plant_manager: notifyManager,
      };
      if (!isOnline) {
        await queueJsonPost({
          endpoint: `${API_BASE}/quality/rca/reports`,
          payload: body,
          entityType: 'report/rca',
          maxRetries: 5,
        });
        await refreshPendingCount();
        setToast(t('sync_saved_local') || 'Guardado localmente. Se enviará al conectar.');
        return;
      }
      const res = await fetchWithAuth(`${API_BASE}/quality/rca/reports`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data?.detail === 'string' ? data.detail : res.statusText);
        return;
      }
      setToast(data.message_es || data.message || t('rca_ok_saved'));
      loadRecent();
      fetchWithAuth(`${API_BASE}/quality/rca/next-reclamo-ref`)
        .then((r) => r.json())
        .then((n) => {
          if (n?.reclamo_ref) setReclamoRef(n.reclamo_ref);
        })
        .catch(() => {});
      setComplaintText('');
      setDataNote('');
      setPrevDefects(null);
      setControlFailure('');
      setCorrectiveAction('');
      setRepeatSku(false);
      setRepeatShift(false);
      setRepeatMachine(false);
      setRepeatMix(false);
    } catch (e) {
      setErr(e.message || 'Error');
    } finally {
      setBusy(false);
    }
  };

  const ctqOptions = refData?.ctq_options || [];
  const inspPoints = refData?.inspection_points || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-28">
      <header className="sticky top-0 z-10 flex items-center gap-2 px-3 py-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur border-b border-slate-200 dark:border-slate-700">
        <Link to={backTo} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
          <ArrowLeft size={22} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono text-amber-700 dark:text-amber-300 uppercase tracking-wider">RCA-REPORT-01</p>
          <h1 className="font-bold text-lg leading-tight">{t('rca_page_title')}</h1>
          <p className="text-xs text-slate-500">{t('rca_page_subtitle')}</p>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-3 shadow-sm">
          <h2 className="font-bold text-sm text-slate-700 dark:text-slate-200">{t('rca_section_header')}</h2>
          {loadingRef ? (
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} /> …
            </p>
          ) : null}
          <label className="block text-xs font-medium">
            {t('rca_field_reclamo')}
            <input
              value={reclamoRef}
              onChange={(e) => setReclamoRef(e.target.value)}
              className="mt-1 w-full font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
            />
          </label>
          <label className="block text-xs font-medium">
            {t('rca_field_customer')}
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
            />
          </label>
          <label className="block text-xs font-medium">
            {t('rca_field_sku')}
            <input
              value={skuCode}
              onChange={(e) => setSkuCode(e.target.value)}
              className="mt-1 w-full font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
            />
          </label>
          <label className="block text-xs font-medium">
            {t('rca_field_queja')} *
            <textarea
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
              placeholder={t('rca_queja_placeholder')}
            />
          </label>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4 shadow-sm">
          <h2 className="font-bold text-sm">{t('rca_section_analysis')}</h2>

          <label className="block text-xs font-medium">
            {t('rca_q_ctq')}
            <select
              value={ctqId}
              onChange={(e) => setCtqId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm"
            >
              <option value="">{t('claim_q5_empty')}</option>
              {ctqOptions.map((o) => (
                <option key={o.ctq_id} value={o.ctq_id}>
                  {o.label_es || o.ctq_id}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium">
            {t('rca_q_inspect')}
            <select
              value={inspectionPoint}
              onChange={(e) => setInspectionPoint(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm"
            >
              <option value="">{t('claim_q5_empty')}</option>
              {inspPoints.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label_es}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="text-xs font-medium mb-2">{t('rca_q_prev_data')}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="prev_def"
                  checked={prevDefects === true}
                  onChange={() => setPrevDefects(true)}
                />
                {t('rca_si')}
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="prev_def"
                  checked={prevDefects === false}
                  onChange={() => setPrevDefects(false)}
                />
                {t('rca_no')}
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium">{t('rca_ai_note_label')}</p>
              <button
                type="button"
                onClick={applyCorrelationHint}
                disabled={hintBusy}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50"
              >
                {hintBusy ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                {t('rca_btn_suggest_data')}
              </button>
            </div>
            <label className="block text-xs text-slate-500">
              {t('rca_order_for_hint')}
              <input
                value={orderForHint}
                onChange={(e) => setOrderForHint(e.target.value)}
                className="mt-1 w-full font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
                placeholder="ORD-…"
              />
            </label>
            <textarea
              value={dataNote}
              onChange={(e) => setDataNote(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2 text-sm"
              placeholder={t('rca_ai_note_placeholder')}
            />
          </div>

          <div>
            <p className="text-xs font-medium mb-2">{t('rca_q_repeat')}</p>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {[
                [repeatSku, setRepeatSku, 'rca_rep_sku'],
                [repeatShift, setRepeatShift, 'rca_rep_shift'],
                [repeatMachine, setRepeatMachine, 'rca_rep_machine'],
                [repeatMix, setRepeatMix, 'rca_rep_mix'],
              ].map(([val, set, key]) => (
                <label key={key} className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} />
                  {t(key)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium mb-2">{t('rca_q_control')}</p>
            <div className="space-y-2 text-sm">
              {refData?.control_failures?.map((c) => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="ctrl_fail"
                    value={c.id}
                    checked={controlFailure === c.id}
                    onChange={() => setControlFailure(c.id)}
                  />
                  {c.label_es}
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-3 shadow-sm">
          <h2 className="font-bold text-sm">{t('rca_section_footer')}</h2>
          <label className="block text-xs font-medium">
            {t('rca_field_corrective')}
            <textarea
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={notifyManager} onChange={(e) => setNotifyManager(e.target.checked)} />
            {t('rca_notify_manager')}
          </label>

          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="animate-spin" size={22} /> : null}
            {t('rca_btn_save_notify')}
          </button>
          {toast && <p className="text-center text-sm text-emerald-600 dark:text-emerald-400">{toast}</p>}
          {err && <p className="text-center text-sm text-red-600">{err}</p>}
        </section>

        {recent.length > 0 && (
          <section className="text-xs">
            <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">{t('rca_recent_title')}</h3>
            <ul className="space-y-2">
              {recent.map((r) => (
                <li key={r.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white/70 dark:bg-slate-800/50">
                  <span className="font-mono font-bold">{r.reclamo_ref}</span>
                  <p className="mt-1 line-clamp-2">{r.complaint_text}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
