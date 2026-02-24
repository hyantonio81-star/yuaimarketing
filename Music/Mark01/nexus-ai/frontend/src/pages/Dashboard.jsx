import { useState, useEffect } from "react";
import { Clock, Zap, DollarSign, AlertTriangle, MessageSquare } from "lucide-react";
import PillarCard from "../components/PillarCard";
import { useLanguage } from "../context/LanguageContext.jsx";
import { api } from "../lib/api";

export default function Dashboard() {
  const { t } = useLanguage();
  const [routine, setRoutine] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [requestText, setRequestText] = useState("");
  const [requestResult, setRequestResult] = useState(null);

  useEffect(() => {
    api.get("/nexus/daily-routine").then((r) => setRoutine(r.data)).catch(() => {});
  }, []);

  const fetchAlerts = () => {
    api.get("/nexus/proactive-alerts").then((r) => setAlerts(r.data)).catch(() => setAlerts({ alerts: [] }));
  };

  const handleUserRequest = () => {
    if (!requestText.trim()) return;
    api.post("/nexus/handle-request", { request: requestText.trim() })
      .then((r) => setRequestResult(r.data))
      .catch(() => setRequestResult(null));
  };

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {t("dashboard.title")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("dashboard.subtitle")}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <PillarCard
          title="PILLAR 1"
          subtitle="Market Intel"
          weight="40%"
          colorClass="border-l-4 border-l-pillar1"
          to="/market-intel"
        />
        <PillarCard
          title="PILLAR 2"
          subtitle="B2B Trade"
          weight="20%"
          colorClass="border-l-4 border-l-pillar2"
          to="/b2b"
        />
        <PillarCard
          title="PILLAR 3"
          subtitle="B2C Commerce"
          weight="30%"
          colorClass="border-l-4 border-l-pillar3"
          to="/b2c"
        />
        <PillarCard
          title="PILLAR 4"
          subtitle="Gov Tender"
          weight="10%"
          colorClass="border-l-4 border-l-pillar4"
          to="/gov"
        />
      </div>

      <div className="mt-8 rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          {t("dashboard.systemStatus")}
        </h2>
        <div className="flex flex-wrap gap-4">
          <StatusBadge label="Market Intel" status="active" />
          <StatusBadge label="Competitor Tracking" status="active" />
          <StatusBadge label="SEO Module" status="ready" />
          <StatusBadge label="B2B / B2C / Gov" status="active" />
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          {t("dashboard.nexusCore")}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t("dashboard.dailyRoutine")}
            </h3>
            {routine?.schedule && typeof routine.schedule === "object" && (
              <ul className="text-sm text-muted-foreground space-y-1">
                {Object.entries(routine.schedule).map(([time, task]) => (
                  <li key={String(time)} className="flex justify-between">
                    <span className="font-mono">{String(time)}</span>
                    <span>{String(task ?? "").replace(/_/g, " ")}</span>
                  </li>
                ))}
              </ul>
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
              className="mb-2 text-sm rounded bg-pillar4/20 text-pillar4 px-3 py-1.5 hover:bg-pillar4/30"
            >
              {t("dashboard.alertsRefresh")}
            </button>
            {alerts?.alerts?.length > 0 && (
              <ul className="space-y-2">
                {alerts.alerts.slice(0, 4).map((a, i) => (
                  <li key={i} className="text-sm rounded border border-border bg-muted/30 px-3 py-2">
                    <span className={`font-medium ${a.priority === "urgent" ? "text-destructive" : "text-foreground"}`}>
                      [{a?.type != null ? String(a.type) : ""}]
                    </span>{" "}
                    {a?.message != null ? String(a.message) : ""}
                    <div className="text-xs text-muted-foreground mt-1">→ {a?.action != null ? String(a.action) : ""}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            {t("dashboard.userRequest")}
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder={t("dashboard.requestPlaceholder")}
              className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleUserRequest}
              className="rounded bg-pillar4 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              {t("common.run")}
            </button>
          </div>
          {requestResult && typeof requestResult === "object" && (
            <div className="mt-2 text-sm rounded border border-border bg-muted/20 p-3">
              <span className="text-muted-foreground">의도: {requestResult.intent?.category != null ? String(requestResult.intent.category) : "—"}</span>
              <pre className="mt-1 text-xs whitespace-pre-wrap">{requestResult.formatted_response != null ? String(requestResult.formatted_response) : ""}</pre>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          {t("dashboard.revenueModel")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-medium text-foreground mb-2">{t("dashboard.pricing")}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Starter $199/월</strong> — Pillar 1 제한(20건), 바이어 100개, 단일채널, 입찰 알림</li>
              <li><strong className="text-foreground">Professional $599/월</strong> — Pillar 1 무제한, 바이어 500+ 아웃리치, 멀티채널 5개, 입찰 평가·제안서 초안</li>
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
    </div>
  );
}

function StatusBadge({ label, status }) {
  const colors = {
    active: "bg-primary/20 text-primary border-primary/40",
    ready: "bg-accent/20 text-accent border-accent/40",
    standby: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium ${colors[status] ?? colors.standby}`}
    >
      <span className="w-2 h-2 rounded-full bg-current animate-pulse-subtle" />
      {label}
    </span>
  );
}
