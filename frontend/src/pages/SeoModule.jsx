import { useState, useEffect } from "react";
import {
  Search,
  BarChart2,
  Link2,
  Calendar,
  FileText,
  Tags,
  Image,
  Zap,
  Sparkles,
  ImageIcon,
  Megaphone,
  Copy,
  Download,
} from "lucide-react";
import SectionCard from "../components/SectionCard";
import { api } from "../lib/api";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useMarket } from "../context/MarketContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const TOOLS = [
  { nameKey: "toolAhrefs", descKey: "toolAhrefsDesc", icon: BarChart2 },
  { nameKey: "toolSemrush", descKey: "toolSemrushDesc", icon: Search },
  { nameKey: "toolGsc", descKey: "toolGscDesc", icon: BarChart2 },
  { nameKey: "toolAtp", descKey: "toolAtpDesc", icon: Search },
];

const AUTO_ANALYSIS = [
  { labelKey: "analysisGap", subKey: "analysisGapSub", icon: Zap },
  { labelKey: "analysisContent", subKey: "analysisContentSub", icon: FileText },
  { labelKey: "analysisBacklink", subKey: "analysisBacklinkSub", icon: Link2 },
  { labelKey: "analysisSeasonal", subKey: "analysisSeasonalSub", icon: Calendar },
];

const AI_GENERATION = [
  { labelKey: "aiOutline", icon: FileText },
  { labelKey: "aiMeta", icon: Tags },
  { labelKey: "aiInfographic", icon: Image },
];

