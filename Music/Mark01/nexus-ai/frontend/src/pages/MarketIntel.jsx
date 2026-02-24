import { useState, useEffect } from "react";
import { MessageCircle, BarChart3, ListOrdered, AlertTriangle, ShoppingBag, ArrowRight, Save, FileSearch, ExternalLink } from "lucide-react";
import SectionCard from "../components/SectionCard";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useMarket } from "../context/MarketContext.jsx";
import { api, marketIntelApi } from "../lib/api.js";
import { getCurrentCountryCode } from "../lib/marketStore.js";

const CATEGORY_ORDER = ["social_reviews", "trade_industry", "manufacturing", "export_promotion", "economic", "news", "b2b_b2c"];
const CATEGORY_TKEY = {
  social_reviews: "catSocialReviews",
  trade_industry: "catTradeIndustry",
  manufacturing: "catManufacturing",
  export_promotion: "catExportPromotion",
  economic: "catEconomic",
  news: "catNews",
  b2b_b2c: "catB2bB2c",
};
const PRICE_TKEY = { free: "priceFree", low: "priceLow", mid: "priceMid" };
const TYPE_TKEY = { free_api: "typeFreeApi", paid_api: "typePaidApi", site: "typeSite", rss: "typeRss" };

const FORMAT_OPTIONS = [
  { value: "pdf", label: "PDF" },
  { value: "excel", label: "Excel" },
  { value: "json", label: "JSON" },
];

const SCOPE_OPTIONS = [
  { value: "country", tKey: "scopeCountry" },
  { value: "industry", tKey: "scopeIndustry" },
  { value: "item", tKey: "scopeItem" },
  { value: "full", tKey: "scopeFull" },
];

const SCHEDULE_OPTIONS = [
  { value: "once", tKey: "scheduleOnce" },
  { value: "weekly", tKey: "scheduleWeekly" },
  { value: "monthly", tKey: "scheduleMonthly" },
];

const REPORT_LANGUAGE_CODES = ["ko", "en", "es"];
function getReportLanguageOptions(t) {
  const translate = typeof t === "function" ? t : (k) => k;
  return REPORT_LANGUAGE_CODES.map((value) => ({
    value,
    label: translate(`common.reportLang${value === "ko" ? "Ko" : value === "en" ? "En" : "Es"}`),
  }));
}

