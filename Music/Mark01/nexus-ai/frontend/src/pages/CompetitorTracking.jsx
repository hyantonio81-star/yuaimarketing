import { useState, useEffect } from "react";
import {
  Globe,
  DollarSign,
  Package,
  Briefcase,
  FileText,
  Megaphone,
  Cpu,
  Bell,
  FileDown,
  Plus,
  Trash2,
  AlertTriangle,
  Save,
} from "lucide-react";
import SectionCard from "../components/SectionCard";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useMarket } from "../context/MarketContext.jsx";
import { api, competitorsApi, marketIntelApi } from "../lib/api.js";
import { getCurrentCountryCode } from "../lib/marketStore.js";
import { Link } from "react-router-dom";

const AUTO_TRACKING = [
  { tKey: "autoTrackingWebsite", tool: "Visualping", icon: Globe },
  { tKey: "autoTrackingPrice", tool: "Price monitoring bots", icon: DollarSign },
  { tKey: "autoTrackingProduct", tool: "Product Hunt, Crunchbase", icon: Package },
  { tKey: "autoTrackingHiring", tool: "LinkedIn, Indeed", icon: Briefcase },
  { tKey: "autoTrackingPatent", tool: "USPTO, EPO API", icon: FileText },
  { tKey: "autoTrackingAds", tool: "Facebook Ad Library, Pathmatics", icon: Megaphone },
];
const ALGORITHMS = [
  { tKey: "algorithmDiff", desc: "Diff algorithms" },
  { tKey: "algorithmPattern", desc: "ML classifier" },
  { tKey: "algorithmOpportunity", desc: "Opportunity detection" },
];
const ALERTS_CAPABILITY = [
  { labelKey: "alertInstantLabel", channelKey: "alertChannelsFormat", icon: Bell },
  { labelKey: "alertWeeklyLabel", channelKey: "alertFormatPdf", icon: FileDown },
];

const EVENT_TYPE_KEYS = {
  website: "eventTypeWebsite",
  price: "eventTypePrice",
  product: "eventTypeProduct",
  hiring: "eventTypeHiring",
  patent: "eventTypePatent",
  ads: "eventTypeAds",
};