function stripHtml(html) {
  if (!html || typeof html !== "string") return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const LOCALE_OPTIONS = [
  { value: "", labelKey: "localeAppDefault" },
  { value: "ko", labelKey: "localeKo" },
  { value: "en", labelKey: "localeEn" },
  { value: "es", labelKey: "localeEs" },
];

export default function SeoModule() {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const { countries, currentCountryCode } = useMarket();
  const [targetCountryCode, setTargetCountryCode] = useState("");
  const [targetLocale, setTargetLocale] = useState("");
  const [sectionBlog, setSectionBlog] = useState(true);
  const [sectionSocial, setSectionSocial] = useState(true);
  const [sectionAd, setSectionAd] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [suggestionsResult, setSuggestionsResult] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState("");
  const [autonomousEnabled, setAutonomousEnabled] = useState(false);
  const [autonomousCount, setAutonomousCount] = useState(3);

  useEffect(() => {
    if (!isAdmin) setAutonomousEnabled(false);
  }, [isAdmin]);

  useEffect(() => {
    if (currentCountryCode && !targetCountryCode) setTargetCountryCode(currentCountryCode);
  }, [currentCountryCode, targetCountryCode]);

  const effectiveLimit = autonomousEnabled && isAdmin ? autonomousCount : null;
  const effectiveCountry = targetCountryCode || currentCountryCode || "";
  const effectiveLocale = targetLocale;

  const handleDownloadSuggestions = async () => {
    if (!suggestionsResult) return;
    const { keyword, outline, meta, infographic_suggestions } = suggestionsResult;
    const safeKeyword = (keyword || t("seoContent.defaultKeyword")).trim();
    const slug = safeKeyword.replace(/[^\w\u3131-\uD7A3\-]+/g, "_").slice(0, 40) || "suggestions";
    const filename = `seo-suggestions-${slug}.pdf`;

    const escapeHtml = (s) => {
      if (s == null) return "";
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    };

    let html = `<div style="font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; padding: 20px; font-size: 12px; color: #1a1a1a;">`;
    html += `<h1 style="font-size: 18px; margin-bottom: 8px;">${escapeHtml(t("seoContent.suggestionsCardTitle"))}</h1>`;
    html += `<p style="margin-bottom: 16px; color: #666;">Keyword: ${escapeHtml(safeKeyword)}</p>`;

    if (outline && outline.length > 0) {
      html += `<h2 style="font-size: 14px; margin-top: 16px; margin-bottom: 8px;">${escapeHtml(t("seoContent.outlineSuggestions"))}</h2><ul style="margin: 0; padding-left: 20px;">`;
      outline.forEach((item) => {
        html += `<li style="margin-bottom: 4px;">${escapeHtml(item.heading)} — ${escapeHtml(item.summary)}</li>`;
      });
      html += `</ul>`;
    }
    if (meta?.title) {
      html += `<h2 style="font-size: 14px; margin-top: 16px; margin-bottom: 8px;">${escapeHtml(t("seoContent.metaSuggestions"))}</h2>`;
      html += `<p style="margin: 0 0 4px;"><strong>${escapeHtml(meta.title)}</strong></p>`;
      if (meta.meta_description) {
        html += `<p style="margin: 0; color: #444;">${escapeHtml(meta.meta_description)}</p>`;
      }
    }
    if (infographic_suggestions && infographic_suggestions.length > 0) {
      html += `<h2 style="font-size: 14px; margin-top: 16px; margin-bottom: 8px;">${escapeHtml(t("seoContent.infographicSuggestionsList"))}</h2><ul style="margin: 0; padding-left: 20px;">`;
      infographic_suggestions.forEach((topic) => {
        html += `<li style="margin-bottom: 4px;">${escapeHtml(topic)}</li>`;
      });
      html += `</ul>`;
    }
    html += `</div>`;

    const el = document.createElement("div");
    el.innerHTML = html;
    el.style.position = "absolute";
    el.style.left = "-9999px";
    el.style.top = "0";
    el.style.width = "210mm";
    document.body.appendChild(el);

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf().set({
        margin: 12,
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }).from(el).save();
    } finally {
      document.body.removeChild(el);
    }
  };

  const handleConfirmAndGetSuggestions = async () => {
    const keyword = (searchKeyword || "").trim() || t("seoContent.defaultKeyword");
    setSuggestionsLoading(true);
    setSuggestionsResult(null);
    setSuggestionsError(null);
    try {
      const { data } = await api.get("/seo/suggestions", {
        params: { keyword, country: effectiveCountry || undefined, locale: effectiveLocale || undefined },
      });
      setSuggestionsResult(data);
    } catch (e) {
      setSuggestionsError(e.message || "제안을 불러오지 못했습니다.");
    } finally {
      setSuggestionsLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {t("seoContent.pageTitle")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("seoContent.pageSubtitle")}
        </p>
      </header>

      <SectionCard title={t("seoContent.scopeTitle")} className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          {t("seoContent.scopeDesc")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              {t("seoContent.countryLabel")}
            </label>
            <select
              value={targetCountryCode}
              onChange={(e) => setTargetCountryCode(e.target.value)}
              className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t("seoContent.countryPlaceholder")}</option>
              {(countries || []).map((c) => (
                <option key={c.country_code} value={c.country_code}>
                  {c.name || c.name_en || c.country_code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              {t("seoContent.localeLabel")}
            </label>
            <select
              value={targetLocale}
              onChange={(e) => setTargetLocale(e.target.value)}
              className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {LOCALE_OPTIONS.map((opt) => (
                <option key={opt.value || "default"} value={opt.value}>
                  {t(`seoContent.${opt.labelKey}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              {t("seoContent.searchKeywordLabel")}
            </label>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirmAndGetSuggestions()}
              placeholder={t("seoContent.searchKeywordPlaceholder")}
              className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <button
            type="button"
            onClick={handleConfirmAndGetSuggestions}
            disabled={suggestionsLoading}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {suggestionsLoading ? t("seoContent.generating") : t("seoContent.confirmAndGetSuggestions")}
          </button>
          {isAdmin && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autonomousEnabled}
                onChange={(e) => setAutonomousEnabled(e.target.checked)}
                className="rounded border-border"
              />
              <span className="font-medium text-foreground text-sm">{t("seoContent.autonomous")}</span>
              <span className="text-xs text-muted-foreground">({t("seoContent.operatorOnly")})</span>
              {autonomousEnabled && (
                <>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={autonomousCount}
                    onChange={(e) => setAutonomousCount(Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1)))}
                    className="w-16 rounded-md border border-border bg-muted/50 px-2 py-1 text-sm text-foreground"
                  />
                  <span className="text-muted-foreground text-sm">{t("seoContent.countPerRequest")}</span>
                </>
              )}
            </label>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t("seoContent.sectionSelectionTitle")}
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            {t("seoContent.sectionSelectionDesc")}
          </p>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sectionBlog}
                onChange={(e) => setSectionBlog(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground">{t("seoContent.sectionBlog")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sectionSocial}
                onChange={(e) => setSectionSocial(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground">{t("seoContent.sectionSocial")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sectionAd}
                onChange={(e) => setSectionAd(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground">{t("seoContent.sectionAd")}</span>
            </label>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t("seoContent.toolsTitle")} className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TOOLS.map(({ nameKey, descKey, icon: Icon }) => (
            <div
              key={nameKey}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
            >
              <Icon className="w-5 h-5 text-pillar3 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-foreground">{t(`seoContent.${nameKey}`)}</div>
                <div className="text-sm text-muted-foreground">{t(`seoContent.${descKey}`)}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t("seoContent.autoAnalysisTitle")} className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {AUTO_ANALYSIS.map(({ labelKey, subKey, icon: Icon }) => (
            <div
              key={labelKey}
              className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card"
            >
              <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-foreground">{t(`seoContent.${labelKey}`)}</div>
                <div className="text-sm text-muted-foreground">{t(`seoContent.${subKey}`)}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t("seoContent.aiGenTitle")} className="mb-6">
        <div className="flex flex-wrap gap-4">
          {AI_GENERATION.map(({ labelKey, icon: Icon }) => (
            <div
              key={labelKey}
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/10 border border-primary/30 text-foreground"
            >
              <Icon className="w-4 h-4 text-primary" />
              <span className="font-medium">{t(`seoContent.${labelKey}`)}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t("seoContent.suggestionsCardTitle")} className="mb-6">
        {suggestionsError && (
          <p className="text-sm text-destructive mb-4">{suggestionsError}</p>
        )}
        {!suggestionsResult ? (
          <p className="text-sm text-muted-foreground">
            {t("seoContent.suggestionsEmptyHint")}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Keyword: {suggestionsResult.keyword}
              </p>
              <button
                type="button"
                onClick={handleDownloadSuggestions}
                className="inline-flex items-center gap-1 rounded border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
              >
                <Download className="w-3.5 h-3.5" />
                {t("seoContent.downloadSuggestions")}
              </button>
            </div>
            {suggestionsResult.outline?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t("seoContent.outlineSuggestions")}
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                  {suggestionsResult.outline.map((item, i) => (
                    <li key={i}>
                      <span className="font-medium">{item.heading}</span> — {item.summary}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {suggestionsResult.meta?.title && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t("seoContent.metaSuggestions")}
                </h4>
                <p className="text-sm font-medium text-foreground">{suggestionsResult.meta.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{suggestionsResult.meta.meta_description}</p>
              </div>
            )}
            {suggestionsResult.infographic_suggestions?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t("seoContent.infographicSuggestionsList")}
                </h4>
                <ul className="space-y-2">
                  {suggestionsResult.infographic_suggestions.map((topic, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-foreground">{topic}</span>
                      <span className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedSuggestion(topic)}
                          className="rounded border border-border px-2 py-0.5 text-xs text-primary hover:bg-primary/10"
                        >
                          {t("seoContent.useForBlog")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSuggestion(topic)}
                          className="rounded border border-border px-2 py-0.5 text-xs text-primary hover:bg-primary/10"
                        >
                          {t("seoContent.useForSocial")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSuggestion(topic)}
                          className="rounded border border-border px-2 py-0.5 text-xs text-primary hover:bg-primary/10"
                        >
                          {t("seoContent.useForAd")}
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {sectionBlog && (
        <BlogPostGenerator
          maxCount={effectiveLimit}
          country={effectiveCountry}
          locale={effectiveLocale}
          suggestedTopic={selectedSuggestion}
          onConsumeSuggestion={() => setSelectedSuggestion("")}
        />
      )}
      {sectionSocial && (
        <SocialCalendarSection
          maxCount={effectiveLimit}
          country={effectiveCountry}
          locale={effectiveLocale}
          suggestedTopic={selectedSuggestion}
          onConsumeSuggestion={() => setSelectedSuggestion("")}
        />
      )}
      {sectionAd && (
        <AdVariantsSection
          maxCount={effectiveLimit}
          country={effectiveCountry}
          locale={effectiveLocale}
          suggestedTopic={selectedSuggestion}
          onConsumeSuggestion={() => setSelectedSuggestion("")}
        />
      )}
    </div>
  );
}

function AdVariantsSection({ maxCount, country: countryProp, locale: localeProp, suggestedTopic, onConsumeSuggestion }) {
  const { t, language } = useLanguage();
  const { currentCountryCode } = useMarket();
  const country = countryProp !== undefined && countryProp !== "" ? countryProp : currentCountryCode;
  const locale = localeProp !== undefined && localeProp !== "" ? localeProp : language;
  const [product, setProduct] = useState("");
  useEffect(() => {
    if (suggestedTopic) setProduct(suggestedTopic);
  }, [suggestedTopic]);
  const [platform, setPlatform] = useState("Google");
  const [variants, setVariants] = useState("10");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedRow, setCopiedRow] = useState(null);
  const displayedVariants = result?.variants != null
    ? (maxCount != null ? result.variants.slice(0, maxCount) : result.variants)
    : [];

  const copyAdRow = async (ad, index) => {
    const text = [ad.headline, ad.description, ad.cta].filter(Boolean).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRow(index);
      setTimeout(() => setCopiedRow(null), 2000);
    } catch (_) {
      setCopiedRow("err");
      setTimeout(() => setCopiedRow(null), 2000);
    }
  };

  const downloadCsv = () => {
    if (!displayedVariants.length) return;
    const headers = ["#", "Angle", "Headline", "Description", "CTA", "Landing Page", "Pred. CTR %"];
    const rows = displayedVariants.map((ad, i) => [
      i + 1,
      ad.angle,
      `"${(ad.headline || "").replace(/"/g, '""')}"`,
      `"${(ad.description || "").replace(/"/g, '""')}"`,
      ad.cta,
      ad.landing_page,
      ad.predicted_ctr != null ? ad.predicted_ctr : "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ad-variants-${result.product || "product"}-${result.platform || "ads"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    onConsumeSuggestion?.();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const requestedVariants = parseInt(variants, 10) || 10;
      const cappedVariants = maxCount != null ? Math.min(requestedVariants, maxCount) : requestedVariants;
      const { data } = await api.get("/seo/ad-variants", {
        params: {
          product: product || t("seoContent.product"),
          platform,
          variants: String(cappedVariants),
          country: country || undefined,
          locale: locale || undefined,
        },
      });
      setResult(data);
    } catch (e) {
      setError(e.message || t("seoContent.adError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title={t("seoContent.adTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t("seoContent.adDesc")}
      </p>

      <div className="mb-6">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("seoContent.inputLabel")}</h4>
        <div className="flex flex-wrap items-end gap-3 mb-2">
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("seoContent.product")}</label>
            <input
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder={t("seoContent.productPlaceholder")}
              className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="min-w-[100px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("seoContent.platform")}</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Google">Google</option>
              <option value="Facebook">Facebook</option>
              <option value="LinkedIn">LinkedIn</option>
            </select>
          </div>
          <div className="min-w-[80px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("seoContent.variantCount")}</label>
            <input
              type="number"
              value={variants}
              onChange={(e) => setVariants(e.target.value)}
              min={1}
              max={50}
              className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Megaphone className="w-4 h-4" />
            {loading ? t("seoContent.generating") : t("seoContent.generateAd")}
          </button>
        </div>
        {(product || platform || variants) && (
          <p className="text-xs text-muted-foreground">
            {t("seoContent.adInputSummary")
              .replace("{product}", product || t("seoContent.productPlaceholder"))
              .replace("{platform}", platform || "—")
              .replace("{n}", variants || "—")}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      {result && (
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("seoContent.outputLabel")}</h4>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              {t("seoContent.adOutputSummary").replace("{count}", String(displayedVariants.length))}
            </p>
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Download className="w-4 h-4" />
              {t("seoContent.downloadCsvAd")}
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-2 font-medium text-muted-foreground">{t("seoContent.adTableNum")}</th>
                  <th className="p-2 font-medium text-muted-foreground">{t("seoContent.adTableAngle")}</th>
                  <th className="p-2 font-medium text-muted-foreground">{t("seoContent.adTableHeadline")}</th>
                  <th className="p-2 font-medium text-muted-foreground">{t("seoContent.adTableDescription")}</th>
                  <th className="p-2 font-medium text-muted-foreground">{t("seoContent.adTableCta")}</th>
                  <th className="p-2 font-medium text-muted-foreground">{t("seoContent.adTableLandingPage")}</th>
                  <th className="p-2 font-medium text-muted-foreground">{t("seoContent.adTablePredCtr")}</th>
                  <th className="p-2 font-medium text-muted-foreground w-20"></th>
                </tr>
              </thead>
              <tbody>
                {displayedVariants.map((ad, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-2 font-mono">{i + 1}</td>
                    <td className="p-2">{ad.angle}</td>
                    <td className="p-2 max-w-[180px] truncate" title={ad.headline}>{ad.headline}</td>
                    <td className="p-2 max-w-[220px] truncate text-muted-foreground" title={ad.description}>{ad.description}</td>
                    <td className="p-2">{ad.cta}</td>
                    <td className="p-2 text-muted-foreground">{ad.landing_page}</td>
                    <td className="p-2 font-mono text-primary">{ad.predicted_ctr}%</td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => copyAdRow(ad, i)}
                        className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-foreground hover:bg-muted"
                        title={t("seoContent.copyThisAd")}
                      >
                        <Copy className="w-3 h-3" />
                        {copiedRow === i ? t("seoContent.copied") : t("seoContent.copyThisAd")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function SocialCalendarSection({ maxCount, country: countryProp, locale: localeProp, suggestedTopic, onConsumeSuggestion }) {
  const { t, language } = useLanguage();
  const { currentCountryCode } = useMarket();
  const country = countryProp !== undefined && countryProp !== "" ? countryProp : currentCountryCode;
  const locale = localeProp !== undefined && localeProp !== "" ? localeProp : language;
  const [product, setProduct] = useState("");
  const [days, setDays] = useState("90");
  useEffect(() => {
    if (suggestedTopic) setProduct(suggestedTopic);
  }, [suggestedTopic]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const previewRows = 14;

  const handleGenerate = async () => {
    onConsumeSuggestion?.();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const { data } = await api.get("/seo/social-calendar", {
        params: {
          product: product || t("seoContent.product"),
          days: days || "90",
          country: country || undefined,
          locale: locale || undefined,
        },
      });
      const posts = data?.posts ?? [];
      const cappedPosts = maxCount != null ? posts.slice(0, maxCount) : posts;
      setResult({ ...data, posts: cappedPosts });
    } catch (e) {
      setError(e.message || t("seoContent.calendarError"));
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    const posts = result?.posts ?? [];
    if (!posts.length) return;
    const headers = ["day", "template", "platform", "text", "hashtags", "image", "schedule", "cta"];
    const rows = posts.map((p) => [
      p.day,
      p.template,
      p.platform,
      `"${(p.text || "").replace(/"/g, '""')}"`,
      (p.hashtags || []).join(" "),
      p.image,
      p.schedule,
      p.cta,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `social-calendar-${result.product || "product"}-${result.days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SectionCard title={t("seoContent.socialTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t("seoContent.socialDesc")}
      </p>

      <div className="mb-6">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("seoContent.inputLabel")}</h4>
        <div className="flex flex-wrap items-end gap-3 mb-2">
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("seoContent.productBrand")}</label>
            <input
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder={t("seoContent.productPlaceholder")}
              className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="min-w-[80px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("seoContent.days")}</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              min={7}
              max={365}
              className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Calendar className="w-4 h-4" />
            {loading ? t("seoContent.generating") : t("seoContent.generateCalendar")}
          </button>
        </div>
        {(product || days) && (
          <p className="text-xs text-muted-foreground">
            {t("seoContent.socialInputSummary")
              .replace("{product}", product || t("seoContent.productPlaceholder"))
              .replace("{days}", days || "—")}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      {result && (
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("seoContent.outputLabel")}</h4>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              {t("seoContent.socialOutputSummary")
                .replace("{days}", String(result.days))
                .replace("{count}", String((result.posts ?? []).length))}
            </p>
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Download className="w-4 h-4" />
              {t("seoContent.csvDownload")}
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-2 font-medium text-muted-foreground">{t("seoContent.socialTableDay")}</th>
                  <th className="p-2 font-medium text-muted-foreground">{t("seoContent.socialTableTemplate")}</th>
                  <th className="p-2 font-medium text-muted-foreground">{t("seoContent.socialTablePlatform")}</th>
                  <th className="p-2 font-medium text-muted-foreground">{t("seoContent.socialTableText")}</th>
                  <th className="p-2 font-medium text-muted-foreground">{t("seoContent.socialTableHashtags")}</th>
                  <th className="p-2 font-medium text-muted-foreground">{t("seoContent.socialTableSchedule")}</th>
                  <th className="p-2 font-medium text-muted-foreground">{t("seoContent.socialTableCta")}</th>
                </tr>
              </thead>
              <tbody>
                {result.posts?.slice(0, previewRows).map((post, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-2 font-mono">{post.day}</td>
                    <td className="p-2">{post.template}</td>
                    <td className="p-2">{post.platform}</td>
                    <td className="p-2 max-w-[200px] truncate text-muted-foreground" title={post.text}>{post.text}</td>
                    <td className="p-2 text-muted-foreground">{(post.hashtags || []).join(" ")}</td>
                    <td className="p-2 text-muted-foreground">{post.schedule}</td>
                    <td className="p-2">{post.cta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.posts?.length > previewRows && (
            <p className="text-xs text-muted-foreground">
              {t("seoContent.showingFirst").replace("{n}", String(previewRows))}
            </p>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function BlogPostGenerator({ maxCount, country: countryProp, locale: localeProp, suggestedTopic, onConsumeSuggestion }) {
  const { t, language } = useLanguage();
  const { currentCountryCode } = useMarket();
  const country = countryProp !== undefined && countryProp !== "" ? countryProp : currentCountryCode;
  const locale = localeProp !== undefined && localeProp !== "" ? localeProp : language;
  const [keyword, setKeyword] = useState("");
  const [wordCount, setWordCount] = useState("1500");
  useEffect(() => {
    if (suggestedTopic) setKeyword(suggestedTopic);
  }, [suggestedTopic]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFullContent, setShowFullContent] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(null);
  // 블로그는 요청당 1건 생성; maxCount는 소셜/광고와 동일한 아웃풋 모드 UX 일관용

  const handleGenerate = async () => {
    onConsumeSuggestion?.();
    setError(null);
    setResult(null);
    setShowFullContent(false);
    setLoading(true);
    try {
      const { data } = await api.get("/seo/generate-blog-post", {
        params: {
          keyword: keyword || t("seoContent.defaultKeyword"),
          word_count: wordCount || "1500",
          country: country || undefined,
          locale: locale || undefined,
        },
      });
      setResult(data);
    } catch (e) {
      setError(e.message || t("seoContent.blogError"));
    } finally {
      setLoading(false);
    }
  };

  const fullText = result?.content ? stripHtml(result.content) : "";
  const safePreview = fullText.slice(0, 1200) + (fullText.length > 1200 ? "…" : "");
  const displayContent = showFullContent ? fullText : safePreview;

  const copyToClipboard = async (text, kind) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(kind);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (_) {
      setCopyFeedback("error");
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

  const downloadMarkdown = () => {
    if (!result) return;
    const md = `# ${result.title}\n\n${result.meta_description}\n\n---\n\n${fullText}`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(result.title || "blog").replace(/[^\w\s-]/g, "").slice(0, 40)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SectionCard title={t("seoContent.blogTitle")}>
      <p className="text-sm text-muted-foreground mb-4">
        {t("seoContent.blogSteps")}
      </p>

      <div className="mb-6">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("seoContent.inputLabel")}</h4>
        <p className="text-sm text-muted-foreground mb-1">{t("seoContent.blogInputHint")}</p>
        <p className="text-xs text-muted-foreground mb-3">{t("seoContent.blogOnePerRequest")}</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("seoContent.targetKeyword")}</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder={t("seoContent.keywordPlaceholder")}
              className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="min-w-[100px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("seoContent.targetWordCount")}</label>
            <input
              type="number"
              value={wordCount}
              onChange={(e) => setWordCount(e.target.value)}
              min={500}
              max={5000}
              step={500}
              className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? t("seoContent.generating") : t("seoContent.generateBlog")}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      {result && (
        <div className="rounded-lg border border-border bg-muted/20 p-5 space-y-5 text-sm">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("seoContent.outputLabel")}</h4>

          <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
            <button
              type="button"
              onClick={() => copyToClipboard(`${result.title}\n\n${result.meta_description}`, "titleMeta")}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <Copy className="w-3.5 h-3.5" />
              {copyFeedback === "titleMeta" ? t("seoContent.copied") : t("seoContent.copyTitleMeta")}
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(fullText, "content")}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <Copy className="w-3.5 h-3.5" />
              {copyFeedback === "content" ? t("seoContent.copied") : t("seoContent.copyContent")}
            </button>
            <button
              type="button"
              onClick={downloadMarkdown}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <Download className="w-3.5 h-3.5" />
              {t("seoContent.downloadMd")}
            </button>
          </div>

          <div className="border-b border-border pb-3">
            <h3 className="text-lg font-bold text-foreground">{result.title}</h3>
            <p className="text-muted-foreground mt-1">{result.meta_description}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {t("seoContent.wordCount")}: {result.word_count} · {t("seoContent.publishDate")}: {result.publish_date}
            </p>
          </div>

          {result.outline?.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-pillar3" />
                {t("seoContent.outline")}
              </h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {result.outline.map((o, i) => (
                  <li key={i}>
                    <span className="text-foreground">{o.heading}</span> — {o.summary}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h4 className="font-semibold text-foreground">{t("seoContent.contentPreview")}</h4>
              {fullText.length > 1200 && (
                <button
                  type="button"
                  onClick={() => setShowFullContent((v) => !v)}
                  className="text-xs text-primary hover:underline"
                >
                  {showFullContent ? t("seoContent.showLess") : t("seoContent.fullContent")}
                </button>
              )}
            </div>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
              {displayContent}
            </div>
          </div>

          {result.images?.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-pillar3" />
                {t("seoContent.mediaFeatured")}
              </h4>
              <div className="flex flex-wrap gap-3">
                {result.images.map((img, i) => (
                  <a
                    key={i}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-border overflow-hidden w-48 h-28 bg-muted"
                  >
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {result.infographic_suggestions?.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("seoContent.dataViz")}</h4>
              <ul className="list-disc list-inside text-muted-foreground">
                {result.infographic_suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
