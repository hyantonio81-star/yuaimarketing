import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Loader2, Megaphone } from 'lucide-react';
import { fetchWithAuth, API_BASE } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';

const Q5_OPTIONS = [
  { value: '', labelKey: 'claim_q5_empty' },
  { value: 'Estándar', labelKey: 'claim_q5_std' },
  { value: 'Inspección', labelKey: 'claim_q5_insp' },
  { value: 'Respuesta', labelKey: 'claim_q5_resp' },
  { value: 'Contención', labelKey: 'claim_q5_cont' },
];

export default function ClaimAnalysisPage({ backTo = '/mobile' }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isOnline, getCachedOrFetch, queueJsonPost, refreshPendingCount } = useSync();
  const role = (user?.role || 'staff').toString().toLowerCase();
  const isLeaderView = ['ceo', 'director', 'manager', 'leader'].includes(role);
  const rcaPath = backTo === '/dashboard' ? '/dashboard/rca-report' : '/mobile/rca-report';

  const [mapping, setMapping] = useState([]);
  const [loadingMap, setLoadingMap] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [complaintSummary, setComplaintSummary] = useState('');
  const [mappedCtq, setMappedCtq] = useState('');
  const [probableOrigin, setProbableOrigin] = useState('');
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [q4, setQ4] = useState('');
  const [q5, setQ5] = useState('');
  const [q5Notes, setQ5Notes] = useState('');
  const [skuCode, setSkuCode] = useState('');
  const [lotRef, setLotRef] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [followUpDue, setFollowUpDue] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [err, setErr] = useState(null);
  const [mine, setMine] = useState([]);
  const [topWeekly, setTopWeekly] = useState(null);

  const loadReference = useCallback(() => {
    setLoadingMap(true);
    getCachedOrFetch('quality/reference/queja-ctq-mapping', () =>
      fetchWithAuth(`${API_BASE}/quality/reference/queja-ctq-mapping`).then((r) => (r.ok ? r.json() : { items: [] }))
    )
      .then((r) => r || { items: [] })
      .then((data) => setMapping(Array.isArray(data?.items) ? data.items : []))
      .catch(() => setMapping([]))
      .finally(() => setLoadingMap(false));
  }, [getCachedOrFetch]);

  const loadMine = useCallback(() => {
    getCachedOrFetch('quality/claim-analyses/mine', () =>
      fetchWithAuth(`${API_BASE}/quality/claim-analyses/mine?limit=15`).then((r) => (r.ok ? r.json() : []))
    )
      .then((rows) => setMine(Array.isArray(rows) ? rows : []))
      .catch(() => setMine([]));
  }, [getCachedOrFetch]);

  const loadTop = useCallback(() => {
    if (!isLeaderView) return;
    getCachedOrFetch('quality/claim-analyses/top', () =>
      fetchWithAuth(`${API_BASE}/quality/claim-analyses/top?days=7&limit=3`).then((r) => (r.ok ? r.json() : null))
    )
      .then(setTopWeekly)
      .catch(() => setTopWeekly(null));
  }, [getCachedOrFetch, isLeaderView]);

  useEffect(() => {
    loadReference();
  }, [loadReference]);

  useEffect(() => {
    loadMine();
    loadTop();
  }, [loadMine, loadTop]);

  const applyRow = (row) => {
    setMappedCtq(row.ctq_mapeado || '');
    setProbableOrigin(row.origen_probable || '');
  };

  const resetForm = () => {
    setComplaintSummary('');
    setMappedCtq('');
    setProbableOrigin('');
    setQ1('');
    setQ2('');
    setQ3('');
    setQ4('');
    setQ5('');
    setQ5Notes('');
    setSkuCode('');
    setLotRef('');
    setCorrectiveAction('');
    setFollowUpDue('');
  };

  const submit = async () => {
    setErr(null);
    setToast(null);
    const cs = complaintSummary.trim();
    if (cs.length < 3) {
      setErr(t('claim_err_complaint'));
      return;
    }
    setBusy(true);
    try {
      const body = {
        customer_name: customerName.trim() || null,
        complaint_summary: cs,
        mapped_ctq: mappedCtq.trim() || null,
        probable_origin: probableOrigin.trim() || null,
        q1_ctq_failed: q1.trim() || null,
        q2_where_inspect: q2.trim() || null,
        q3_pre_ship_data: q3.trim() || null,
        q4_repeat_pattern: q4.trim() || null,
        q5_control_failure: q5.trim() || null,
        q5_notes: q5Notes.trim() || null,
        sku_code: skuCode.trim() || null,
        lot_ref: lotRef.trim() || null,
        corrective_action: correctiveAction.trim() || null,
        follow_up_due: followUpDue.trim() || null,
      };
      if (!isOnline) {
        await queueJsonPost({
          endpoint: `${API_BASE}/quality/claim-analyses`,
          payload: body,
          entityType: 'report/claim-analysis',
          maxRetries: 5,
        });
        await refreshPendingCount();
        setToast(t('sync_saved_local') || 'Guardado localmente. Se enviará al conectar.');
        return;
      }
      const res = await fetchWithAuth(`${API_BASE}/quality/claim-analyses`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data?.detail === 'string' ? data.detail : res.statusText);
        return;
      }
      setToast(t('claim_ok_saved'));
      resetForm();
      loadMine();
      loadTop();
    } catch (e) {
      setErr(e.message || 'Error');
    } finally {
      setBusy(false);
    }
  };

  const topRows = useMemo(() => (topWeekly?.top && Array.isArray(topWeekly.top) ? topWeekly.top : []), [topWeekly]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-28">
      <header className="sticky top-0 z-10 flex items-center gap-2 px-3 py-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur border-b border-slate-200 dark:border-slate-700">
        <Link to={backTo} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
          <ArrowLeft size={22} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg leading-tight">{t('claim_page_title')}</h1>
          <p className="text-xs text-slate-500">{t('claim_page_subtitle')}</p>
        </div>
        <Link to={rcaPath} className="text-xs font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap px-2">
          RCA
        </Link>
      </header>

      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {isLeaderView && topRows.length > 0 && (
          <section className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 shadow-sm">
            <h2 className="font-bold text-sm flex items-center gap-2 text-amber-900 dark:text-amber-100 mb-2">
              <Megaphone size={18} /> {t('claim_weekly_top_title')}
            </h2>
            <p className="text-xs text-amber-800/90 dark:text-amber-200/80 mb-3">{t('claim_weekly_note')}</p>
            <ul className="space-y-2 text-sm">
              {topRows.map((r) => (
                <li key={r.id} className="border border-amber-200 dark:border-amber-800 rounded-xl p-2 bg-white/60 dark:bg-slate-900/40">
                  <span className="font-mono text-xs text-slate-500">#{r.id}</span>
                  <p className="font-semibold mt-0.5 line-clamp-2">{r.complaint_summary}</p>
                  {r.mapped_ctq && (
                    <p className="text-xs text-amber-900 dark:text-amber-200 mt-1">
                      CTQ: {r.mapped_ctq}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <h2 className="font-bold text-sm flex items-center gap-2 mb-3">
            <ClipboardList size={18} /> {t('claim_mapping_title')}
          </h2>
          {loadingMap ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
              <Loader2 className="animate-spin" size={18} /> {t('claim_loading_map')}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-600 text-left">
                    <th className="py-2 pr-2">{t('claim_mapping_queja')}</th>
                    <th className="py-2 pr-2">{t('claim_mapping_ctq')}</th>
                    <th className="py-2">{t('claim_mapping_origen')}</th>
                    <th className="py-2 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {mapping.map((row) => (
                    <tr key={row.queja_es} className="border-b border-slate-100 dark:border-slate-700/80 align-top">
                      <td className="py-2 pr-2 text-slate-800 dark:text-slate-200">{row.queja_es}</td>
                      <td className="py-2 pr-2 text-slate-600 dark:text-slate-300">{row.ctq_mapeado}</td>
                      <td className="py-2 text-slate-600 dark:text-slate-300">{row.origen_probable}</td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => applyRow(row)}
                          className="text-indigo-600 dark:text-indigo-400 font-semibold whitespace-nowrap"
                        >
                          →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-3 shadow-sm">
          <h2 className="font-bold text-sm mb-2">{t('claim_form_section')}</h2>
          <label className="block text-xs font-medium">
            {t('claim_field_customer')}
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
            />
          </label>
          <label className="block text-xs font-medium">
            {t('claim_field_complaint')} *
            <textarea
              value={complaintSummary}
              onChange={(e) => setComplaintSummary(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs font-medium">
              {t('claim_field_mapped_ctq')}
              <input
                value={mappedCtq}
                onChange={(e) => setMappedCtq(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
              />
            </label>
            <label className="block text-xs font-medium">
              {t('claim_field_origin')}
              <input
                value={probableOrigin}
                onChange={(e) => setProbableOrigin(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-xs font-medium">
            {t('claim_q1')}
            <textarea value={q1} onChange={(e) => setQ1(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900" />
          </label>
          <label className="block text-xs font-medium">
            {t('claim_q2')}
            <textarea value={q2} onChange={(e) => setQ2(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900" />
          </label>
          <label className="block text-xs font-medium">
            {t('claim_q3')}
            <textarea value={q3} onChange={(e) => setQ3(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900" />
          </label>
          <label className="block text-xs font-medium">
            {t('claim_q4')}
            <textarea value={q4} onChange={(e) => setQ4(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900" />
          </label>
          <label className="block text-xs font-medium">
            {t('claim_q5')}
            <select
              value={q5}
              onChange={(e) => setQ5(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5"
            >
              {Q5_OPTIONS.map((o) => (
                <option key={o.value || 'empty'} value={o.value}>
                  {t(o.labelKey)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium">
            {t('claim_q5_notes')}
            <textarea value={q5Notes} onChange={(e) => setQ5Notes(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900" />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs font-medium">
              {t('claim_field_sku')}
              <input
                value={skuCode}
                onChange={(e) => setSkuCode(e.target.value)}
                className="mt-1 w-full font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
              />
            </label>
            <label className="block text-xs font-medium">
              {t('claim_field_lot')}
              <input
                value={lotRef}
                onChange={(e) => setLotRef(e.target.value)}
                className="mt-1 w-full font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-xs font-medium">
            {t('claim_field_corrective')}
            <textarea value={correctiveAction} onChange={(e) => setCorrectiveAction(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900" />
          </label>
          <label className="block text-xs font-medium">
            {t('claim_field_followup')}
            <input
              type="date"
              value={followUpDue}
              onChange={(e) => setFollowUpDue(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
            />
          </label>

          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="animate-spin" size={22} /> : null}
            {t('claim_btn_submit')}
          </button>
          {toast && <p className="text-center text-sm text-emerald-600 dark:text-emerald-400">{toast}</p>}
          {err && <p className="text-center text-sm text-red-600">{err}</p>}
        </section>

        <section className="text-xs">
          <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">{t('claim_mine_title')}</h3>
          {mine.length === 0 ? (
            <p className="text-slate-500">{t('claim_mine_empty')}</p>
          ) : (
            <ul className="space-y-2">
              {mine.map((r) => (
                <li key={r.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white/70 dark:bg-slate-800/50">
                  <span className="font-mono font-bold">#{r.id}</span>
                  <p className="mt-1 line-clamp-2">{r.complaint_summary}</p>
                  {r.sku_code && <p className="text-slate-500 mt-0.5">SKU: {r.sku_code}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
