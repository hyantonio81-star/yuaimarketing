import { useState } from "react";
import { Package, Tag, Megaphone, MessageSquare, Loader2 } from "lucide-react";
import SectionCard from "../../components/SectionCard";
import { b2cApi, getApiErrorMessage } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext.jsx";

/**
 * @param {Array<{ sku: string; title: string; price: number; suggested_cost: number; marketplace: string; composite_score: number; url?: string; imageUrl?: string }>} products
 * @param {(p: { sku: string; title?: string; price?: number; suggested_cost?: number }) => void} onSelectForOptimalPrice
 * @param {(p: { sku: string; title?: string; price?: number }) => void} onSelectForPromotion
 * @param {(p: { sku: string }) => void} onSelectForReview
 */
export default function SimulationProductsSection({
  onSelectForOptimalPrice,
  onSelectForPromotion,
  onSelectForReview,
}) {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await b2cApi.getSimulationProducts({ marketplace: "amazon", limit: 10 });
      setProducts(Array.isArray(data?.products) ? data.products : []);
    } catch (e) {
      setError(getApiErrorMessage(e, t("b2cCommerce.errGeneric")));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title={t("b2cCommerce.simulationProductsTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-1">{t("b2cCommerce.simulationProductsDesc")}</p>
      <p className="text-xs text-muted-foreground mb-4">({t("b2cCommerce.implementationLevelSimulation")})</p>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded bg-pillar3 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
          {loading ? t("b2cCommerce.loadingProducts") : t("b2cCommerce.loadAffiliateProducts")}
        </button>
      </div>
      {error && (
        <p className="text-sm text-destructive mb-4">{error}</p>
      )}
      {!loading && products.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">{t("b2cCommerce.noSimulationProducts")}</p>
      )}
      {products.length > 0 && (
        <ul className="space-y-3">
          {products.map((p) => (
            <li
              key={p.sku}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/20 p-3"
            >
              {p.imageUrl && (
                <img
                  src={p.imageUrl}
                  alt=""
                  className="w-12 h-12 object-cover rounded border border-border"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate" title={p.title}>{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.sku} · ₩{Number(p.price).toLocaleString()} · {p.marketplace} · score {p.composite_score}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onSelectForOptimalPrice({ sku: p.sku, title: p.title, price: p.price, suggested_cost: p.suggested_cost })}
                  className="inline-flex items-center gap-1 rounded border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <Tag className="w-3.5 h-3.5" />
                  {t("b2cCommerce.useForOptimalPrice")}
                </button>
                <button
                  type="button"
                  onClick={() => onSelectForPromotion({ sku: p.sku, title: p.title, price: p.price })}
                  className="inline-flex items-center gap-1 rounded border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  {t("b2cCommerce.useForPromotion")}
                </button>
                <button
                  type="button"
                  onClick={() => onSelectForReview({ sku: p.sku })}
                  className="inline-flex items-center gap-1 rounded border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {t("b2cCommerce.useForReview")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