export default function MarketIntel() {
  const { t, language: uiLanguage } = useLanguage();
  const { currentCountryCode } = useMarket();
  const [tools, setTools] = useState([]);
  const [services, setServices] = useState([]);
  const [results, setResults] = useState([]);
  const [reportMeta, setReportMeta] = useState({ sections: [], default: null });
  const [reportOptions, setReportOptions] = useState({
    format: "pdf",
    scope: "full",
    schedule: "weekly",
    sections: [],
    language: "ko",
    report_tier: "medium",
    target_page_count: 20,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [granularEnabled, setGranularEnabled] = useState(false);
  const [granularRequest, setGranularRequest] = useState({
    country_code: "",
    item: "",
    hs_code: "",
    research_types: [],
  });
  const [researchTypeOptions, setResearchTypeOptions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [requestSaved, setRequestSaved] = useState(false);
  const [segmentedResult, setSegmentedResult] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [sourcesList, setSourcesList] = useState([]);
  const [sourceCategories, setSourceCategories] = useState([]);
  const [enabledPaidSourceIds, setEnabledPaidSourceIds] = useState([]);
  const [paidSourcesSaved, setPaidSourcesSaved] = useState(false);
  const [reportTierOptions, setReportTierOptions] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [error, setError] = useState(null);
  const [reportGenMessage, setReportGenMessage] = useState(null);
  const [reportGenLoading, setReportGenLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const reportLang = reportOptions.language || uiLanguage || "ko";
    (async () => {
      try {
        const [toolsRes, servicesRes, resultsRes, optionsRes] = await Promise.all([
          marketIntelApi.getTools(),
          marketIntelApi.getServices(),
          marketIntelApi.getResults(),
          marketIntelApi.getReportOptions(reportLang),
        ]);
        if (!cancelled) {
          setTools(Array.isArray(toolsRes?.tools) ? toolsRes.tools : []);
          setServices(Array.isArray(servicesRes?.services) ? servicesRes.services : []);
          setResults(Array.isArray(resultsRes?.results) ? resultsRes.results : []);
          const opts = optionsRes && typeof optionsRes === "object" ? optionsRes : {};
          setReportMeta({ sections: Array.isArray(opts.sections) ? opts.sections : [], default: opts.default ?? null });
          const def = opts.default && typeof opts.default === "object" ? opts.default : null;
          if (def) {
            setReportOptions((prev) => ({
              ...prev,
              format: def.format ?? prev.format,
              scope: def.scope ?? prev.scope,
              schedule: def.schedule ?? prev.schedule,
              sections: Array.isArray(def.sections) ? def.sections : prev.sections,
              language: def.language ?? prev.language ?? "ko",
              report_tier: def.report_tier ?? prev.report_tier ?? "medium",
              target_page_count: def.target_page_count ?? prev.target_page_count ?? 20,
            }));
          }
        }
      } catch (e) {
        if (!cancelled) {
          setTools([]);
          setServices([]);
          setResults([]);
          setReportMeta({ sections: [], default: null });
          const raw = e?.apiMessage ?? e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message;
          setError(typeof raw === "string" ? raw : t("marketIntel.loadFailed"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!reportOptions.language) return;
    let cancelled = false;
    marketIntelApi.getReportOptions(reportOptions.language).then((r) => {
      if (!cancelled && r?.sections) setReportMeta((prev) => ({ ...prev, sections: r.sections }));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [reportOptions.language]);

  useEffect(() => { setError(null); }, [granularEnabled]);

  useEffect(() => {
    const lang = uiLanguage || "ko";
    marketIntelApi.getSources(lang).then((r) => {
      setSourcesList(r?.sources ?? []);
      setSourceCategories(r?.categories ?? []);
    }).catch(() => { setSourcesList([]); setSourceCategories([]); setError(typeof t === "function" ? t("marketIntel.loadFailed") : "Load failed"); });
  }, [uiLanguage, t]);

  useEffect(() => {
    marketIntelApi.getEnabledPaidSources("default").then((r) => {
      setEnabledPaidSourceIds(r?.enabled_paid_source_ids ?? []);
    }).catch(() => setEnabledPaidSourceIds([]));
  }, []);

  useEffect(() => {
    const lang = reportOptions.language || uiLanguage || "ko";
    marketIntelApi.getReportTierOptions(lang).then((r) => {
      setReportTierOptions(r?.options ?? []);
    }).catch(() => setReportTierOptions([]));
  }, [reportOptions.language, uiLanguage]);

  useEffect(() => {
    const country = getCurrentCountryCode() ?? "ALL";
    Promise.all([
      api.get("/markets/countries").then((r) => r.data?.countries ?? []),
      marketIntelApi.getResearchTypes(uiLanguage || "ko"),
      marketIntelApi.getGranularRequest("default", country),
    ]).then(([countriesList, typesRes, reqRes]) => {
      setCountries(Array.isArray(countriesList) ? countriesList : []);
      setResearchTypeOptions(Array.isArray(typesRes?.options) ? typesRes.options : []);
      const req = reqRes?.request;
      if (req) {
        setGranularEnabled(true);
        setGranularRequest({
          country_code: req.country_code ?? "",
          item: req.item ?? "",
          hs_code: req.hs_code ?? "",
          research_types: req.research_types ?? [],
        });
      }
    }).catch(() => {});
  }, [uiLanguage]);

  useEffect(() => {
    const country = currentCountryCode || getCurrentCountryCode();
    if (!country) {
      setNewsItems([]);
      return;
    }
    const lang = reportOptions.language || uiLanguage || "ko";
    marketIntelApi.getNewsSummary(country, lang).then((r) => setNewsItems(r?.items ?? [])).catch(() => setNewsItems([]));
  }, [currentCountryCode, reportOptions.language, uiLanguage]);

  const handleSaveGranularRequest = async () => {
    setError(null);
    const country = getCurrentCountryCode() ?? "ALL";
    try {
      await marketIntelApi.setGranularRequest("default", country, {
        ...granularRequest,
        research_types: granularRequest.research_types,
      });
      setRequestSaved(true);
      setTimeout(() => setRequestSaved(false), 2000);
    } catch (e) {
      setError(typeof (e?.response?.data?.error ?? e?.message) === "string" ? (e.response?.data?.error ?? e?.message) : t("marketIntel.saveFailed"));
    }
  };

  const toggleResearchType = (value) => {
    setGranularRequest((prev) => ({
      ...prev,
      research_types: prev.research_types.includes(value)
        ? prev.research_types.filter((t) => t !== value)
        : [...prev.research_types, value],
    }));
  };

  const handleViewSegmentedResults = async () => {
    if (!((granularRequest.research_types ?? []).length >= 1)) {
      setError(t("marketIntel.selectAtLeastOneResearchType"));
      return;
    }
    setError(null);
    setResultsLoading(true);
    setSegmentedResult(null);
    try {
      const country = getCurrentCountryCode() ?? "ALL";
      const res = await marketIntelApi.getSegmentedAnalysisResults({
        orgId: "default",
        country,
        lang: reportOptions.language || uiLanguage || "ko",
        country_code: granularRequest.country_code || undefined,
        item: granularRequest.item || undefined,
        hs_code: granularRequest.hs_code || undefined,
        research_types: granularRequest.research_types.join(","),
      });
      setSegmentedResult(res);
    } catch (e) {
      setError(typeof (e?.response?.data?.error ?? e?.message) === "string" ? (e.response?.data?.error ?? e?.message) : t("marketIntel.loadFailed"));
    }
    setResultsLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    const country = getCurrentCountryCode();
    if (!country) return;
    marketIntelApi.getReportSettings("default", country).then((r) => {
      if (!cancelled && r?.options) setReportOptions((prev) => ({ ...prev, ...r.options }));
    }).catch(() => setError(typeof t === "function" ? t("marketIntel.loadFailed") : "Load failed"));
    return () => { cancelled = true; };
  }, [t]);

  const handleSaveReportSettings = async () => {
    setError(null);
    setSaving(true);
    setSaved(false);
    try {
      const country = getCurrentCountryCode() ?? "ALL";
      await marketIntelApi.setReportSettings("default", country, reportOptions);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(typeof (e?.response?.data?.error ?? e?.message) === "string" ? (e.response?.data?.error ?? e?.message) : t("marketIntel.saveFailed"));
    }
    setSaving(false);
  };

  const toggleSection = (id) => {
    setReportOptions((prev) => {
      const sections = prev.sections ?? [];
      return {
        ...prev,
        sections: sections.includes(id) ? sections.filter((s) => s !== id) : [...sections, id],
      };
    });
  };

  const togglePaidSource = (sourceId) => {
    setEnabledPaidSourceIds((prev) =>
      prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId]
    );
  };

  const handleSavePaidSources = async () => {
    setError(null);
    try {
      await marketIntelApi.setEnabledPaidSources("default", enabledPaidSourceIds);
      setPaidSourcesSaved(true);
      setTimeout(() => setPaidSourcesSaved(false), 2000);
    } catch (e) {
      setError(typeof (e?.response?.data?.error ?? e?.message) === "string" ? (e.response?.data?.error ?? e?.message) : t("marketIntel.saveFailed"));
    }
  };

  const handleGenerateReport = async () => {
    setReportGenMessage(null);
    setError(null);
    setReportGenLoading(true);
    try {
      const country = getCurrentCountryCode() ?? "ALL";
      const job = await marketIntelApi.generateReport("default", country);
      setReportGenMessage(job?.message || t("marketIntel.reportGenPlaceholder"));
      setTimeout(() => setReportGenMessage(null), 8000);
    } catch (e) {
      setError(typeof (e?.response?.data?.error ?? e?.message) === "string" ? (e.response?.data?.error ?? e?.message) : t("common.reportError"));
    }
    setReportGenLoading(false);
  };

  return (
    <div className="p-6 lg:p-8 min-h-[60vh] relative z-0" role="main" aria-label="시장 인텔">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {t("marketIntel.pillarTitle")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("marketIntel.pillarSubtitle")}
        </p>
      </header>

      {error != null && error !== "" && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2" role="alert">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{typeof error === "string" ? error : String(error)}</span>
          <button type="button" onClick={() => setError(null)} className="ml-auto underline shrink-0" aria-label="Dismiss">{t("common.refresh")}</button>
        </div>
      )}

      {/* 세분화 분석의뢰 (시장조사 흐름 창 위) */}
      <SectionCard className="mb-6">
        <label className="flex items-center gap-2 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={granularEnabled}
            onChange={(e) => setGranularEnabled(e.target.checked)}
            className="rounded border-input"
          />
          <span className="font-medium text-foreground">* {t("marketIntel.granularRequest")}</span>
        </label>
        {granularEnabled && (
          <div className="space-y-4 pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">{t("marketIntel.granularRequestLabel")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t("marketIntel.country")}</label>
                <select
                  value={granularRequest.country_code}
                  onChange={(e) => setGranularRequest((p) => ({ ...p, country_code: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm"
                >
                  <option value="">—</option>
                  {(countries ?? []).map((c) => (
                    <option key={c?.country_code ?? ""} value={c?.country_code ?? ""}>{c?.name ?? ""} ({c?.country_code ?? ""})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t("marketIntel.item")}</label>
                <input
                  type="text"
                  value={granularRequest.item}
                  onChange={(e) => setGranularRequest((p) => ({ ...p, item: e.target.value }))}
                  placeholder={t("marketIntel.itemPlaceholder")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t("marketIntel.hsCode")}</label>
                <input
                  type="text"
                  value={granularRequest.hs_code}
                  onChange={(e) => setGranularRequest((p) => ({ ...p, hs_code: e.target.value }))}
                  placeholder={t("marketIntel.hsCodePlaceholder")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t("marketIntel.researchType")}</label>
              {!((granularRequest.research_types ?? []).length >= 1) && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">{t("marketIntel.selectAtLeastOneResearchType")}</p>
              )}
              <div className="flex flex-wrap gap-3">
                {(researchTypeOptions ?? []).map((opt) => (
                  <label key={opt?.value ?? ""} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(granularRequest.research_types ?? []).includes(opt?.value)}
                      onChange={() => toggleResearchType(opt?.value)}
                      className="rounded border-input"
                    />
                    <span className="text-sm text-foreground">{opt?.label ?? ""}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveGranularRequest}
                className="inline-flex items-center gap-2 rounded-md bg-pillar1 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                <Save className="w-4 h-4" />
                {requestSaved ? t("marketIntel.requestSaved") : t("marketIntel.saveRequest")}
              </button>
              <button
                type="button"
                onClick={handleViewSegmentedResults}
                disabled={resultsLoading || !((granularRequest.research_types ?? []).length >= 1)}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                <FileSearch className="w-4 h-4" />
                {resultsLoading ? t("common.loading") : t("marketIntel.viewResults")}
              </button>
            </div>
            {segmentedResult && (
              <div className="mt-6 pt-4 border-t border-border space-y-4">
                <h4 className="text-sm font-semibold text-foreground">{t("marketIntel.marketDominance")}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {segmentedResult.market_dominance?.map((md, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="text-xs text-muted-foreground uppercase mb-2">{(md.research_type_label ?? md.research_type)} · {md.metric}</p>
                      <ul className="text-sm text-foreground space-y-1">
                        {md.top_players?.map((p, j) => (
                          <li key={j}>{p.name}: {p.share_or_value}{p.description ? ` — ${p.description}` : ""}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <h4 className="text-sm font-semibold text-foreground mt-4">{t("marketIntel.relatedCompanies")}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-border rounded-lg">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left p-2 font-medium">{t("marketIntel.companyName")}</th>
                        <th className="text-left p-2 font-medium">{t("marketIntel.country")}</th>
                        <th className="text-left p-2 font-medium">{t("marketIntel.productsOrHs")}</th>
                        <th className="text-left p-2 font-medium">{t("marketIntel.contact")}</th>
                        <th className="text-left p-2 font-medium">{t("marketIntel.contactSource")}</th>
                        <th className="text-left p-2 font-medium">{t("marketIntel.reasonShort")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {segmentedResult.related_companies?.map((rc, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="p-2">{rc.company_name}</td>
                          <td className="p-2">{rc.country_code}</td>
                          <td className="p-2">{rc.products_or_hs}</td>
                          <td className="p-2">
                            {rc.contact?.email && <span>{rc.contact.email}</span>}
                            {rc.contact?.phone && <span>{rc.contact.phone}</span>}
                            {!rc.contact?.email && !rc.contact?.phone && "—"}
                          </td>
                          <td className="p-2 text-muted-foreground">{rc.contact?.source ?? "—"} {rc.contact?.as_of && `(${rc.contact.as_of})`}</td>
                          <td className="p-2">{rc.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(segmentedResult.data_sources_used?.length ?? 0) > 0 && (
                  <div className="mt-4 p-3 rounded-lg border border-border bg-muted/20">
                    <h4 className="text-sm font-semibold text-foreground mb-1">{t("marketIntel.dataSourcesUsed")}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{t("marketIntel.dataSourcesUsedDesc")}</p>
                    <ul className="flex flex-wrap gap-2 text-xs text-foreground">
                      {segmentedResult.data_sources_used.map((src, idx) => (
                        <li key={idx} className="px-2 py-1 rounded-md bg-card border border-border">{src}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* 흐름: 툴 → 서비스 → 결과물 */}
      <SectionCard title={t("marketIntel.flowTitle")} className="mb-6">
        {loading ? (
          <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
        ) : (
          <div className="flex flex-col lg:flex-row items-stretch gap-4 lg:gap-2">
            <div className="flex-1 rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {t("marketIntel.tools")}
              </h3>
              <div className="space-y-2">
                {(Array.isArray(tools) ? tools : []).map((tool, idx) => (
                  <div
                    key={tool?.id ?? `tool-${idx}`}
                    className="flex items-start gap-2 p-2 rounded-md bg-card border border-border"
                  >
                    <BarChart3 className="w-4 h-4 text-pillar1 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground text-sm">{tool?.name ?? ""}</div>
                      <div className="text-xs text-muted-foreground">{tool?.description ?? ""}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center shrink-0 text-muted-foreground">
              <ArrowRight className="w-6 h-6 lg:rotate-0 rotate-90" />
            </div>
            <div className="flex-1 rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {t("marketIntel.services")}
              </h3>
              <div className="space-y-2">
                {(Array.isArray(services) ? services : []).map((svc, idx) => (
                  <div
                    key={svc?.id ?? `svc-${idx}`}
                    className="flex items-center gap-2 p-2 rounded-md bg-card border border-border"
                  >
                    <span className="text-pillar1 font-mono text-xs">{t("marketIntel.step")} {svc?.step ?? ""}</span>
                    <span className="font-medium text-foreground text-sm">{svc?.name ?? ""}</span>
                    <span className="text-xs text-muted-foreground truncate">{svc?.description ?? ""}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center shrink-0 text-muted-foreground lg:block hidden">
              <ArrowRight className="w-6 h-6" />
            </div>
            <div className="flex-1 rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {t("marketIntel.outputs")}
              </h3>
              <div className="space-y-2">
                {(Array.isArray(results) ? results : []).map((r, idx) => (
                  <ResultBlock
                    key={r?.id ?? `result-${idx}`}
                    icon={r?.id === "needs" ? ListOrdered : r?.id === "complaints" ? AlertTriangle : ShoppingBag}
                    title={r?.title ?? ""}
                    sub={r?.period ?? ""}
                    color={r?.id === "needs" ? "pillar1" : r?.id === "complaints" ? "accent" : "primary"}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title={t("marketIntel.sourcesSection")} className="mb-6">
        {CATEGORY_ORDER.map((catId) => {
          const items = (sourcesList || []).filter((s) => s.category === catId);
          if (!items.length) return null;
          const catLabel = (sourceCategories || []).find((c) => c.id === catId)?.label ?? t(`marketIntel.${CATEGORY_TKEY[catId] ?? catId}`);
          return (
            <div key={catId} className="mb-6 last:mb-0">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{catLabel}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((src) => (
                  <div
                    key={src.id ?? src.name}
                    className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-foreground">{src.name}</div>
                      {src.url && (
                        <a href={src.url} target="_blank" rel="noreferrer noopener" className="text-primary hover:opacity-80 shrink-0" aria-label="Open link">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{src.description}</div>
                    {src.purpose && <div className="text-xs text-muted-foreground">{t("marketIntel.purpose")}: {src.purpose}</div>}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {src.price_tier && PRICE_TKEY[src.price_tier] && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-primary/20 text-primary">
                          {t(`marketIntel.${PRICE_TKEY[src.price_tier]}`)}
                        </span>
                      )}
                      {src.type && TYPE_TKEY[src.type] && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                          {t(`marketIntel.${TYPE_TKEY[src.type]}`)}
                        </span>
                      )}
                      {src.b2b_b2c && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-accent/20 text-accent">
                          {t(`marketIntel.${src.b2b_b2c}`)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {(!sourcesList || sourcesList.length === 0) && (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        )}
        {/* 유료 API 소스 사용자별 선택 */}
        {(sourcesList || []).filter((s) => s.type === "paid_api").length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-foreground mb-2">{t("marketIntel.paidSourceSelection")}</h3>
            <div className="flex flex-wrap gap-4 mb-3">
              {(sourcesList || []).filter((s) => s.type === "paid_api").map((src) => (
                <label key={src.id ?? src.name} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabledPaidSourceIds.includes(src.id)}
                    onChange={() => togglePaidSource(src.id)}
                    className="rounded border-input"
                  />
                  <span className="text-sm text-foreground">{src.name}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSavePaidSources}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Save className="w-4 h-4" />
              {paidSourcesSaved ? t("marketIntel.saved") : t("marketIntel.saveReportSettings")}
            </button>
          </div>
        )}
      </SectionCard>

      {currentCountryCode && (
        <SectionCard title={t("marketIntel.newsSummaryTitle")} className="mb-6">
          <p className="text-xs text-muted-foreground mb-3">
            {t("marketIntel.country")}: <strong>{currentCountryCode}</strong> · {t("marketIntel.newsSummarySubtitle")}
          </p>
          <div className="space-y-3">
            {(Array.isArray(newsItems) ? newsItems : []).map((item, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium text-foreground">{item?.title ?? ""}</span>
                  {item?.b2b_b2c && (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-accent/20 text-accent">
                      {typeof t === "function" ? t(`marketIntel.${item.b2b_b2c}`) : item.b2b_b2c}
                    </span>
                  )}
                  {item?.date && <span className="text-xs text-muted-foreground">{String(item.date)}</span>}
                </div>
                <p className="text-sm text-muted-foreground">{item?.summary ?? ""}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("marketIntel.contactSource")}: {item?.source ?? ""}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* 시장 리포트 출력 설정 */}
      <SectionCard title={t("marketIntel.reportSettingsTitle")} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("marketIntel.reportFormat")}</label>
              <select
                value={reportOptions.format}
                onChange={(e) => setReportOptions((p) => ({ ...p, format: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm"
              >
                {FORMAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("marketIntel.reportScope")}</label>
              <select
                value={reportOptions.scope}
                onChange={(e) => setReportOptions((p) => ({ ...p, scope: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm"
              >
                {SCOPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{t(`marketIntel.${o.tKey}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("marketIntel.reportSchedule")}</label>
              <select
                value={reportOptions.schedule}
                onChange={(e) => setReportOptions((p) => ({ ...p, schedule: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm"
              >
                {SCHEDULE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{t(`marketIntel.${o.tKey}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("common.reportLanguage")}</label>
              <select
                value={reportOptions.language || "ko"}
                onChange={(e) => setReportOptions((p) => ({ ...p, language: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm"
              >
                {getReportLanguageOptions(t).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("marketIntel.reportTier")}</label>
              <select
                value={reportOptions.report_tier || "medium"}
                onChange={(e) => setReportOptions((p) => ({ ...p, report_tier: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm"
              >
                {(Array.isArray(reportTierOptions) && reportTierOptions.length ? reportTierOptions : [{ value: "medium", label: t("marketIntel.reportTierMedium") }, { value: "high", label: t("marketIntel.reportTierHigh") }, { value: "highest", label: t("marketIntel.reportTierHighest") }]).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("marketIntel.targetPageCount")}</label>
              <input
                type="number"
                min={5}
                max={200}
                value={reportOptions.target_page_count ?? 20}
                onChange={(e) => setReportOptions((p) => ({ ...p, target_page_count: Math.max(5, Math.min(200, parseInt(e.target.value, 10) || 20)) }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveReportSettings}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saved ? t("marketIntel.saved") : t("marketIntel.saveReportSettings")}
              </button>
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={reportGenLoading}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                {reportGenLoading ? t("common.loading") : t("common.reportGenerate")}
              </button>
            </div>
            {reportGenMessage && (
              <p className="text-sm text-muted-foreground mt-2 p-2 rounded bg-muted/50" role="status">{reportGenMessage}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t("marketIntel.reportSections")}</label>
            <div className="space-y-2 max-h-48 overflow-y-auto rounded-md border border-border p-3 bg-muted/30">
              {(Array.isArray(reportMeta.sections) ? reportMeta.sections : []).map((sec) => (
                <label key={sec?.id ?? ""} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(reportOptions.sections ?? []).includes(sec?.id)}
                    onChange={() => toggleSection(sec?.id)}
                    className="rounded border-input"
                  />
                  <span className="text-sm text-foreground">{sec?.label ?? ""}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

const resultColors = {
  pillar1: "bg-pillar1/20 text-pillar1",
  accent: "bg-accent/20 text-accent",
  primary: "bg-primary/20 text-primary",
};

function ResultBlock({ icon: Icon, title, sub, color }) {
  const SafeIcon = Icon && typeof Icon === "function" ? Icon : BarChart3;
  return (
    <div className="p-4 rounded-lg border border-border bg-muted/30 flex items-start gap-3">
      <div className={`p-2 rounded-md shrink-0 ${resultColors[color] ?? resultColors.primary}`}>
        <SafeIcon className="w-5 h-5" />
      </div>
      <div>
        <div className="font-medium text-foreground">{title != null ? String(title) : ""}</div>
        <div className="text-sm text-muted-foreground">{sub != null ? String(sub) : ""}</div>
      </div>
    </div>
  );
}
