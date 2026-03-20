import { useState, useEffect } from "react";
import {
  Clock,
  Zap,
  DollarSign,
  AlertTriangle,
  Bot,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Building2,
  FileCheck,
  Store,
  BarChart3,
  FileText,
  Video,
  MessageCircle,
  Target,
  Users,
  Settings,
  BookOpen,
  Pencil,
  X,
  Plus,
  ClipboardCheck,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import ModuleCard from "../components/ModuleCard";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api, kpiApi, auditorApi, getApiErrorMessage } from "../lib/api";

const KPI_CATEGORIES = [
  { value: "financial", labelKey: "dashboard.kpiFinancial" },
  { value: "customer", labelKey: "dashboard.kpiCustomer" },
  { value: "process", labelKey: "dashboard.kpiProcess" },
  { value: "learning", labelKey: "dashboard.kpiLearning" },
];

export default function Dashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [routine, setRoutine] = useState(null);
  const [runningTask, setRunningTask] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [copilotText, setCopilotText] = useState("");
  const [copilotResult, setCopilotResult] = useState(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotError, setCopilotError] = useState(null);
  const [leadCount, setLeadCount] = useState(null);
  const [showRevenue, setShowRevenue] = useState(false);
  const [kpiGoals, setKpiGoals] = useState([]);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [showKpiEdit, setShowKpiEdit] = useState(false);
  const [kpiEditDraft, setKpiEditDraft] = useState([]);
  const [kpiSaveLoading, setKpiSaveLoading] = useState(false);
  const [kpiSaveError, setKpiSaveError] = useState(null);
  const [kpiLoadError, setKpiLoadError] = useState(null);
  const [routineError, setRoutineError] = useState(null);
  const [auditorError, setAuditorError] = useState(null);
  const [alertsError, setAlertsError] = useState(null);
  const [auditorReport, setAuditorReport] = useState(null);
  const [auditorLoading, setAuditorLoading] = useState(false);
  const [auditorExpanded, setAuditorExpanded] = useState(false);

  const fetchRoutine = () => {
    setRoutineError(null);
    api.get("/nexus/daily-routine")
      .then((r) => setRoutine(r.data))
      .catch((e) => setRoutineError(getApiErrorMessage(e, t("dashboard.loadFailed"))));
  };

  useEffect(() => {
    fetchRoutine();
  }, []);

  useEffect(() => {
    api.get("/b2b/leads", { params: { limit: 1 } })
      .then((r) => {
        const data = r?.data;
        if (data && typeof data === "object" && !("error" in data)) {
          const total = data.total;
          if (typeof total === "number" && total >= 0) setLeadCount(total);
          else if (Array.isArray(data.leads)) setLeadCount(data.leads.length);
          else setLeadCount(null);
        } else setLeadCount(null);
      })
      .catch(() => setLeadCount(null));
  }, []);

  const fetchKpiGoals = () => {
    setKpiLoading(true);
    setKpiLoadError(null);
    kpiApi.getGoals()
      .then((d) => setKpiGoals(d?.goals ?? []))
      .catch((e) => {
        setKpiGoals([]);
        setKpiLoadError(getApiErrorMessage(e, t("dashboard.loadFailed")));
      })
      .finally(() => setKpiLoading(false));
  };

  useEffect(() => {
    fetchKpiGoals();
  }, []);

  const fetchAuditorReport = () => {
    setAuditorLoading(true);
    setAuditorError(null);
    auditorApi.getReport()
      .then((d) => setAuditorReport(d))
      .catch((e) => {
        setAuditorReport(null);
        setAuditorError(getApiErrorMessage(e, t("dashboard.loadFailed")));
      })
      .finally(() => setAuditorLoading(false));
  };

  useEffect(() => {
    fetchAuditorReport();
  }, []);

  const goalsWithCurrent = kpiGoals.map((g) => {
    const current = g.current ?? (leadCount != null && (g.id === "b2b-leads" || /lead/i.test(g.name)) ? leadCount : undefined);
    const target = Number(g.target) || 0;
    const achievement = target > 0 && typeof current === "number" ? Math.min(100, Math.round((current / target) * 100)) : null;
    return { ...g, current, achievement };
  });

  const handleOpenKpiEdit = () => {
    setKpiSaveError(null);
    setKpiEditDraft(kpiGoals.length ? kpiGoals.map((g) => ({ ...g })) : [{ id: "goal-1", name: "", target: 0, current: 0, category: "financial" }]);
    setShowKpiEdit(true);
  };

  const handleSaveKpiGoals = () => {
    const normalized = kpiEditDraft.filter((g) => g.name?.trim()).map((g, i) => ({
      id: g.id || `goal-${i + 1}`,
      name: String(g.name).trim(),
      target: Number(g.target) || 0,
      current: g.current != null ? Number(g.current) : undefined,
      category: g.category || "financial",
      deadline: g.deadline || undefined,
      unit: g.unit || undefined,
    }));
    setKpiSaveLoading(true);
    setKpiSaveError(null);
    kpiApi.setGoals(normalized)
      .then((d) => {
        setKpiGoals(d?.goals ?? []);
        setShowKpiEdit(false);
      })
      .catch((e) => {
        setKpiSaveError(getApiErrorMessage(e, t("dashboard.saveFailed")));
      })
      .finally(() => setKpiSaveLoading(false));
  };

  const fetchAlerts = () => {
    setAlertsError(null);
    api.get("/nexus/proactive-alerts")
      .then((r) => setAlerts(r.data))
      .catch((e) => {
        setAlerts({ alerts: [] });
        setAlertsError(getApiErrorMessage(e, t("dashboard.loadFailed")));
      });
  };

  const handleCopilotRequest = () => {
    if (!copilotText.trim()) return;
    setCopilotLoading(true);
    setCopilotResult(null);
    setCopilotError(null);
    api.post("/nexus/handle-request", { request: copilotText.trim() })
      .then((r) => {
        setCopilotResult(r.data);
        setCopilotError(null);
      })
      .catch((e) => {
        setCopilotResult(null);
        const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.apiMessage ?? e?.message;
        setCopilotError(typeof msg === "string" ? msg : t("dashboard.copilotError"));
      })
      .finally(() => setCopilotLoading(false));
  };

  const todayLabel = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {t("dashboard.welcome")}{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {todayLabel} · {t("dashboard.todaySummary")}
        </p>
      </header>

      {/* KPI — BSC 4관점 · 목표 대비 진행 */}
      <section className="mb-8 rounded-xl border-2 border-primary/20 bg-card p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t("dashboard.kpiSectionTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t("dashboard.kpiSectionSubtitle")}</p>
          </div>
          <button
            type="button"
            onClick={handleOpenKpiEdit}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Pencil className="w-4 h-4" />
            {t("dashboard.kpiEditGoals")}
          </button>
        </div>
        {kpiLoadError && <p className="text-xs text-destructive mb-3">{kpiLoadError}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { cat: "financial", key: "dashboard.kpiFinancial", Icon: DollarSign, color: "text-pillar2" },
            { cat: "customer", key: "dashboard.kpiCustomer", Icon: Users, color: "text-pillar3" },
            { cat: "process", key: "dashboard.kpiProcess", Icon: Settings, color: "text-pillar4" },
            { cat: "learning", key: "dashboard.kpiLearning", Icon: BookOpen, color: "text-primary" },
          ].map(({ cat, key, Icon, color }) => {
            const items = goalsWithCurrent.filter((g) => g.category === cat);
            const sumTarget = items.reduce((a, g) => a + (Number(g.target) || 0), 0);
            const sumCurrent = items.reduce((a, g) => a + (g.current ?? 0), 0);
            return (
              <div key={cat} className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <span className="text-sm font-medium text-foreground">{t(key)}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {items.length ? (sumTarget > 0 ? `${sumCurrent} / ${sumTarget}` : "—") : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{items.length ? t("dashboard.kpiGoalsCount", { count: items.length }) : t("dashboard.kpiEditGoals")}</p>
              </div>
            );
          })}
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            {t("dashboard.kpiGoalProgress")}
          </h3>
          {kpiLoading ? (
            <p className="text-sm text-muted-foreground py-4">{t("common.loading")}</p>
          ) : goalsWithCurrent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{t("dashboard.noGoalsHint")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {goalsWithCurrent.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/50 px-4 py-2">
                  <span className="text-muted-foreground truncate flex-1">{g.name || g.id}</span>
                  <span className="font-medium text-foreground shrink-0">
                    {g.current != null ? g.current : "—"} / {g.target || "—"}
                    {g.unit ? ` ${g.unit}` : ""}
                  </span>
                  <span className={`shrink-0 text-xs font-medium ${g.achievement != null ? (g.achievement >= 100 ? "text-green-600" : g.achievement >= 80 ? "text-foreground" : "text-amber-600") : "text-muted-foreground"}`}>
                    {g.achievement != null ? `${g.achievement}%` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* KPI 목표 설정 모달 */}
      {showKpiEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowKpiEdit(false)}>
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">{t("dashboard.kpiEditGoals")}</h3>
              <button type="button" onClick={() => setShowKpiEdit(false)} className="p-1 rounded hover:bg-muted text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {kpiEditDraft.map((g, i) => (
                <div key={g.id || i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 rounded-lg border border-border p-3 bg-muted/20">
                  <input
                    type="text"
                    value={g.name ?? ""}
                    onChange={(e) => {
                      const next = [...kpiEditDraft];
                      next[i] = { ...next[i], name: e.target.value };
                      setKpiEditDraft(next);
                    }}
                    placeholder={t("dashboard.goalNamePlaceholder")}
                    className="sm:col-span-4 rounded border border-border bg-background px-2 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    min={0}
                    value={g.target ?? ""}
                    onChange={(e) => {
                      const next = [...kpiEditDraft];
                      next[i] = { ...next[i], target: e.target.value === "" ? 0 : Number(e.target.value) };
                      setKpiEditDraft(next);
                    }}
                    placeholder={t("dashboard.kpiTarget")}
                    className="sm:col-span-2 rounded border border-border bg-background px-2 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    min={0}
                    value={g.current ?? ""}
                    onChange={(e) => {
                      const next = [...kpiEditDraft];
                      next[i] = { ...next[i], current: e.target.value === "" ? undefined : Number(e.target.value) };
                      setKpiEditDraft(next);
                    }}
                    placeholder={t("dashboard.kpiCurrent")}
                    className="sm:col-span-2 rounded border border-border bg-background px-2 py-1.5 text-sm"
                  />
                  <select
                    value={g.category ?? "financial"}
                    onChange={(e) => {
                      const next = [...kpiEditDraft];
                      next[i] = { ...next[i], category: e.target.value };
                      setKpiEditDraft(next);
                    }}
                    className="sm:col-span-2 rounded border border-border bg-background px-2 py-1.5 text-sm"
                  >
                    {KPI_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{t(c.labelKey)}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setKpiEditDraft(kpiEditDraft.filter((_, j) => j !== i))}
                    className="sm:col-span-2 rounded border border-destructive/50 text-destructive px-2 py-1.5 text-sm hover:bg-destructive/10"
                  >
                    {t("dashboard.kpiRemove")}
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setKpiEditDraft([...kpiEditDraft, { id: `goal-${Date.now()}`, name: "", target: 0, current: 0, category: "financial" }])}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:bg-muted/30"
              >
                <Plus className="w-4 h-4" />
                {t("dashboard.kpiAddGoal")}
              </button>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              {kpiSaveError && (
                <p className="mr-auto self-center text-xs text-destructive">{kpiSaveError}</p>
              )}
              <button type="button" onClick={() => setShowKpiEdit(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
                {t("common.cancel")}
              </button>
              <button type="button" onClick={handleSaveKpiGoals} disabled={kpiSaveLoading} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {kpiSaveLoading ? t("common.loading") : t("dashboard.kpiSave")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 감사 요약 (KPI 감사원) */}
      <section className="mb-8 rounded-xl border-2 border-primary/20 bg-card p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">{t("dashboard.auditorTitle")}</h2>
          </div>
          <button
            type="button"
            onClick={() => { setAuditorExpanded(!auditorExpanded); if (!auditorReport && !auditorLoading) fetchAuditorReport(); }}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            {auditorExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {t("dashboard.auditorDetail")}
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{t("dashboard.auditorSummary")}</p>
        {auditorError && <p className="text-xs text-destructive mb-3">{auditorError}</p>}
        {auditorLoading ? (
          <p className="text-sm text-muted-foreground py-4">{t("common.loading")}</p>
        ) : auditorReport?.summary ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase">{t("dashboard.auditorRoutine")}</p>
                <p className="text-lg font-bold text-foreground">
                  {auditorReport.summary.routine_success ?? 0} / {auditorReport.summary.routine_total ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.auditorRoutineSuccess")} / {auditorReport.summary.routine_error ?? 0} {t("dashboard.auditorRoutineError")}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase">{t("dashboard.auditorKpi")}</p>
                <p className="text-lg font-bold text-foreground">
                  {auditorReport.summary.kpi_on_track ?? 0} / {auditorReport.summary.kpi_goals_count ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">{t("dashboard.auditorKpiOnTrack")} / {t("dashboard.auditorKpiGoals")}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase">{t("dashboard.auditorAlerts")}</p>
                <p className="text-lg font-bold text-foreground">{auditorReport.summary.alerts_count ?? 0}</p>
              </div>
              {auditorReport.generated_at && (
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase">{t("dashboard.createdAtLabel")}</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(auditorReport.generated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            {auditorExpanded && (
              <>
                {Array.isArray(auditorReport.alerts) && auditorReport.alerts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      {t("dashboard.auditorAlerts")}
                    </h3>
                    <ul className="space-y-1 text-sm">
                      {auditorReport.alerts.slice(0, 10).map((a, i) => (
                        <li key={i} className={`rounded px-2 py-1 ${a.priority === "high" ? "bg-destructive/10 text-destructive" : a.priority === "medium" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-muted/50 text-muted-foreground"}`}>
                          {a.type}: {a.message}
                        </li>
                      ))}
                      {auditorReport.alerts.length > 10 && <li className="text-xs text-muted-foreground">… +{auditorReport.alerts.length - 10}</li>}
                    </ul>
                  </div>
                )}
                {Array.isArray(auditorReport.recommendations) && auditorReport.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">{t("dashboard.auditorRecommendations")}</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {auditorReport.recommendations.slice(0, 5).map((r, i) => (
                        <li key={i} className="rounded px-2 py-1 bg-muted/30">
                          {r.message} {r.for_agent ? `(${r.for_agent})` : ""}
                        </li>
                      ))}
                      {auditorReport.recommendations.length > 5 && <li className="text-xs">… +{auditorReport.recommendations.length - 5}</li>}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        ) : auditorReport && !auditorReport.summary ? (
          <p className="text-sm text-muted-foreground py-4">{t("dashboard.noAuditorReport")}</p>
        ) : null}
      </section>

      {/* 첫 E2E 실행 — 한 줄로 끝까지 */}
      <section className="mb-8 rounded-xl border-2 border-primary/30 bg-primary/10 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">{t("dashboard.e2eTitle")}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t("dashboard.e2eDesc")}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/shorts"
            className="flex items-center gap-4 rounded-xl border-2 border-border bg-card p-5 hover:border-primary hover:bg-primary/10 transition-colors"
          >
            <div className="p-3 rounded-xl bg-red-500/15 text-red-500">
              <Video className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{t("dashboard.e2eShortsTitle")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.e2eShortsDesc")}</p>
            </div>
            <span className="text-sm font-medium text-primary shrink-0">{t("dashboard.goArrow")}</span>
          </Link>
          <Link
            to="/seo/threads-commerce"
            className="flex items-center gap-4 rounded-xl border-2 border-border bg-card p-5 hover:border-primary hover:bg-primary/10 transition-colors"
          >
            <div className="p-3 rounded-xl bg-black/80 text-white">
              <MessageCircle className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{t("dashboard.e2eThreadsTitle")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.e2eThreadsDesc")}</p>
            </div>
            <span className="text-sm font-medium text-primary shrink-0">{t("dashboard.goArrow")}</span>
          </Link>
        </div>
      </section>

      {/* 콘텐츠 허브: B2C·제품 분석·블로그 한곳 + B2B 별도 섹션 */}
      <section className="mb-8 rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">{t("dashboard.hubTitle")}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t("dashboard.hubSubtitle")}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Link
            to="/b2c"
            className="flex flex-col rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:bg-card/80 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <Store className="w-5 h-5 text-pillar3" />
              <span className="font-medium text-foreground">{t("dashboard.hubB2cTitle")}</span>
            </div>
            <p className="text-xs text-muted-foreground flex-1">{t("dashboard.hubB2cDesc")}</p>
            <span className="text-xs font-medium text-primary mt-2">→ {t("dashboard.viewAll")}</span>
          </Link>
          <Link
            to="/market-intel"
            className="flex flex-col rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:bg-card/80 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-pillar1" />
              <span className="font-medium text-foreground">{t("dashboard.hubProductAnalysisTitle")}</span>
            </div>
            <p className="text-xs text-muted-foreground flex-1">{t("dashboard.hubProductAnalysisDesc")}</p>
            <span className="text-xs font-medium text-primary mt-2">→ {t("dashboard.viewAll")}</span>
          </Link>
          <Link
            to="/seo"
            className="flex flex-col rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:bg-card/80 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">{t("dashboard.hubBlogTitle")}</span>
            </div>
            <p className="text-xs text-muted-foreground flex-1">{t("dashboard.hubBlogDesc")}</p>
            <span className="text-xs font-medium text-primary mt-2">→ {t("dashboard.viewAll")}</span>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          {t("dashboard.hubB2bNote")}
          <Link to="/b2b" className="text-primary hover:underline font-medium">{t("nav.b2bTrade")} →</Link>
        </p>
      </section>

      {/* KPI 퀵 액션 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          to="/b2b"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-card/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pillar2/15 text-pillar2">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("dashboard.kpiLeads")}</p>
              <p className="text-xl font-bold text-foreground">{leadCount != null ? leadCount : "—"}</p>
            </div>
          </div>
          <span className="text-xs font-medium text-primary">{t("dashboard.viewAll")} →</span>
        </Link>
        <Link
          to="/gov"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-card/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pillar4/15 text-pillar4">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("dashboard.kpiTenders")}</p>
              <p className="text-xl font-bold text-foreground">—</p>
            </div>
          </div>
          <span className="text-xs font-medium text-primary">{t("dashboard.viewAll")} →</span>
        </Link>
        <Link
          to="/market-intel"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-card/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pillar1/15 text-pillar1">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("dashboard.kpiMarketIntel")}</p>
              <p className="text-sm font-semibold text-foreground">{t("dashboard.viewAll")}</p>
            </div>
          </div>
          <span className="text-xs font-medium text-primary">→</span>
        </Link>
      </div>

      {/* AI Copilot */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">{t("dashboard.copilotTitle")}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{t("dashboard.copilotDesc")}</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={copilotText}
            onChange={(e) => setCopilotText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCopilotRequest()}
            placeholder={t("dashboard.copilotPlaceholder")}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="button"
            onClick={handleCopilotRequest}
            disabled={copilotLoading}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {copilotLoading ? "…" : t("common.run")}
          </button>
        </div>
        {copilotResult && typeof copilotResult === "object" && (
          <div className="mt-4 rounded-lg border border-border bg-background p-4 text-sm">
            <p className="text-muted-foreground mb-1">
              {t("dashboard.intentLabel")}: {copilotResult.intent?.category != null ? String(copilotResult.intent.category) : "—"}
            </p>
            <pre className="whitespace-pre-wrap text-foreground text-xs mt-2">{copilotResult.formatted_response ?? ""}</pre>
          </div>
        )}
        {copilotError && (
          <p className="mt-4 text-sm text-destructive">{copilotError}</p>
        )}
      </div>

      {/* 도메인별 모듈 카드 */}
      <section className="mb-8">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("nav.groupIntel")}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModuleCard
            title={t("nav.marketIntel")}
            subtitle={t("dashboard.cardMarketIntelSub")}
            to="/market-intel"
            colorClass="border-l-4 border-l-pillar1"
          />
          <ModuleCard
            title={t("nav.competitorTracking")}
            subtitle={t("dashboard.cardCompetitorSub")}
            to="/competitors"
            colorClass="border-l-4 border-l-pillar1"
          />
        </div>
      </section>

      <section className="mb-8">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("nav.groupTrade")}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ModuleCard
            title={t("nav.b2bTrade")}
            subtitle={t("dashboard.cardB2bSub")}
            to="/b2b"
            colorClass="border-l-4 border-l-pillar2"
            kpi={leadCount != null ? { label: t("dashboard.kpiLeads"), value: leadCount } : undefined}
          />
          <ModuleCard
            title={t("nav.b2cCommerce")}
            subtitle={t("dashboard.cardB2cSub")}
            to="/b2c"
            colorClass="border-l-4 border-l-pillar3"
          />
          <ModuleCard
            title={t("nav.govTender")}
            subtitle={t("dashboard.cardGovSub")}
            to="/gov"
            colorClass="border-l-4 border-l-pillar4"
          />
        </div>
      </section>

      <section className="mb-8">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("nav.groupContent")}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModuleCard
            title={t("nav.seoContent")}
            subtitle={t("dashboard.cardSeoSub")}
            to="/seo"
            colorClass="border-l-4 border-l-primary"
          />
          <ModuleCard
            title={t("nav.shortsAgent")}
            subtitle={t("dashboard.cardShortsSub")}
            to="/shorts"
            colorClass="border-l-4 border-l-primary"
          />
        </div>
      </section>

      {/* Nexus 코어 */}
      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          {t("dashboard.nexusCore")}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t("dashboard.dailyRoutine")}
            </h3>
            {routine?.schedule && typeof routine.schedule === "object" ? (
              <ul className="text-sm text-muted-foreground space-y-1">
                {Object.entries(routine.schedule).map(([time, task]) => {
                  const last = routine.last_runs && routine.last_runs[time];
                  const isRunning = runningTask === time;
                  return (
                    <li key={String(time)} className="flex justify-between items-center gap-4 flex-wrap">
                      <span className="font-mono shrink-0">{String(time)}</span>
                      <span className="flex-1 min-w-0">{String(task ?? "").replace(/_/g, " ")}</span>
                      {last && (
                        <span className={`shrink-0 text-xs ${last.status === "success" ? "text-green-600" : last.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                          {last.status}
                          {last.finished_at && (
                            <span className="ml-1 opacity-80">
                              {new Date(last.finished_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                            </span>
                          )}
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={isRunning}
                        onClick={() => {
                          setRunningTask(time);
                          api.post("/nexus/daily-routine/run", { task_time: time })
                            .then(() => fetchRoutine())
                            .catch((e) => setRoutineError(getApiErrorMessage(e, t("dashboard.runFailed"))))
                            .finally(() => setRunningTask(null));
                        }}
                        className="shrink-0 text-xs rounded bg-primary/20 text-primary px-2 py-1 hover:bg-primary/30 disabled:opacity-50"
                      >
                        {isRunning ? "…" : "Run again"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
            {routineError && <p className="text-xs text-destructive mt-2">{routineError}</p>}
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {t("dashboard.proactiveAlerts")}
            </h3>
            <button
              type="button"
              onClick={fetchAlerts}
              className="mb-2 text-sm rounded-lg bg-pillar4/20 text-pillar4 px-3 py-1.5 hover:bg-pillar4/30"
            >
              {t("dashboard.alertsRefresh")}
            </button>
            {alerts?.alerts?.length > 0 ? (
              <ul className="space-y-2">
                {alerts.alerts.slice(0, 4).map((a, i) => (
                  <li key={i} className="text-sm rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <span className={a.priority === "urgent" ? "font-medium text-destructive" : "text-foreground"}>
                      [{a?.type != null ? String(a.type) : ""}]
                    </span>{" "}
                    {a?.message != null ? String(a.message) : ""}
                    {a?.action && <div className="text-xs text-muted-foreground mt-1">→ {a.action}</div>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
            {alertsError && <p className="text-xs text-destructive mt-2">{alertsError}</p>}
          </div>
        </div>
      </div>

      {/* 수익 모델 (접기/펼치기) */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowRevenue(!showRevenue)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <DollarSign className="w-4 h-4" />
            {t("dashboard.revenueModel")}
          </span>
          {showRevenue ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showRevenue && (
          <div className="px-4 pb-4 pt-0 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm pt-4">
              <div>
                <h3 className="font-medium text-foreground mb-2">{t("dashboard.pricing")}</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">{t("dashboard.starterPlan")}</strong> — {t("dashboard.starterPlanDesc")}</li>
                  <li><strong className="text-foreground">{t("dashboard.professionalPlan")}</strong> — {t("dashboard.professionalPlanDesc")}</li>
                  <li><strong className="text-foreground">{t("dashboard.enterprisePlan")}</strong> — {t("dashboard.enterprisePlanDesc")}</li>
                  <li className="pt-1">{t("dashboard.additionalOptions")}: {t("dashboard.additionalOptionsDesc")}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">{t("dashboard.evaluation")}</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>{t("dashboard.technicalFeasibility")}: 90/100</li>
                  <li>{t("dashboard.businessValue")}: 95/100</li>
                  <li>{t("dashboard.scalability")}: 85/100</li>
                  <li>{t("dashboard.competitiveAdvantage")}: 88/100</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
