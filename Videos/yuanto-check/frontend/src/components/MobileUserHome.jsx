import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Camera, Award, BarChart2, Calendar, Trophy, ClipboardCheck, LayoutDashboard, Sparkles, Calculator, Layers, ScanLine, ClipboardList, ScrollText, PenLine, ListOrdered, MessagesSquare, Search, ListChecks, BookMarked, Gauge, LayoutGrid, Database, Waypoints, FileText, FileStack, BookImage, Ruler, ScanEye, Tv, ShieldAlert, CheckCircle2, Factory, BarChart3, Timer, Workflow } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSync } from '../context/SyncContext';
import { fetchWithAuth, API_BASE } from '../api';
import SyncStatusBar from './SyncStatusBar';

const MobileUserHome = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isGerencia = ['ceo', 'director', 'manager', 'leader'].includes((user?.role || 'staff').toString().toLowerCase());
  const { getCachedOrFetch, queueSubmitTask, isOnline, refreshPendingCount, failedCount, deadLetterCount, retryFailedNow, discardFailedNow } = useSync();
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRefs = useRef({});
  const [incentiveMe, setIncentiveMe] = useState(null);

  useEffect(() => {
    getCachedOrFetch('incentives/me', () =>
      fetchWithAuth(`${API_BASE}/incentives/me`).then((r) => (r.ok ? r.json() : null))
    ).then(setIncentiveMe).catch(() => {});
  }, [getCachedOrFetch]);

  const loadSmartTasks = useCallback(() => {
    setTasksLoading(true);
    getCachedOrFetch('checklists/smart', () =>
      fetchWithAuth(`${API_BASE}/checklists/smart`).then((r) => (r.ok ? r.json() : null))
    )
      .then((data) => {
        const apiTasks = (data?.tasks || []).map((t) => ({
          id: t.id,
          title: t.task_name,
          done: !!t.completed,
          photo: null,
          requiresPhoto: t.requires_photo || t.requires_ppe,
        }));
        setTasks(apiTasks);
      })
      .catch(() => setTasks([]))
      .finally(() => setTasksLoading(false));
  }, [getCachedOrFetch]);

  useEffect(() => {
    loadSmartTasks();
  }, [loadSmartTasks]);

  useEffect(() => {
    const onSynced = (event) => {
      if (event?.detail?.kind !== 'synced') return;
      loadSmartTasks();
    };
    window.addEventListener('yuanto-sync-event', onSynced);
    return () => window.removeEventListener('yuanto-sync-event', onSynced);
  }, [loadSmartTasks]);

  const completed = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const points = incentiveMe?.total_pts ?? 0;

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const onFileChange = (taskId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, photo: file } : t))
    );
  };

  const sendReport = async () => {
    setSending(true);
    setToast(null);
    const doneTasks = tasks.filter((t) => t.done);
    try {
      if (!isOnline) {
        for (const task of doneTasks) {
          await queueSubmitTask({
            task_id: task.id,
            fileBlob: task.photo || null,
          });
        }
        await refreshPendingCount();
        setToast(doneTasks.length ? (t('sync_saved_local') || 'Guardado localmente. Se enviará al conectar.') : (t('sync_nothing_to_send') || 'Nada que enviar.'));
      } else {
        for (const task of doneTasks) {
          const formData = new FormData();
          formData.append('task_id', task.id);
          if (task.photo) formData.append('file', task.photo);
          const res = await fetchWithAuth(`${API_BASE}/submit-task`, { method: 'POST', body: formData });
          if (!res.ok) throw new Error('Error');
        }
        setToast(doneTasks.length ? '¡Registro exitoso!' : 'Nada que enviar.');
      }
    } catch (_) {
      setToast(t('sync_error') || 'Error. Intente de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-28 font-sans text-slate-900 dark:text-slate-100 pt-14">
      <SyncStatusBar />
      {/* Header: score and progress */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-b-[2rem] shadow-lg text-white">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm opacity-80">¡Hola, {user?.name || 'Usuario'}!</p>
          <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
            <Award size={14} className="text-yellow-300" />
            <span>Nivel 5</span>
          </div>
        </div>
        <h2 className="text-sm opacity-80 font-bold tracking-tighter uppercase">Mi Puntaje</h2>
        <div className="flex justify-between items-end mt-2">
          <span className="text-5xl font-black italic">{points} <small className="text-sm font-light">pts</small></span>
        </div>
        <p className="text-2xl font-bold mb-1 italic mt-2">Mi Progreso Hoy</p>
        <p className="text-xs opacity-70 mb-4 font-light text-yellow-100">
          Mi progreso de hoy
        </p>
        <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden">
          <div
            className="bg-yellow-400 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs font-bold">
          <span>{progress}% COMPLETADO</span>
          <span>
            {completed}/{total} TAREAS
          </span>
        </div>
      </div>

      {/* Mi ranking · Empleado del Mes */}
      {incentiveMe && (
        <div className="mx-4 mt-2 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-2">
            <Trophy size={16} className="text-amber-500" /> Mi ranking
          </h3>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Puntos del mes</span>
            <span className="font-bold text-amber-600">{incentiveMe.total_pts ?? 0} pts</span>
          </div>
          {incentiveMe.rank != null && (
            <p className="text-xs text-slate-500 mt-1">Posición: #{incentiveMe.rank}</p>
          )}
          {(incentiveMe.is_resting || incentiveMe.cap_reason) && (
            <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs font-bold text-amber-800">
                ¿Por qué no estoy en TOP 10?
              </p>
              {incentiveMe.resting_reason && <p className="text-xs text-amber-700 mt-0.5">{incentiveMe.resting_reason}</p>}
              {incentiveMe.cap_reason && <p className="text-xs text-amber-700 mt-0.5">{incentiveMe.cap_reason}</p>}
            </div>
          )}
        </div>
      )}

      {/* Daily checklist */}
      <div className="p-5">
        {(failedCount > 0 || deadLetterCount > 0) && (
          <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-800">
            <div className="text-xs font-semibold mb-2">
              {t('sync_issues_label') || 'Sync issues'}: {failedCount} {t('sync_failed_label') || 'failed'} / {deadLetterCount} {t('sync_dead_letter_label') || 'dead-letter'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => retryFailedNow()}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white"
              >
                {t('sync_retry_now') || 'Retry now'}
              </button>
              <button
                type="button"
                onClick={() => discardFailedNow()}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300"
              >
                {t('sync_discard_failed') || 'Discard failed'}
              </button>
            </div>
          </div>
        )}
        <Link
          to="/mobile/dashboard"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg active:scale-[0.98] transition"
        >
          <LayoutDashboard size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">Mi Dashboard</p>
            <p className="text-xs opacity-90">{t('mobile_home_subtitle1')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/smart"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg active:scale-[0.98] transition"
        >
          <ClipboardCheck size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">Smart Checklist</p>
            <p className="text-xs opacity-90">{t('mobile_home_subtitle2')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/inspeccion-maq"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-800 text-white shadow-lg active:scale-[0.98] transition"
        >
          <Factory size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_inspeccion_maq')}</p>
            <p className="text-xs opacity-90">{t('imaq_title') || 'Inspeccion MAQ'}</p>
          </div>
        </Link>
        <Link
          to="/mobile/inspeccion-caja"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-800 text-white shadow-lg active:scale-[0.98] transition"
        >
          <ScanLine size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_inspeccion_caja')}</p>
            <p className="text-xs opacity-90">{t('icaja_title') || 'Inspeccion Caja'}</p>
          </div>
        </Link>
        <Link
          to="/mobile/roll-calc"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-lg active:scale-[0.98] transition"
        >
          <Calculator size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_roll_calc') || '잔롤 계산기'}</p>
            <p className="text-xs opacity-90">{t('rollcalc_nav_sub')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/bom-corrugado"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-800 text-white shadow-lg active:scale-[0.98] transition"
        >
          <Layers size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_bom_corrugado')}</p>
            <p className="text-xs opacity-90">{t('bomcorr_nav_sub')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/inventario-escaner"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-800 text-white shadow-lg active:scale-[0.98] transition"
        >
          <ScanLine size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_plancha_scan')}</p>
            <p className="text-xs opacity-90">{t('scan_nav_sub')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/calidad-defectos"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-800 text-white shadow-lg active:scale-[0.98] transition"
        >
          <ClipboardList size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_calidad_defectos')}</p>
            <p className="text-xs opacity-90">{t('calidad_nav_sub')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/sop-qc-01"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg active:scale-[0.98] transition"
        >
          <ScrollText size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_sop_qc')}</p>
            <p className="text-xs opacity-90">SOP-QC-01 · {t('sop_qc_title')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/qc-entry"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-800 text-white shadow-lg active:scale-[0.98] transition"
        >
          <PenLine size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_qc_entry')}</p>
            <p className="text-xs opacity-90">{t('qc_entry_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/capitulo3-cierre"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-900 text-white shadow-lg active:scale-[0.98] transition"
        >
          <BookMarked size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_cap3_cierre')}</p>
            <p className="text-xs opacity-90">{t('cap3_cierre_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/msa-capitulo4"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-900 text-white shadow-lg active:scale-[0.98] transition"
        >
          <Gauge size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_msa_c4')}</p>
            <p className="text-xs opacity-90">{t('msa_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/medicion-421"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-cyan-700 to-slate-900 text-white shadow-lg active:scale-[0.98] transition"
        >
          <Layers size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_medicion_421')}</p>
            <p className="text-xs opacity-90">{t('ch421_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/calidad-diaria"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-950 text-white shadow-lg active:scale-[0.98] transition"
        >
          <LayoutGrid size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_calidad_diaria')}</p>
            <p className="text-xs opacity-90">{t('dq_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/capitulo4-datos"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-950 text-white shadow-lg active:scale-[0.98] transition"
        >
          <Database size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_cap4_datos')}</p>
            <p className="text-xs opacity-90">{t('ch43_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/capitulo4-inspeccion"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-950 text-white shadow-lg active:scale-[0.98] transition"
        >
          <Waypoints size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_cap4_inspeccion')}</p>
            <p className="text-xs opacity-90">{t('ch44_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/bitacora-calidad"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-emerald-700 to-slate-900 text-white shadow-lg active:scale-[0.98] transition"
        >
          <FileText size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_qc_bitacora')}</p>
            <p className="text-xs opacity-90">{t('qcb_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/capitulo4-formularios-msa"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-950 text-white shadow-lg active:scale-[0.98] transition"
        >
          <FileStack size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_cap4_form_msa')}</p>
            <p className="text-xs opacity-90">{t('ch456_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/capitulo4-concordancia"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-purple-950 text-white shadow-lg active:scale-[0.98] transition"
        >
          <BookImage size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_cap4_attr')}</p>
            <p className="text-xs opacity-90">{t('ch47_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/capitulo4-variables"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-950 text-white shadow-lg active:scale-[0.98] transition"
        >
          <Ruler size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_cap4_vars')}</p>
            <p className="text-xs opacity-90">{t('ch48_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/capitulo4-visual"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-950 text-white shadow-lg active:scale-[0.98] transition"
        >
          <ScanEye size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_cap4_visual')}</p>
            <p className="text-xs opacity-90">{t('ch49_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/capitulo4-resumen-ejecutivo"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-indigo-700 to-slate-900 text-white shadow-lg active:scale-[0.98] transition"
        >
          <Tv size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_cap4_exec')}</p>
            <p className="text-xs opacity-90">{t('ch410_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/capitulo4-lpa-escalacion"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-rose-700 to-red-950 text-white shadow-lg active:scale-[0.98] transition"
        >
          <ShieldAlert size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_cap4_lpa_esc')}</p>
            <p className="text-xs opacity-90">{t('ch4113_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/capitulo4-cierre-implementacion"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-950 text-white shadow-lg active:scale-[0.98] transition"
        >
          <CheckCircle2 size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_cap4_cierre')}</p>
            <p className="text-xs opacity-90">{t('ch414416_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/capitulo5-corrugador"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-amber-700 to-orange-950 text-white shadow-lg active:scale-[0.98] transition"
        >
          <Factory size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_cap5_corrugador')}</p>
            <p className="text-xs opacity-90">{t('ch5_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/capitulo6-conversion"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-violet-700 to-purple-950 text-white shadow-lg active:scale-[0.98] transition"
        >
          <BarChart3 size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_cap6_conversion')}</p>
            <p className="text-xs opacity-90">{t('ch6_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/capitulo7-smed"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-cyan-700 to-slate-900 text-white shadow-lg active:scale-[0.98] transition"
        >
          <Timer size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_cap7_smed')}</p>
            <p className="text-xs opacity-90">{t('ch7_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/capitulo8-wip-flujo"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-sky-700 to-indigo-950 text-white shadow-lg active:scale-[0.98] transition"
        >
          <Workflow size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_cap8_wip')}</p>
            <p className="text-xs opacity-90">{t('ch8_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/capitulo9-oee-kaizen"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-teal-700 to-emerald-950 text-white shadow-lg active:scale-[0.98] transition"
        >
          <Gauge size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_cap9_oee')}</p>
            <p className="text-xs opacity-90">{t('ch9_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/calidad-metodologia"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-indigo-700 to-violet-900 text-white shadow-lg active:scale-[0.98] transition"
        >
          <ListOrdered size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_metodologia_ctq')}</p>
            <p className="text-xs opacity-90">{t('metodo_page_title')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/claim-analysis"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-rose-700 to-red-900 text-white shadow-lg active:scale-[0.98] transition"
        >
          <MessagesSquare size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_claim_analysis')}</p>
            <p className="text-xs opacity-90">{t('claim_page_subtitle')}</p>
          </div>
        </Link>
        <Link
          to="/mobile/rca-report"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-950 text-white shadow-lg active:scale-[0.98] transition"
        >
          <Search size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('nav_rca_report')}</p>
            <p className="text-xs opacity-90">{t('rca_page_subtitle')}</p>
          </div>
        </Link>
        {isGerencia && (
          <Link
            to="/mobile/chapter3-checklist"
            className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-violet-800 to-indigo-950 text-white shadow-lg active:scale-[0.98] transition"
          >
            <ListChecks size={28} className="flex-shrink-0" />
            <div>
              <p className="font-bold">{t('nav_chapter3_checklist')}</p>
              <p className="text-xs opacity-90">{t('ch3_page_subtitle')}</p>
            </div>
          </Link>
        )}
        <Link
          to="/mobile/crm"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg active:scale-[0.98] transition"
        >
          <Sparkles size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">CRM móvil</p>
            <p className="text-xs opacity-90">Memos IA · ubicación · visitas · alertas</p>
          </div>
        </Link>
        <Link
          to="/mobile/field-report"
          className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg active:scale-[0.98] transition"
        >
          <Sparkles size={28} className="flex-shrink-0" />
          <div>
            <p className="font-bold">{t('field_photo_nav') || 'Reporte con foto (IA)'}</p>
            <p className="text-xs opacity-90">{t('field_photo_nav_sub') || 'Mantenimiento en planta'}</p>
          </div>
        </Link>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-lg text-slate-700 uppercase tracking-tight">
            Lista de Hoy
          </h3>
        </div>
        {tasksLoading && (
          <p className="text-slate-400 text-sm text-center py-4">Cargando tareas...</p>
        )}
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-2xl flex flex-col transition-all ${
                task.done
                  ? 'bg-white dark:bg-slate-800 opacity-70'
                  : 'bg-white dark:bg-slate-800 shadow-md border-l-4 border-indigo-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      task.done ? 'bg-green-500 border-green-500 text-white' : 'border-slate-200'
                    }`}
                  >
                    {task.done && <CheckCircle size={20} />}
                  </button>
                  <div>
                    <p
                      className={`font-bold ${
                        task.done ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </p>
                  </div>
                </div>
                {!task.done && <Camera size={20} className="text-slate-300 flex-shrink-0" />}
              </div>
              <div className="mt-3">
                <label className="block text-xs font-bold text-indigo-500 uppercase mb-1">
                  Foto de evidencia
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700"
                  onChange={(e) => onFileChange(task.id, e)}
                />
                {task.photo && (
                  <span className="text-[10px] text-green-600 ml-2">✓ {task.photo.name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Send report button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 safe-area-pb">
        <button
          type="button"
          disabled={sending}
          onClick={sendReport}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl active:scale-[0.98] transition disabled:opacity-50"
        >
          ENVIAR REPORTE <br />
          <span className="text-xs font-normal opacity-70">Enviar reporte</span>
        </button>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-around py-2 bg-white/90 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-700 text-[10px]">
        <div className="flex flex-col items-center gap-0.5 text-indigo-600 font-bold">
          <CheckCircle size={22} />
          <span>Tareas</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-slate-400">
          <BarChart2 size={22} />
          <span>Reporte</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-slate-400">
          <Calendar size={22} />
          <span>Calendario</span>
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 left-4 right-4 bg-slate-800 text-white py-3 px-4 rounded-xl text-center text-sm shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
};

export default MobileUserHome;
