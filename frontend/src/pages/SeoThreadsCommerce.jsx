import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Link2,
  Settings,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import SectionCard from "../components/SectionCard";
import { threadsCommerceApi, getApiErrorMessage } from "../lib/api";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function SeoThreadsCommerce() {
  const { t } = useLanguage();
  const [connection, setConnection] = useState({ connected: false });
  const [settings, setSettingsState] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState({ allowed: true });
  const [runLoading, setRunLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [runError, setRunError] = useState(null);
  const [connToken, setConnToken] = useState("");
  const [connName, setConnName] = useState("");
  const [landingUrl, setLandingUrl] = useState("");
  const [infoRatio, setInfoRatio] = useState(70);
  const [priceDropThreshold, setPriceDropThreshold] = useState(15);
  const [source, setSource] = useState("both");
  const [marketplace, setMarketplace] = useState("amazon");
  const [targetCountry, setTargetCountry] = useState("KR");
  const [contentLanguage, setContentLanguage] = useState("ko");
  const [usePriceDropOnly, setUsePriceDropOnly] = useState(false);
  const [postLog, setPostLog] = useState([]);
  const [amazonAssociateTag, setAmazonAssociateTag] = useState("");
  const [aliexpressAffiliateParams, setAliexpressAffiliateParams] = useState("");
  const [temuAffiliateParams, setTemuAffiliateParams] = useState("");

  const loadConnection = () => {
    threadsCommerceApi.getConnection().then(setConnection).catch(() => setConnection({ connected: false }));
  };
  const loadSettings = () => {
    threadsCommerceApi.getSettings().then((d) => {
      setSettingsState(d?.settings ?? null);
      const s = d?.settings;
      if (s) {
        setLandingUrl(s.landingPageUrl ?? "");
        setInfoRatio(Math.round((s.infoRatio ?? 0.7) * 100));
        setPriceDropThreshold(s.priceDropThreshold ?? 15);
        setSource(s.source ?? "both");
        setMarketplace(s.marketplace ?? "amazon");
        setTargetCountry(s.targetCountry ?? "KR");
        setContentLanguage(s.contentLanguage ?? "ko");
        setAmazonAssociateTag(s.amazonAssociateTag ?? "");
        setAliexpressAffiliateParams(s.aliexpressAffiliateParams ?? "");
        setTemuAffiliateParams(s.temuAffiliateParams ?? "");
      }
    }).catch((e) => {
      setRunError(getApiErrorMessage(e, t("seoContent.threadsCommerceRunFailed")));
    });
  };
  const loadPostLog = () => {
    threadsCommerceApi.getPostLog(30).then((d) => setPostLog(d?.entries ?? [])).catch(() => setPostLog([]));
  };
  const loadRateLimit = () => {
    threadsCommerceApi.getRateLimit().then(setRateLimit).catch(() => setRateLimit({ allowed: true }));
  };

  useEffect(() => {
    loadConnection();
    loadSettings();
    loadRateLimit();
    loadPostLog();
  }, []);

  useEffect(() => {
    if (settings) {
      setLandingUrl(settings.landingPageUrl ?? "");
      setInfoRatio(Math.round((settings.infoRatio ?? 0.7) * 100));
      setPriceDropThreshold(settings.priceDropThreshold ?? 15);
      setSource(settings.source ?? "both");
      setMarketplace(settings.marketplace ?? "amazon");
      setTargetCountry(settings.targetCountry ?? "KR");
      setContentLanguage(settings.contentLanguage ?? "ko");
      setAmazonAssociateTag(settings.amazonAssociateTag ?? "");
      setAliexpressAffiliateParams(settings.aliexpressAffiliateParams ?? "");
      setTemuAffiliateParams(settings.temuAffiliateParams ?? "");
    }
  }, [settings]);

  const handleSaveSettings = () => {
    threadsCommerceApi
      .setSettings({
        landingPageUrl: landingUrl.trim() || undefined,
        infoRatio: infoRatio / 100,
        priceDropThreshold: priceDropThreshold >= 0 ? priceDropThreshold : 15,
        source: source || "both",
        marketplace: marketplace || "amazon",
        targetCountry: targetCountry || "KR",
        contentLanguage: contentLanguage || "ko",
        amazonAssociateTag: amazonAssociateTag.trim() || undefined,
        aliexpressAffiliateParams: aliexpressAffiliateParams.trim() || undefined,
        temuAffiliateParams: temuAffiliateParams.trim() || undefined,
      })
      .then(() => loadSettings());
  };

  const handleConnect = () => {
    if (!connToken.trim()) return;
    threadsCommerceApi.connect({ accessToken: connToken.trim(), displayName: connName.trim() || undefined }).then(() => {
      setConnToken("");
      setConnName("");
      loadConnection();
    });
  };

  const handleDisconnect = () => {
    threadsCommerceApi.disconnect().then(() => loadConnection());
  };

  const handleLoadProducts = () => {
    setProductsLoading(true);
    threadsCommerceApi.getProducts({ marketplace, source, limit: 10 }).then((d) => setProducts(d?.products ?? [])).catch(() => setProducts([])).finally(() => setProductsLoading(false));
  };

  const handleRun = async () => {
    setRunLoading(true);
    setRunError(null);
    setRunResult(null);
    try {
      const data = await threadsCommerceApi.run({ usePriceDropOnly, contentType: undefined });
      setRunResult(data);
      loadRateLimit();
      loadPostLog();
    } catch (e) {
      setRunError(e?.response?.data?.error || e?.apiMessage || e?.message || t("seoContent.runFailed"));
    } finally {
      setRunLoading(false);
    }
  };

  const nextAllowedAt = rateLimit.nextAllowedAt ? new Date(rateLimit.nextAllowedAt) : null;

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-7 h-7 text-primary" />
          {t("seoContent.threadsCommerceTitle")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("seoContent.threadsCommerceSubtitle")}</p>
        {!connection.connected && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{t("seoContent.threadsCommerceNotConnectedBanner")}</span>
          </div>
        )}
      </header>

      {!connection.connected && (
        <div className="mb-6 rounded-lg border border-border bg-muted/20 px-4 py-3">
          <p className="text-sm font-semibold text-foreground">{t("seoContent.threadsCommerceSetupTitle")}</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>{t("seoContent.threadsCommerceSetupStep1")}</li>
            <li>{t("seoContent.threadsCommerceSetupStep2")}</li>
            <li>{t("seoContent.threadsCommerceSetupStep3")}</li>
          </ol>
          <div className="mt-3">
            <Link
              to="/settings/connections"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {t("seoContent.threadsCommerceSetupConnectionsCta")}
            </Link>
          </div>
        </div>
      )}

      <SectionCard title={t("seoContent.threadsCommerceConnection")} className="mb-6">
        <p className="text-sm text-muted-foreground mb-3">{t("seoContent.threadsCommerceConnectionDesc")}</p>
        {connection.connected ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-primary">
              <CheckCircle className="w-4 h-4" />
              {connection.displayName || t("seoContent.threadsCommerceConnected")}
            </span>
            <button type="button" onClick={handleDisconnect} className="text-sm text-muted-foreground hover:text-destructive">
              {t("seoContent.threadsCommerceDisconnect")}
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-w-md">
            <input
              type="text"
              placeholder={t("seoContent.threadsCommerceTokenPlaceholder")}
              value={connToken}
              onChange={(e) => setConnToken(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder={t("seoContent.threadsCommerceDisplayNamePlaceholder")}
              value={connName}
              onChange={(e) => setConnName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <button type="button" onClick={handleConnect} disabled={!connToken.trim()} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {t("seoContent.threadsCommerceConnect")}
            </button>
          </div>
        )}
      </SectionCard>

      <SectionCard title={t("seoContent.threadsCommerceSettings")} className="mb-6">
        <div className="grid gap-4 max-w-2xl">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("seoContent.threadsCommerceLandingUrl")}</label>
            <input
              type="url"
              placeholder="https://linktr.ee/..."
              value={landingUrl}
              onChange={(e) => setLandingUrl(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">{t("seoContent.threadsCommerceLandingUrlHelp")}</p>
          </div>
          <div className="border-t border-border pt-4 mt-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">{t("seoContent.threadsCommerceAffiliateSection")}</p>
            <div className="grid gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t("seoContent.threadsCommerceAmazonTag")}</label>
                <input
                  type="text"
                  placeholder="yoursite-20"
                  value={amazonAssociateTag}
                  onChange={(e) => setAmazonAssociateTag(e.target.value)}
                  className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t("seoContent.threadsCommerceAliExpressParams")}</label>
                <input
                  type="text"
                  placeholder="aff_fcid=xxx"
                  value={aliexpressAffiliateParams}
                  onChange={(e) => setAliexpressAffiliateParams(e.target.value)}
                  className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t("seoContent.threadsCommerceTemuParams")}</label>
                <input
                  type="text"
                  placeholder="aff_xxx=yyy"
                  value={temuAffiliateParams}
                  onChange={(e) => setTemuAffiliateParams(e.target.value)}
                  className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("seoContent.threadsCommerceAffiliateHelp")}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("seoContent.threadsCommerceMarketplace")}</label>
            <select value={marketplace} onChange={(e) => setMarketplace(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm w-full max-w-xs">
              <option value="amazon">Amazon</option>
              <option value="shein">Shein</option>
              <option value="temu">Temu</option>
              <option value="aliexpress">AliExpress</option>
            </select>
          </div>
          {marketplace === "amazon" && (
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("seoContent.threadsCommerceSource")}</label>
            <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="both">Best Sellers + Movers & Shakers</option>
              <option value="bestsellers">Best Sellers</option>
              <option value="movers_shakers">Movers & Shakers</option>
            </select>
          </div>
          )}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("seoContent.threadsCommerceTargetCountry")}</label>
            <select value={targetCountry} onChange={(e) => setTargetCountry(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm w-full max-w-xs">
              <option value="KR">{t("seoContent.korea")} (KR)</option>
              <option value="US">United States (US)</option>
              <option value="DO">Dominicana (DO)</option>
              <option value="MX">México (MX)</option>
              <option value="BR">Brasil (BR)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("seoContent.threadsCommerceContentLanguage")}</label>
            <select value={contentLanguage} onChange={(e) => setContentLanguage(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm w-full max-w-xs">
              <option value="ko">{t("seoContent.korean")}</option>
              <option value="en">English</option>
              <option value="es-DO">Español (DO)</option>
              <option value="es-MX">Español (MX)</option>
              <option value="pt-BR">Português (BR)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("seoContent.threadsCommerceInfoRatio")}</label>
            <input
              type="range"
              min="0"
              max="100"
              value={infoRatio}
              onChange={(e) => setInfoRatio(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-muted-foreground">{infoRatio}% {t("seoContent.infoType")} ({t("seoContent.recommended")} 70%)</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("seoContent.threadsCommercePriceDrop")}</label>
            <input
              type="number"
              min="0"
              max="100"
              value={priceDropThreshold}
              onChange={(e) => setPriceDropThreshold(Number(e.target.value) || 15)}
              className="w-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <span className="text-sm text-muted-foreground ml-2">% {t("seoContent.priceDropTrigger")}</span>
          </div>
          <button type="button" onClick={handleSaveSettings} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 w-fit">
            {t("seoContent.threadsCommerceSaveSettings")}
          </button>
        </div>
      </SectionCard>

      <SectionCard title={t("seoContent.threadsCommerceProducts")} className="mb-6">
        <button type="button" onClick={handleLoadProducts} disabled={productsLoading} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 mb-3">
          {productsLoading ? t("common.loading") : t("seoContent.threadsCommerceLoadProducts")}
        </button>
        {products.length > 0 && (
          <ul className="space-y-2 text-sm">
            {products.slice(0, 10).map((p, i) => (
              <li key={p.id ?? p.asin ?? i} className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                <span className="font-medium truncate flex-1">{p.title}</span>
                {p.marketplace && <span className="text-muted-foreground text-xs">{p.marketplace}</span>}
                {p.priceDropPercent != null && <span className="text-primary text-xs">{p.priceDropPercent}% ↓</span>}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title={t("seoContent.threadsCommerceRun")} className="mb-6">
        <p className="text-sm text-muted-foreground mb-3">{t("seoContent.threadsCommerceRunDesc")}</p>
        {!rateLimit.allowed && nextAllowedAt && (
          <p className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm mb-3">
            <Clock className="w-4 h-4" />
            {t("seoContent.threadsCommerceRateLimit")} {nextAllowedAt.toLocaleTimeString()}
          </p>
        )}
        <label className="flex items-center gap-2 text-sm mb-3">
          <input type="checkbox" checked={usePriceDropOnly} onChange={(e) => setUsePriceDropOnly(e.target.checked)} className="rounded border-input" />
          {t("seoContent.threadsCommercePriceDropOnly")}
        </label>
        <button
          type="button"
          onClick={handleRun}
          disabled={runLoading || !connection.connected || !rateLimit.allowed}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          {runLoading ? t("common.loading") : t("seoContent.threadsCommerceRunButton")}
        </button>
        {runError && (
          <p className="flex items-center gap-2 text-destructive text-sm mt-3">
            <AlertTriangle className="w-4 h-4" />
            {runError}
          </p>
        )}
        {runResult && (
          <div className="mt-4 p-3 rounded-md bg-muted/50 text-sm">
            {runResult.status === "done" && (
              <>
                <p className="flex items-center gap-2 text-primary">
                  <CheckCircle className="w-4 h-4" />
                  {t("seoContent.threadsCommercePublished")}
                </p>
                {runResult.postUrl && (
                  <a href={runResult.postUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline mt-1 inline-block">
                    {t("seoContent.threadsCommerceViewPost")}
                  </a>
                )}
                {runResult.copy && <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{runResult.copy}</p>}
              </>
            )}
            {runResult.status === "rate_limited" && (
              <p className="flex items-center gap-2 text-amber-600">
                <Clock className="w-4 h-4" />
                {t("seoContent.threadsCommerceRateLimited")}
              </p>
            )}
            {runResult.status === "failed" && (
              <p className="flex items-center gap-2 text-destructive">
                <XCircle className="w-4 h-4" />
                {runResult.error}
              </p>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title={t("seoContent.threadsCommercePostLog")} className="mb-6">
        <p className="text-sm text-muted-foreground mb-3">{t("seoContent.threadsCommercePostLogDesc")}</p>
        <button type="button" onClick={loadPostLog} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted mb-3">
          {t("common.refresh")}
        </button>
        {postLog.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {postLog.slice(0, 20).map((entry) => (
              <li key={entry.postId} className="flex flex-wrap items-center gap-2 p-2 rounded-md bg-muted/30">
                <span className="text-muted-foreground">{new Date(entry.publishedAt).toLocaleString()}</span>
                {entry.marketplace && <span className="text-xs">{entry.marketplace}</span>}
                {entry.postUrl && (
                  <a href={entry.postUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    {t("seoContent.threadsCommerceViewPost")}
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        )}
      </SectionCard>
    </div>
  );
}