export default function CompetitorTracking() {
  const { t, language: uiLanguage } = useLanguage();
  const { currentCountryCode } = useMarket();
  const country = currentCountryCode || getCurrentCountryCode() || "ALL";

  const [competitors, setCompetitors] = useState([]);
  const [events, setEvents] = useState([]);
  const [reports, setReports] = useState([]);
  const [alertSettings, setAlertSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [reportGenLoading, setReportGenLoading] = useState(false);
  const [trackingProfile, setTrackingProfile] = useState(null);
  const [industryOptions, setIndustryOptions] = useState([]);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [productFocus, setProductFocus] = useState(["", ""]);
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [marketIntelNews, setMarketIntelNews] = useState([]);
  const [countriesList, setCountriesList] = useState([]);
  const [showOtherCountries, setShowOtherCountries] = useState(false);
  const [additionalCountries, setAdditionalCountries] = useState([]);
  const [reportSchedule, setReportSchedule] = useState("once");

  const orgId = "default";
  const lang = uiLanguage === "es" ? "es" : uiLanguage === "en" ? "en" : "ko";

  useEffect(() => {
    api.get("/markets/countries").then((r) => setCountriesList(r.data?.countries ?? [])).catch(() => setCountriesList([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [listRes, eventsRes, reportsRes, settingsRes, profileRes, industryRes] = await Promise.all([
          competitorsApi.getList(orgId, country),
          competitorsApi.getEvents(orgId, country, 20),
          competitorsApi.getReports(orgId, country),
          competitorsApi.getAlertSettings(orgId, country),
          competitorsApi.getTrackingProfile(orgId, country),
          competitorsApi.getIndustryOptions(lang),
        ]);
        if (!cancelled) {
          setCompetitors(Array.isArray(listRes?.competitors) ? listRes.competitors : []);
          setEvents(Array.isArray(eventsRes?.events) ? eventsRes.events : []);
          setReports(Array.isArray(reportsRes?.reports) ? reportsRes.reports : []);
          setAlertSettings(settingsRes?.settings != null && typeof settingsRes.settings === "object" ? settingsRes.settings : null);
          setIndustryOptions(Array.isArray(industryRes?.options) ? industryRes.options : []);
          const profile = profileRes?.profile != null && typeof profileRes.profile === "object" ? profileRes.profile : null;
          if (profile) {
            setTrackingProfile(profile);
            setSelectedIndustries(Array.isArray(profile.industries) ? profile.industries : []);
            const pf = Array.isArray(profile.product_focus) && profile.product_focus.length ? profile.product_focus : ["", ""];
            setProductFocus(pf.length >= 2 ? pf : [pf[0] ?? "", pf[1] ?? ""]);
            setAdditionalCountries(Array.isArray(profile.additional_countries) ? profile.additional_countries : []);
            setShowOtherCountries((profile.additional_countries?.length ?? 0) > 0);
          } else {
            setSelectedIndustries([]);
            setProductFocus(["", ""]);
            setAdditionalCountries([]);
          }
        }
      } catch (e) {
        if (!cancelled) {
          const raw = e?.apiMessage ?? e?.response?.data?.error ?? e?.response?.data?.message ?? e?.message;
          setError(typeof raw === "string" ? raw : (typeof t === "function" ? t("competitorTracking.loadFailed") : "Load failed"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [country, lang, t]);

  useEffect(() => {
    if (!country || country === "ALL") {
      setMarketIntelNews([]);
      return;
    }
    marketIntelApi.getNewsSummary(country, lang).then((r) => setMarketIntelNews(r?.items ?? [])).catch(() => setMarketIntelNews([]));
  }, [country, lang]);

  const handleAddCompetitor = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await competitorsApi.addCompetitor(orgId, country, { name: newName.trim(), url: newUrl.trim() || undefined });
      if (res?.competitor != null) setCompetitors((prev) => [...(Array.isArray(prev) ? prev : []), res.competitor]);
      setNewName("");
      setNewUrl("");
    } catch (e) {
      const msg = e?.response?.data?.error ?? e?.message;
      setError(typeof msg === "string" ? msg : (typeof t === "function" ? t("competitorTracking.saveFailed") : "Save failed"));
    }
    setAdding(false);
  };

  const handleDeleteCompetitor = async (id) => {
    setError(null);
    try {
      await competitorsApi.deleteCompetitor(orgId, country, id);
      setCompetitors((prev) => (Array.isArray(prev) ? prev : []).filter((c) => c?.id !== id));
    } catch (e) {
      const msg = e?.response?.data?.error ?? e?.message;
      setError(typeof msg === "string" ? msg : (typeof t === "function" ? t("competitorTracking.saveFailed") : "Save failed"));
    }
  };

  const handleSaveAlertSettings = async () => {
    if (!alertSettings) return;
    setSavingSettings(true);
    setError(null);
    try {
      const res = await competitorsApi.setAlertSettings(orgId, country, alertSettings);
      setAlertSettings(res.settings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (e) {
      const msg = e?.response?.data?.error ?? e?.message;
      setError(typeof msg === "string" ? msg : (typeof t === "function" ? t("competitorTracking.saveFailed") : "Save failed"));
    }
    setSavingSettings(false);
  };

  const handleGenerateReport = async () => {
    setReportGenLoading(true);
    setError(null);
    try {
      const report = await competitorsApi.generateReport(orgId, country, reportSchedule);
      if (report != null) setReports((prev) => [report, ...(Array.isArray(prev) ? prev : [])]);
    } catch (e) {
      const msg = e?.response?.data?.error ?? e?.message;
      setError(typeof msg === "string" ? msg : (typeof t === "function" ? t("competitorTracking.saveFailed") : "Save failed"));
    }
    setReportGenLoading(false);
  };

  const toggleAdditionalCountry = (code) => {
    setAdditionalCountries((prev) => {
      const list = prev ?? [];
      return list.includes(code) ? list.filter((c) => c !== code) : [...list, code];
    });
  };

  const toggleIndustry = (id) => {
    setSelectedIndustries((prev) => {
      const list = prev ?? [];
      return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    });
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setError(null);
    try {
      const res = await competitorsApi.setTrackingProfile(orgId, country, {
        industries: Array.isArray(selectedIndustries) ? selectedIndustries : [],
        product_focus: (Array.isArray(productFocus) ? productFocus : []).filter((p) => p != null && String(p).trim()),
        additional_countries: Array.isArray(additionalCountries) ? additionalCountries : [],
      });
      setTrackingProfile(res.profile);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (e) {
      const msg = e?.response?.data?.error ?? e?.message;
      setError(typeof msg === "string" ? msg : (typeof t === "function" ? t("competitorTracking.saveFailed") : "Save failed"));
    }
    setSavingProfile(false);
  };

  const setProductAt = (index, value) => {
    setProductFocus((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      const next = [...list];
      next[index] = value;
      return next;
    });
  };

  const addProductSlot = () => {
    setProductFocus((prev) => [...(Array.isArray(prev) ? prev : []), ""]);
  };

  const removeProductSlot = (index) => {
    setProductFocus((prev) => (Array.isArray(prev) ? prev : []).filter((_, i) => i !== index));
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString(uiLanguage === "es" ? "es" : uiLanguage === "en" ? "en-US" : "ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {t("competitorTracking.pageTitle")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("competitorTracking.pageSubtitle")}
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-2">
          {country && country !== "ALL" && (
            <span className="text-sm text-muted-foreground">
              {t("competitorTracking.currentMarket")}: <strong>{country}</strong>
            </span>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOtherCountries}
              onChange={(e) => setShowOtherCountries(e.target.checked)}
              className="rounded border-input"
            />
            <span className="text-sm text-foreground">{t("competitorTracking.selectOtherCountries")}</span>
          </label>
        </div>
        {showOtherCountries && (Array.isArray(countriesList) ? countriesList : []).length > 0 && (
          <div className="mt-3 p-3 rounded-lg border border-border bg-muted/20">
            <p className="text-xs text-muted-foreground mb-2">{t("competitorTracking.additionalCountriesHint")}</p>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(countriesList) ? countriesList : [])
                .filter((c) => c?.country_code != null && c.country_code !== country)
                .map((c) => (
                  <label key={c?.country_code ?? ""} className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded bg-background border border-border">
                    <input
                      type="checkbox"
                      checked={(additionalCountries ?? []).includes(c?.country_code)}
                      onChange={() => toggleAdditionalCountry(c?.country_code)}
                      className="rounded border-input"
                    />
                    <span className="text-sm">{c?.name ?? c?.country_code ?? ""}</span>
                  </label>
                ))}
            </div>
          </div>
        )}
      </header>

      {error != null && error !== "" && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2" role="alert">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{typeof error === "string" ? error : String(error)}</span>
          <button type="button" onClick={() => setError(null)} className="ml-auto underline shrink-0">{t("common.refresh")}</button>
        </div>
      )}

      {/* 관심 스코프 (국가·업계·제품) */}
      <SectionCard title={t("competitorTracking.interestScopeTitle")} className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">{t("competitorTracking.interestScopeHint")}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t("competitorTracking.industrySector")}</label>
            <div className="flex flex-wrap gap-3">
              {(Array.isArray(industryOptions) ? industryOptions : []).map((opt) => (
                <label key={opt?.id ?? ""} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(selectedIndustries ?? []).includes(opt?.id)}
                    onChange={() => toggleIndustry(opt?.id)}
                    className="rounded border-input"
                  />
                  <span className="text-sm text-foreground">{opt?.label ?? ""}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t("competitorTracking.productFocus")}</label>
            <div className="space-y-2">
              {(Array.isArray(productFocus) ? productFocus : []).map((value, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setProductAt(index, e.target.value)}
                    placeholder={t("competitorTracking.productPlaceholder")}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm max-w-xs"
                  />
                  {(Array.isArray(productFocus) ? productFocus : []).length > 2 && (
                    <button type="button" onClick={() => removeProductSlot(index)} className="text-destructive hover:opacity-80 p-1" aria-label={t("competitorTracking.deleteCompetitor")}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addProductSlot} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                <Plus className="w-4 h-4" />
                {t("competitorTracking.addProduct")}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="inline-flex items-center gap-2 rounded-md bg-pillar2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {profileSaved ? t("competitorTracking.profileSaved") : t("competitorTracking.saveProfile")}
          </button>
        </div>
      </SectionCard>

      {/* 시장 인텔 요약 (Market Intel 연동) */}
      {country && country !== "ALL" && (
        <SectionCard title={t("competitorTracking.marketIntelSummaryTitle")} className="mb-6">
          <p className="text-sm text-muted-foreground mb-3">{t("competitorTracking.marketIntelSummaryHint")}</p>
          {(Array.isArray(marketIntelNews) ? marketIntelNews : []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : (
            <ul className="space-y-2 mb-3">
              {(Array.isArray(marketIntelNews) ? marketIntelNews : []).slice(0, 3).map((item, i) => (
                <li key={i} className="p-2 rounded-md bg-muted/30 border border-border">
                  <span className="font-medium text-foreground text-sm">{item?.title ?? ""}</span>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item?.summary ?? ""}</p>
                </li>
              ))}
            </ul>
          )}
          <Link to="/market-intel" className="text-sm text-primary hover:underline">
            → {t("nav.marketIntel")}
          </Link>
        </SectionCard>
      )}

      {/* 추적 중인 경쟁사 */}
      <SectionCard title={t("competitorTracking.myCompetitorsTitle")} className="mb-6">
        {loading ? (
          <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
        ) : (
          <>
            {competitors.length === 0 ? (
              <p className="text-sm text-muted-foreground mb-4">{t("competitorTracking.myCompetitorsEmpty")}</p>
            ) : (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border border-border rounded-lg">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left p-2 font-medium">{t("competitorTracking.competitorName")}</th>
                      <th className="text-left p-2 font-medium">{t("competitorTracking.competitorUrl")}</th>
                      <th className="text-left p-2 font-medium w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(competitors) ? competitors : []).map((c) => (
                      <tr key={c?.id ?? ""} className="border-b border-border last:border-0">
                        <td className="p-2 font-medium">{c?.name ?? ""}</td>
                        <td className="p-2 text-muted-foreground">{c?.url ? <a href={c.url} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline truncate max-w-[200px] inline-block">{c.url}</a> : "—"}</td>
                        <td className="p-2">
                          <button type="button" onClick={() => handleDeleteCompetitor(c?.id)} className="text-destructive hover:opacity-80 p-1" aria-label={t("competitorTracking.deleteCompetitor")}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <form onSubmit={handleAddCompetitor} className="flex flex-wrap items-end gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("competitorTracking.competitorName")}
                className="rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm w-48"
              />
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder={t("competitorTracking.competitorUrl")}
                className="rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm w-64"
              />
              <button type="submit" disabled={adding || !newName.trim()} className="inline-flex items-center gap-2 rounded-md bg-pillar2 px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
                <Plus className="w-4 h-4" />
                {t("competitorTracking.addCompetitor")}
              </button>
            </form>
          </>
        )}
      </SectionCard>

      {/* 최근 알림 */}
      <SectionCard title={t("competitorTracking.recentAlertsTitle")} className="mb-6">
        {loading ? (
          <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("competitorTracking.recentAlertsEmpty")}</p>
        ) : (
          <ul className="space-y-3">
            {(Array.isArray(events) ? events : []).map((ev) => (
              <li key={ev?.id ?? ""} className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-start gap-2">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{formatDate(ev?.occurred_at)}</span>
                  <span className="px-1.5 py-0.5 rounded text-xs bg-pillar2/20 text-pillar2">
                    {typeof t === "function" ? t(`competitorTracking.${EVENT_TYPE_KEYS[ev?.type] || "eventTypeWebsite"}`) : ev?.type ?? ""}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground">{ev?.competitor_name ?? ""} — {ev?.title ?? ""}</div>
                  <p className="text-sm text-muted-foreground mt-0.5">{ev?.summary ?? ""}</p>
                  <p className="text-xs text-muted-foreground mt-1">{ev?.source ?? ""}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* 주간 경쟁사 리포트 */}
      <SectionCard title={t("competitorTracking.weeklyReportsTitle")} className="mb-6">
        {loading ? (
          <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
        ) : (
          <>
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground mb-4">{t("competitorTracking.weeklyReportsEmpty")}</p>
            ) : (
              <ul className="space-y-2 mb-4">
                {(Array.isArray(reports) ? reports : []).map((r) => (
                  <li key={r?.id ?? ""} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border">
                    <span className="text-sm font-medium">{r?.period ?? ""}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-pillar2/20 text-pillar2 mr-2">
                      {r?.schedule === "monthly" ? t("competitorTracking.reportMonthly") : r?.schedule === "weekly" ? t("competitorTracking.reportWeekly") : t("competitorTracking.reportOnce")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r?.status === "pending" ? t("competitorTracking.reportPending") : (r?.generated_at != null ? String(r.generated_at).slice(0, 10) : "")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-sm text-muted-foreground">{t("competitorTracking.reportScheduleLabel")}:</span>
              {["once", "weekly", "monthly"].map((s) => (
                <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="reportSchedule"
                    checked={reportSchedule === s}
                    onChange={() => setReportSchedule(s)}
                    className="border-input"
                  />
                  <span className="text-sm">{s === "monthly" ? t("competitorTracking.reportMonthly") : s === "weekly" ? t("competitorTracking.reportWeekly") : t("competitorTracking.reportOnce")}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={reportGenLoading}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              {reportGenLoading ? t("common.loading") : t("competitorTracking.generateReport")}
            </button>
          </>
        )}
      </SectionCard>

      {/* 알림 수신 설정 */}
      <SectionCard title={t("competitorTracking.alertSettingsTitle")} className="mb-6">
        {loading ? (
          <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
        ) : alertSettings ? (
          <div className="space-y-4">
            <div>
              <div className="font-medium text-foreground mb-2">{t("competitorTracking.instantAlerts")}</div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!alertSettings?.instant_alerts_email}
                    onChange={(e) => setAlertSettings((s) => ({ ...(s || {}), instant_alerts_email: e.target.checked }))}
                    className="rounded border-input"
                  />
                  <span className="text-sm">{t("competitorTracking.email")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!alertSettings?.instant_alerts_slack}
                    onChange={(e) => setAlertSettings((s) => ({ ...(s || {}), instant_alerts_slack: e.target.checked }))}
                    className="rounded border-input"
                  />
                  <span className="text-sm">{t("competitorTracking.slack")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!alertSettings?.instant_alerts_whatsapp}
                    onChange={(e) => setAlertSettings((s) => ({ ...(s || {}), instant_alerts_whatsapp: e.target.checked }))}
                    className="rounded border-input"
                  />
                  <span className="text-sm">{t("competitorTracking.whatsapp")}</span>
                </label>
              </div>
            </div>
            <div>
              <div className="font-medium text-foreground mb-2">{t("competitorTracking.weeklyReport")}</div>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={!!alertSettings?.weekly_report_enabled}
                  onChange={(e) => setAlertSettings((s) => ({ ...(s || {}), weekly_report_enabled: e.target.checked }))}
                  className="rounded border-input"
                />
                <span className="text-sm">{t("competitorTracking.weeklyReportChannel")}</span>
              </label>
              <div className="flex flex-wrap gap-4 mt-1">
                {["email", "slack", "whatsapp"].map((ch) => (
                  <label key={ch} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(Array.isArray(alertSettings?.weekly_report_channels) ? alertSettings.weekly_report_channels : []).includes(ch)}
                      onChange={(e) => {
                        const channels = Array.isArray(alertSettings?.weekly_report_channels) ? alertSettings.weekly_report_channels : [];
                        const next = e.target.checked ? [...channels, ch] : channels.filter((c) => c !== ch);
                        setAlertSettings((s) => ({ ...(s || {}), weekly_report_channels: next.length ? next : ["email"] }));
                      }}
                      className="rounded border-input"
                    />
                    <span className="text-sm">{ch === "whatsapp" ? t("competitorTracking.whatsapp") : ch === "slack" ? t("competitorTracking.slack") : t("competitorTracking.email")}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveAlertSettings}
              disabled={savingSettings}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {settingsSaved ? t("competitorTracking.saved") : t("competitorTracking.saveSettings")}
            </button>
          </div>
        ) : null}
      </SectionCard>

      {/* 자동 추적 (기능 소개) */}
      <SectionCard title={t("competitorTracking.autoTrackingTitle")} className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Array.isArray(AUTO_TRACKING) ? AUTO_TRACKING : []).map(({ tKey, tool, icon: Icon }) => {
            const SafeIcon = Icon && typeof Icon === "function" ? Icon : Globe;
            return (
              <div key={tKey ?? ""} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <SafeIcon className="w-5 h-5 text-pillar2 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-foreground">{typeof t === "function" ? t(`competitorTracking.${tKey}`) : tKey}</div>
                  <div className="text-sm text-muted-foreground font-mono">{tool ?? ""}</div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* 알고리즘 */}
      <SectionCard title={t("competitorTracking.algorithmsTitle")} className="mb-6">
        <div className="flex flex-wrap gap-4">
          {ALGORITHMS.map(({ tKey, desc }) => (
            <div key={tKey} className="flex items-center gap-2 px-4 py-2 rounded-md bg-pillar2/10 border border-pillar2/30">
              <Cpu className="w-4 h-4 text-pillar2" />
              <span className="font-medium text-foreground">{t(`competitorTracking.${tKey}`)}</span>
              <span className="text-sm text-muted-foreground">— {desc}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 알림 채널 (기능 소개) */}
      <SectionCard title={t("competitorTracking.alertsTitle")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Array.isArray(ALERTS_CAPABILITY) ? ALERTS_CAPABILITY : []).map(({ labelKey, channelKey, icon: Icon }) => {
            const SafeIcon = Icon && typeof Icon === "function" ? Icon : Bell;
            return (
              <div key={labelKey ?? ""} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30">
                <div className="p-2 rounded-md bg-accent/20 text-accent">
                  <SafeIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{typeof t === "function" ? t(`competitorTracking.${labelKey}`) : labelKey}</div>
                  <div className="text-sm text-muted-foreground">{typeof t === "function" ? t(`competitorTracking.${channelKey}`) : channelKey}</div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
