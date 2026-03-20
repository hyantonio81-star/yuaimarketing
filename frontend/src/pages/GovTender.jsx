import { useState, useEffect } from "react";
import { Search, Bell, AlertTriangle, Building2, Calendar, Globe, FileCheck, TrendingUp, FileText, Info } from "lucide-react";
import SectionCard from "../components/SectionCard";
import { api } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import { useApi } from "../hooks/useApi";

export default function GovTender() {
  const { t } = useLanguage();
  const [govManualMode, setGovManualMode] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  const [keywords, setKeywords] = useState("");
  const [intlKeywords, setIntlKeywords] = useState(t("govTender.intlKeywordsPlaceholder"));
  const [qualDoc, setQualDoc] = useState("");
  const [bidScope, setBidScope] = useState("");
  const [bidPeriod, setBidPeriod] = useState("");
  const [bidLocation, setBidLocation] = useState("");
  const [bidBudget, setBidBudget] = useState("");
  const [bidAgency, setBidAgency] = useState("");
  const [propType, setPropType] = useState("SI");
  const [propScope, setPropScope] = useState("");
  const [propPeriod, setPropPeriod] = useState("");
  const [propTech, setPropTech] = useState("");
  const [propExpertise, setPropExpertise] = useState("");
  const [propGuidelines, setPropGuidelines] = useState("");

  // API 훅 정의
  const monitorApi = useApi((kw) => api.post("/gov/korea-procurement", { user_keywords: kw }));
  const intlMonitorApi = useApi((kw) => api.post("/gov/international-tenders", { user_profile: { keywords: kw } }));
  const qualApi = useApi((doc) => api.post("/gov/check-qualification", { tender: doc ? { document: doc } : {} }));
  const bidApi = useApi((tender) => api.post("/gov/optimal-bid", { tender }));
  const proposalApi = useApi((tender) => api.post("/gov/generate-proposal", { tender }));

  useEffect(() => {
    api.get("/gov/status").then(({ data }) => {
      setGovManualMode(data?.mode === "manual");
    }).catch(() => setGovManualMode(true)).finally(() => setStatusLoading(false));
  }, []);

  const runMonitor = () => {
    const user_keywords = keywords.split(/[,，\s]+/).map((k) => k.trim()).filter(Boolean);
    monitorApi.request(user_keywords.length ? user_keywords : undefined);
  };

  const runInternationalTenders = () => {
    const kw = intlKeywords.split(/[,，\s]+/).map((k) => k.trim()).filter(Boolean);
    intlMonitorApi.request(kw.length ? kw : undefined);
  };

  const runCheckQualification = () => qualApi.request(qualDoc.trim());

  const runOptimalBid = () => {
    bidApi.request({
      scope_of_work: bidScope.trim() || undefined,
      contract_period: bidPeriod.trim() || undefined,
      delivery_location: bidLocation.trim() || undefined,
      budget: bidBudget !== "" ? Number(bidBudget) : undefined,
      agency: bidAgency.trim() || undefined,
    });
  };

  const runGenerateProposal = () => {
    proposalApi.request({
      type: propType.trim() || undefined,
      scope_of_work: propScope.trim() || undefined,
      contract_period: propPeriod.trim() || undefined,
      technical_specs: propTech.trim() || undefined,
      required_expertise: propExpertise.trim() || undefined,
      submission_guidelines: propGuidelines.trim() || undefined,
    });
  };

  return (
    <div className="p-6 lg:p-8">
      {!statusLoading && govManualMode && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-sm">
          <Info className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">{t("govTender.statusManual")}</p>
            <p className="text-muted-foreground mt-1">
              {t("govTender.statusManualDesc")}
            </p>
          </div>
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {t("govTender.title")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("govTender.headerDesc")} {govManualMode && `(${t("common.manualMode")})`}
        </p>
      </header>

      <SectionCard title={t("govTender.monitorTitle")} className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          {t("govTender.monitorDesc")}
        </p>
        <div className="mb-4">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            {t("govTender.keywordsLabel")}
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder={t("govTender.keywordsPlaceholder")}
            className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
          />
        </div>
        <button
          onClick={runMonitor}
          disabled={monitorApi.loading || govManualMode}
          className="flex items-center gap-2 rounded bg-pillar4 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <Search className={`w-4 h-4 ${monitorApi.loading ? "animate-pulse" : ""}`} />
          {monitorApi.loading ? t("govTender.monitoring") : t("govTender.runMonitor")}
        </button>
        {monitorApi.error && (
          <p className="text-sm text-destructive mt-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {monitorApi.error}
          </p>
        )}
        {monitorApi.data && (
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-foreground font-medium">
                {t("govTender.periodLabel")}: {monitorApi.data.params_used?.inqryBgnDt} ~ {monitorApi.data.params_used?.inqryEndDt}
              </span>
              <span className="text-muted-foreground">
                {t("govTender.matchingCount", { count: monitorApi.data.relevant?.length ?? 0 })}
              </span>
              {monitorApi.data.notification_sent && (
                <span className="flex items-center gap-2 rounded px-2 py-1 bg-pillar4/20 text-pillar4">
                  <Bell className="w-4 h-4" />
                  {monitorApi.data.notification_sent.title}
                  <span
                    className={
                      monitorApi.data.notification_sent.priority === "high"
                        ? "text-amber-500 font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    ({monitorApi.data.notification_sent.priority})
                  </span>
                </span>
              )}
            </div>
            {monitorApi.data.relevant?.length > 0 ? (
              <ul className="space-y-3">
                {monitorApi.data.relevant.map((r, i) => (
                  <li
                    key={r.tender?.id || i}
                    className="rounded border border-border bg-background/50 p-3 text-sm"
                  >
                    <div className="font-medium text-foreground mb-1">{r.tender?.title}</div>
                    <div className="flex flex-wrap gap-3 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {r.agency}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {t("govTender.deadline")} {r.deadline}
                      </span>
                      <span>{t("govTender.matchScore", { score: r.analysis?.match_score })}</span>
                      <span>{t("govTender.estimatedValue")} ₩{r.analysis?.estimated_value?.toLocaleString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("govTender.noMatching")}</p>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title={t("govTender.intlMonitorTitle")} className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          {t("govTender.intlMonitorDesc")}
        </p>
        <div className="mb-4">
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("govTender.keywordsLabel")}</label>
          <input
            type="text"
            value={intlKeywords}
            onChange={(e) => setIntlKeywords(e.target.value)}
            placeholder={t("govTender.intlKeywordsPlaceholder")}
            className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
          />
        </div>
        <button
          onClick={runInternationalTenders}
          disabled={intlMonitorApi.loading || govManualMode}
          className="flex items-center gap-2 rounded bg-pillar4 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <Globe className={`w-4 h-4 ${intlMonitorApi.loading ? "animate-pulse" : ""}`} />
          {intlMonitorApi.loading ? t("govTender.collecting") : t("govTender.intlRunMonitor")}
        </button>
        {intlMonitorApi.error && (
          <p className="text-sm text-destructive mt-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {intlMonitorApi.error}
          </p>
        )}
        {intlMonitorApi.data && (
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div className="text-sm text-foreground font-medium">
              {t("govTender.relatedCount", { count: intlMonitorApi.data.length })}
            </div>
            {intlMonitorApi.data.length > 0 ? (
              <ul className="space-y-3">
                {intlMonitorApi.data.map((tender, i) => (
                  <li key={tender.id || i} className="rounded border border-border bg-background/50 p-3 text-sm">
                    <div className="font-medium text-foreground mb-1">{tender.title}</div>
                    <div className="flex flex-wrap gap-3 text-muted-foreground">
                      <span className="rounded bg-pillar4/20 text-pillar4 px-1.5 py-0.5 text-xs">{tender.source}</span>
                      <span>{t("govTender.relevance", { score: tender.relevance })}</span>
                      {tender.estimated_value != null && <span>{t("govTender.estimatedM", { count: (tender.estimated_value / 1e6).toFixed(2) })}</span>}
                      {tender.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {tender.deadline}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("govTender.noRelated")}</p>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title={t("govTender.qualTitle")} className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          {t("govTender.qualDesc")}
        </p>
        <div className="mb-4">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            {t("govTender.qualDocLabel")}
          </label>
          <textarea
            value={qualDoc}
            onChange={(e) => setQualDoc(e.target.value)}
            placeholder={t("govTender.qualPlaceholder")}
            rows={4}
            className="rounded border border-border bg-background px-3 py-2 text-sm w-full font-mono"
          />
        </div>
        <button
          onClick={runCheckQualification}
          disabled={qualApi.loading || govManualMode}
          className="flex items-center gap-2 rounded bg-pillar4 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <FileCheck className={`w-4 h-4 ${qualApi.loading ? "animate-pulse" : ""}`} />
          {qualApi.loading ? t("govTender.checking") : t("govTender.qualRun")}
        </button>
        {qualApi.error && (
          <p className="text-sm text-destructive mt-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {qualApi.error}
          </p>
        )}
        {qualApi.data && (
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div
              className={
                qualApi.data.recommendation?.decision === "DO NOT BID"
                  ? "text-destructive font-medium"
                  : qualApi.data.recommendation?.decision === "ELIGIBLE"
                  ? "text-green-600 dark:text-green-400 font-medium"
                  : "text-amber-500 font-medium"
              }
            >
              {t("govTender.recommendation")}: {qualApi.data.recommendation?.decision}
              {qualApi.data.recommendation?.reason && ` — ${qualApi.data.recommendation.reason}`}
              {qualApi.data.recommendation?.score != null && ` (${t("govTender.recommendationScore", { score: qualApi.data.recommendation.score })})`}
              {qualApi.data.recommendation?.competitive_edge != null && ` · ${t("govTender.preferenceMet", { count: qualApi.data.recommendation.competitive_edge })}`}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded border border-border bg-background/50 p-3">
                <div className="text-xs font-medium text-muted-foreground mb-1">{t("govTender.mandatoryMet")}</div>
                <ul className="space-y-1">
                  {qualApi.data.checklist?.mandatory?.map((m, i) => (
                    <li key={i}>{m.requirement} — {m.status} {m.evidence && `(${m.evidence})`}</li>
                  ))}
                  {!qualApi.data.checklist?.mandatory?.length && <li className="text-muted-foreground">—</li>}
                </ul>
              </div>
              <div className="rounded border border-border bg-background/50 p-3">
                <div className="text-xs font-medium text-muted-foreground mb-1">{t("govTender.preferredMet")}</div>
                <ul className="space-y-1">
                  {qualApi.data.checklist?.preferred?.map((p, i) => (
                    <li key={i}>{p.requirement} — {p.status}</li>
                  ))}
                  {!qualApi.data.checklist?.preferred?.length && <li className="text-muted-foreground">—</li>}
                </ul>
              </div>
              <div className="rounded border border-border bg-background/50 p-3">
                <div className="text-xs font-medium text-muted-foreground mb-1">{t("govTender.notMet")}</div>
                <ul className="space-y-1">
                  {qualApi.data.checklist?.missing?.map((m, i) => (
                    <li key={i} className="text-destructive/90">{m.requirement} — {m.can_obtain}, {m.time_needed}</li>
                  ))}
                  {!qualApi.data.checklist?.missing?.length && <li className="text-muted-foreground">{t("govTender.none")}</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title={t("govTender.optimalBidTitle")} className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          {t("govTender.optimalBidDesc")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("govTender.bidScope")}</label>
            <input
              type="text"
              value={bidScope}
              onChange={(e) => setBidScope(e.target.value)}
              placeholder={t("govTender.bidScopePlaceholder")}
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("govTender.bidPeriod")}</label>
            <input
              type="text"
              value={bidPeriod}
              onChange={(e) => setBidPeriod(e.target.value)}
              placeholder={t("govTender.bidPeriodPlaceholder")}
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("govTender.bidLocation")}</label>
            <input
              type="text"
              value={bidLocation}
              onChange={(e) => setBidLocation(e.target.value)}
              placeholder={t("govTender.bidLocationPlaceholder")}
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("govTender.bidBudget")}</label>
            <input
              type="number"
              value={bidBudget}
              onChange={(e) => setBidBudget(e.target.value)}
              placeholder={t("govTender.bidBudgetPlaceholder")}
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("govTender.bidAgency")}</label>
            <input
              type="text"
              value={bidAgency}
              onChange={(e) => setBidAgency(e.target.value)}
              placeholder={t("govTender.bidAgencyPlaceholder")}
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
        </div>
        <button
          onClick={runOptimalBid}
          disabled={bidApi.loading || govManualMode}
          className="flex items-center gap-2 rounded bg-pillar4 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <TrendingUp className={`w-4 h-4 ${bidApi.loading ? "animate-pulse" : ""}`} />
          {bidApi.loading ? t("govTender.calculating") : t("govTender.runOptimalBid")}
        </button>
        {bidApi.error && (
          <p className="text-sm text-destructive mt-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {bidApi.error}
          </p>
        )}
        {bidApi.data && (
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="font-medium text-foreground">
                {t("govTender.recommendedBid")}: ₩{bidApi.data.recommended_bid?.toLocaleString()}
              </span>
              <span className="text-muted-foreground">{t("govTender.winProb", { score: (bidApi.data.confidence * 100)?.toFixed(0) })}</span>
              <span className="text-muted-foreground">{t("govTender.costEstimate")} ₩{bidApi.data.cost_estimate?.toLocaleString()}</span>
              <span className="text-muted-foreground">{t("govTender.budgetCeiling")} ₩{bidApi.data.budget_ceiling?.toLocaleString()}</span>
            </div>
            {bidApi.data.risk_analysis && (
              <div className="text-xs text-muted-foreground">
                {t("govTender.riskAnalysis", {
                  cost: bidApi.data.risk_analysis.cost_overrun_risk,
                  delay: bidApi.data.risk_analysis.payment_delay_risk,
                  creep: bidApi.data.risk_analysis.scope_creep_risk
                })}
              </div>
            )}
            {bidApi.data.all_scenarios?.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">{t("govTender.scenarios")}</div>
                <ul className="space-y-1 text-sm">
                  {bidApi.data.all_scenarios.map((s, i) => (
                    <li key={i} className="flex justify-between items-center rounded border border-border bg-background/50 px-3 py-2">
                      <span>{t("govTender.scenarioDetail", { markup: s.markup, amount: `₩${s.bid_amount?.toLocaleString()}` })}</span>
                      <span>{t("govTender.scenarioWin", { win: (s.win_probability * 100).toFixed(0), profit: `₩${s.expected_profit?.toLocaleString()}` })}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title={t("govTender.proposalTitle")} className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          {t("govTender.proposalDesc")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("govTender.propType")}</label>
            <select
              value={propType}
              onChange={(e) => setPropType(e.target.value)}
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            >
              <option value="SI">{t("govTender.propTypeSI")}</option>
              <option value="consulting">{t("govTender.propTypeConsulting")}</option>
              <option value="standard">{t("govTender.propTypeStandard")}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("govTender.bidScope")}</label>
            <input
              type="text"
              value={propScope}
              onChange={(e) => setPropScope(e.target.value)}
              placeholder={t("govTender.propScopePlaceholder")}
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("govTender.bidPeriod")}</label>
            <input
              type="text"
              value={propPeriod}
              onChange={(e) => setPropPeriod(e.target.value)}
              placeholder={t("govTender.bidPeriodPlaceholder")}
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("govTender.propExpertise")}</label>
            <input
              type="text"
              value={propExpertise}
              onChange={(e) => setPropExpertise(e.target.value)}
              placeholder={t("govTender.propExpertisePlaceholder")}
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("govTender.propTech")}</label>
            <input
              type="text"
              value={propTech}
              onChange={(e) => setPropTech(e.target.value)}
              placeholder={t("govTender.propTechPlaceholder")}
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("govTender.propGuidelines")}</label>
            <input
              type="text"
              value={propGuidelines}
              onChange={(e) => setPropGuidelines(e.target.value)}
              placeholder={t("govTender.propGuidelinesPlaceholder")}
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
        </div>
        <button
          onClick={runGenerateProposal}
          disabled={proposalApi.loading || govManualMode}
          className="flex items-center gap-2 rounded bg-pillar4 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <FileText className={`w-4 h-4 ${proposalApi.loading ? "animate-pulse" : ""}`} />
          {proposalApi.loading ? t("govTender.generating") : t("govTender.runGenerateProposal")}
        </button>
        {proposalApi.error && (
          <p className="text-sm text-destructive mt-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {proposalApi.error}
          </p>
        )}
        {proposalApi.data && (
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div className="text-sm font-medium text-foreground">{proposalApi.data.document?.summary}</div>
            <div className="text-xs text-muted-foreground">
              {t("govTender.template")}: {proposalApi.data.document?.template} · {t("govTender.sections")}: {proposalApi.data.document?.sections && Object.keys(proposalApi.data.document.sections).join(", ")}
            </div>
            {proposalApi.data.qc_report && (
              <div className="flex flex-wrap items-center gap-2">
                <span>{t("govTender.qcReport")}: {t("govTender.recommendationScore", { score: proposalApi.data.qc_report.score })} · {proposalApi.data.qc_report.passed ? t("govTender.qcPassed") : t("govTender.qcIssues")}</span>
                {proposalApi.data.qc_report.issues?.length > 0 && (
                  <ul className="text-xs text-amber-600 dark:text-amber-400">
                    {proposalApi.data.qc_report.issues.map((i, idx) => (
                      <li key={idx}>{i.section}: {i.message}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {proposalApi.data.checklist?.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">{t("govTender.submissionChecklist")}</div>
                <ul className="text-sm space-y-1">
                  {proposalApi.data.checklist.map((item, i) => (
                    <li key={i}>· {item}</li>
                  ))}
                </ul>
              </div>
            )}
            {proposalApi.data.file_formats && (
              <div className="text-xs text-muted-foreground">
                {t("govTender.downloadFormats")}
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title={t("govTender.referenceTitle")} className="mb-6">
        <p className="text-sm text-muted-foreground">
          {t("govTender.referenceG2B")}
          <br />
          {t("govTender.referenceIntl")}
        </p>
      </SectionCard>
    </div>
  );
}
