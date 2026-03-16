import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Store, Link2, CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import SectionCard from "../components/SectionCard";
import { ecommerceApi } from "../lib/api.js";
import MultiChannelSection from "./B2C/MultiChannelSection";

export default function Ecommerce() {
  const { t } = useLanguage();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeUrl, setStoreUrl] = useState("");
  const [storeName, setStoreName] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState(null);

  const shopifyConnected = Array.isArray(connections) && connections.some((c) => c.channel === "shopify");
  const shopifyInfo = shopifyConnected ? connections.find((c) => c.channel === "shopify") : null;

  useEffect(() => {
    ecommerceApi
      .getConnections()
      .then((d) => setConnections(d?.connections ?? []))
      .catch(() => setConnections([]))
      .finally(() => setLoading(false));
  }, []);

  const handleConnect = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setConnecting(true);
    try {
      await ecommerceApi.connectChannel({
        channel: "shopify",
        store_url: storeUrl.trim() || undefined,
        store_name: storeName.trim() || undefined,
        api_token: apiToken.trim() || undefined,
      });
      const { connections: next } = await ecommerceApi.getConnections();
      setConnections(next ?? []);
      setStoreUrl("");
      setStoreName("");
      setApiToken("");
      setMessage(t("ecommerce.connectSuccess"));
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err?.response?.data?.error ?? err?.message ?? "연동 실패");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (channel) => {
    setError(null);
    setMessage(null);
    setDisconnecting(true);
    try {
      await ecommerceApi.disconnectChannel(channel);
      const { connections: next } = await ecommerceApi.getConnections();
      setConnections(next ?? []);
      setMessage(t("ecommerce.disconnectSuccess"));
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err?.response?.data?.error ?? err?.message ?? "해제 실패");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link
          to="/b2c"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("ecommerce.backToB2c")}
        </Link>
      </div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Store className="w-7 h-7 text-pillar3" />
          {t("ecommerce.pageTitle")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("ecommerce.pageSubtitle")}
        </p>
        {!loading && !shopifyConnected && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/30">
            {t("ecommerce.simulationModeNotice")}
          </p>
        )}
      </header>

      <SectionCard title={t("ecommerce.connectTitle")} className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">{t("ecommerce.connectDesc")}</p>
        <p className="text-xs text-muted-foreground mb-4">{t("ecommerce.simulationNote")}</p>
        {message && (
          <p className="text-sm text-primary mb-3 font-medium">{message}</p>
        )}
        {error && (
          <p className="text-sm text-destructive mb-3">{error}</p>
        )}
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (
          <div className="space-y-4">
            {shopifyConnected && shopifyInfo && (
              <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border border-border bg-primary/5">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Shopify</span>
                <span className="px-2 py-0.5 rounded text-xs bg-primary/20 text-primary">
                  {t("ecommerce.connected")}
                </span>
                {(shopifyInfo.store_url || shopifyInfo.store_name) && (
                  <span className="text-sm text-muted-foreground">
                    {shopifyInfo.store_name || shopifyInfo.store_url || ""}
                  </span>
                )}
                <button
                  type="button"
                  disabled={disconnecting}
                  onClick={() => handleDisconnect("shopify")}
                  className="ml-auto text-sm text-destructive hover:underline disabled:opacity-50"
                >
                  {t("ecommerce.disconnect")}
                </button>
              </div>
            )}
            {!shopifyConnected && (
              <form onSubmit={handleConnect} className="p-4 rounded-lg border border-border bg-muted/20 space-y-3 max-w-xl">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-pillar3" />
                  {t("ecommerce.connectShopify")}
                </h4>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t("ecommerce.storeUrl")}</label>
                  <input
                    type="url"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                    placeholder={t("ecommerce.storeUrlPlaceholder")}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t("ecommerce.storeName")}</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="My Store"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Admin API Token</label>
                  <input
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder={t("ecommerce.apiTokenPlaceholder")}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  type="submit"
                  disabled={connecting}
                  className="inline-flex items-center gap-2 rounded-md bg-pillar3 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {connecting ? t("common.loading") : t("ecommerce.connect")}
                </button>
              </form>
            )}
          </div>
        )}
      </SectionCard>

      <MultiChannelSection />
    </div>
  );
}
