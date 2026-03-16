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
} from "lucide-react";
import { Link } from "react-router-dom";
import ModuleCard from "../components/ModuleCard";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api";

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

  const fetchRoutine = () => {
    api.get("/nexus/daily-routine").then((r) => setRoutine(r.data)).catch(() => {});
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

  const fetchAlerts = () => {
    api.get("/nexus/proactive-alerts").then((r) => setAlerts(r.data)).catch(() => setAlerts({ alerts: [] }));
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

      {/* 첫 E2E 실행 — 한 줄로 끝까지 */}
      <section className="mb-8 rounded-xl border-2 border-primary/30 bg-primary/10 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">첫 E2E 실행</h2>
        <p className="text-sm text-muted-foreground mb-4">한 가지 흐름을 끝까지 실행해 보세요. Shorts 1편 업로드 또는 Threads 포스트 1건 발행.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/shorts"
            className="flex items-center gap-4 rounded-xl border-2 border-border bg-card p-5 hover:border-primary hover:bg-primary/10 transition-colors"
          >
            <div className="p-3 rounded-xl bg-red-500/15 text-red-500">
              <Video className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">Shorts 1편 올리기</p>
              <p className="text-xs text-muted-foreground mt-0.5">키워드 → 스크립트·이미지·TTS·BGM → mp4 조립 → YouTube 업로드</p>
            </div>
            <span className="text-sm font-medium text-primary shrink-0">이동 →</span>
          </Link>
          <Link
            to="/seo/threads-commerce"
            className="flex items-center gap-4 rounded-xl border-2 border-border bg-card p-5 hover:border-primary hover:bg-primary/10 transition-colors"
          >
            <div className="p-3 rounded-xl bg-black/80 text-white">
              <MessageCircle className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">Threads 포스트 1건 발행</p>
              <p className="text-xs text-muted-foreground mt-0.5">상품 소싱 → 카피·이미지 생성 → Threads에 게시</p>
            </div>
            <span className="text-sm font-medium text-primary shrink-0">이동 →</span>
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
              의도: {copilotResult.intent?.category != null ? String(copilotResult.intent.category) : "—"}
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
                            .catch(() => {})
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
                  <li><strong className="text-foreground">Starter $199/월</strong> — 시장 인텔 제한(20건), 바이어 100개, 단일채널, 입찰 알림</li>
                  <li><strong className="text-foreground">Professional $599/월</strong> — 시장 인텔 무제한, 바이어 500+ 아웃리치, 멀티채널 5개, 입찰 평가·제안서 초안</li>
                  <li><strong className="text-foreground">Enterprise $1,499/월</strong> — 전 기능, AI 커스터마이징, API, 월 1회 전문가 자문 2h</li>
                  <li className="pt-1">추가: 프리미엄 데이터 $200–500/월, 거래 수수료 3%, 화이트라벨 $5K+/월</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">{t("dashboard.evaluation")}</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>기술적 실현 가능성: 90/100</li>
                  <li>비즈니스 가치: 95/100</li>
                  <li>확장성: 85/100</li>
                  <li>경쟁 우위: 88/100</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
