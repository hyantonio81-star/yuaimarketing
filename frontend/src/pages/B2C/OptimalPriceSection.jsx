import { useState } from "react";
import { Tag, TrendingUp, AlertTriangle } from "lucide-react";
import SectionCard from "../../components/SectionCard";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext.jsx";

const PRICE_CHANNELS = ["Coupang", "Naver SmartStore", "Shopify", "Amazon", "11번가"];

function getError(t, e) {
  return e?.response?.data?.error ? t("b2cCommerce.errGeneric") : t("b2cCommerce.errSkuCostMargin");
}

export default function OptimalPriceSection() {
  const { t } = useLanguage();
  const [priceSku, setPriceSku] = useState("");
  const [priceCost, setPriceCost] = useState("");
  const [priceMargin, setPriceMargin] = useState("0.3");
  const [priceCurrent, setPriceCurrent] = useState("");
  const [priceChannel, setPriceChannel] = useState("Coupang");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    const cost = Number(priceCost);
    const margin = Number(priceMargin);
    const current = Number(priceCurrent);
    if (!priceSku.trim() || Number.isNaN(cost) || Number.isNaN(margin) || Number.isNaN(current)) {
      setError(t("b2cCommerce.errSkuCostMargin"));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.post("/b2c/optimal-price", {
        product: { sku: priceSku.trim(), cost, target_margin: margin, current_price: current },
        channel: priceChannel,
      });
      setResult(data);
    } catch (e) {
      setError(getError(t, e));
    } finally {
      setLoading(false);
    }
  };

  const factors = result?.factors;

  return (
    <SectionCard title={t("b2cCommerce.optimalPriceTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">{t("b2cCommerce.optimalPriceDesc")}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.sku")}</label>
          <input
            type="text"
            value={priceSku}
            onChange={(e) => setPriceSku(e.target.value)}
            placeholder={t("b2cCommerce.skuPlaceholder")}
            className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.cost")}</label>
          <input
            type="number"
            value={priceCost}
            onChange={(e) => setPriceCost(e.target.value)}
            placeholder="10000"
            className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.targetMargin")}</label>
          <input
            type="number"
            step="0.01"
            value={priceMargin}
            onChange={(e) => setPriceMargin(e.target.value)}
            placeholder="0.3"
            className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.currentPrice")}</label>
          <input
            type="number"
            value={priceCurrent}
            onChange={(e) => setPriceCurrent(e.target.value)}
            placeholder="15000"
            className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.channel")}</label>
          <select
            value={priceChannel}
            onChange={(e) => setPriceChannel(e.target.value)}
            className="rounded border border-border bg-background px-3 py-2 text-sm"
          >
            {PRICE_CHANNELS.map((ch) => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>
        </div>
        <button
          onClick={run}
          disabled={loading || !priceSku.trim() || !priceCost || !priceCurrent}
          className="flex items-center gap-2 rounded bg-pillar3 px-4 py-2 text-sm font-medium text-black disabled:opacity-50 mt-6"
        >
          <Tag className="w-4 h-4" />
          {loading ? t("b2cCommerce.calculating") : t("b2cCommerce.calculatePrice")}
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
          <div className="flex items-center gap-2 font-medium text-foreground">
            <TrendingUp className="w-4 h-4 text-pillar3" />
            {t("b2cCommerce.recommendedPrice")}: ₩{result.recommended_price?.toLocaleString()}
            {result.price_updated && (
              <span className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">{t("b2cCommerce.priceUpdatedHint")}</span>
            )}
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <li className="rounded border border-border bg-background/50 px-3 py-2">
              {t("b2cCommerce.expectedSales")}: <strong>{result.expected_sales}</strong>
            </li>
            <li className="rounded border border-border bg-background/50 px-3 py-2">
              {t("b2cCommerce.expectedRevenue")}: <strong>₩{result.expected_revenue?.toLocaleString()}</strong>
            </li>
            <li className="rounded border border-border bg-background/50 px-3 py-2">
              {t("b2cCommerce.expectedProfit")}: <strong>₩{result.expected_profit?.toLocaleString()}</strong>
            </li>
          </ul>
          {factors && (
            <div className="text-xs text-muted-foreground pt-2 border-t border-border">
              {t("b2cCommerce.factorsFooter")
                .replace("{avg}", factors.avg_competitor_price?.toLocaleString() ?? "")
                .replace("{ratio}", factors.inventory_ratio ?? "")
                .replace("{min}", factors.min_price?.toLocaleString() ?? "")
                .replace("{max}", factors.max_price?.toLocaleString() ?? "")
                .replace("{season}", factors.time_factors?.season ?? "")
                .replace("{days}", factors.time_factors?.days_to_event ?? "")}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
