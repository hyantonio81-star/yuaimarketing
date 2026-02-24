import { useState } from "react";
import { Package, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import SectionCard from "../../components/SectionCard";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext.jsx";

function getError(t, e, fallbackKey = "b2cCommerce.errSyncFailed") {
  return e?.response?.data?.error ? t("b2cCommerce.errGeneric") : t(fallbackKey);
}

/** @param {Array<{ channel: string }>} [connectedChannels] from /b2c/connections */
export default function InventorySyncSection({ connectedChannels = [] }) {
  const { t } = useLanguage();
  const [sku, setSku] = useState("");
  const [quantityChange, setQuantityChange] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    if (!sku.trim() || quantityChange === "") return;
    setSyncing(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.post("/b2c/inventory-sync", {
        sku: sku.trim(),
        quantity_change: Number(quantityChange),
      });
      setResult(data);
    } catch (e) {
      setError(getError(t, e));
    } finally {
      setSyncing(false);
    }
  };

  const connectedNames = (connectedChannels || []).map((c) => (c.channel === "shopify" ? "Shopify" : c.channel));

  return (
    <SectionCard title={t("b2cCommerce.inventorySyncTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">{t("b2cCommerce.inventorySyncDesc")}</p>
      {connectedNames.length > 0 && (
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 text-primary" />
          {t("ecommerce.connectedChannelUsedInSync")} — {connectedNames.join(", ")}
        </p>
      )}
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.sku")}</label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder={t("b2cCommerce.skuPlaceholder")}
            className="rounded border border-border bg-background px-3 py-2 text-sm w-40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.quantityChange")}</label>
          <input
            type="number"
            value={quantityChange}
            onChange={(e) => setQuantityChange(e.target.value)}
            placeholder="e.g. -10"
            className="rounded border border-border bg-background px-3 py-2 text-sm w-28"
          />
        </div>
        <button
          onClick={run}
          disabled={syncing || !sku.trim() || quantityChange === ""}
          className="flex items-center gap-2 rounded bg-pillar3 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? t("b2cCommerce.syncing") : t("b2cCommerce.updateInventory")}
        </button>
      </div>
      {error && (
        <p className="text-sm text-destructive mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </p>
      )}
      {result && (
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <Package className="w-4 h-4 text-pillar3" />
            {t("b2cCommerce.centralStock")}: {result.central_stock} (변동 {result.quantity_change >= 0 ? "+" : ""}{result.quantity_change})
          </div>
          {result.low_stock_alert && (
            <div className="flex items-center gap-2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 px-3 py-2 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {t("b2cCommerce.lowStockAlert")} · {t("b2cCommerce.suggestedReorderFull").replace("{qty}", result.suggested_reorder_qty)}
            </div>
          )}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">{t("b2cCommerce.channelResults")}</div>
            <ul className="space-y-2">
              {result.channel_results?.map((r, i) => (
                <li key={i} className="flex justify-between items-center text-sm rounded border border-border bg-background/50 px-3 py-2">
                  <span className="font-medium flex items-center gap-2">
                    {r.channel}
                    {connectedNames.includes(r.channel) && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/15 text-primary">{t("ecommerce.connected")}</span>
                    )}
                  </span>
                  <span className="text-muted-foreground">
                    {r.action === "restock_or_hide" ? t("b2cCommerce.actionRestockOrHide") : t("b2cCommerce.allocationSafety").replace("{allocation}", r.allocation).replace("{safety}", r.safety_stock)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
