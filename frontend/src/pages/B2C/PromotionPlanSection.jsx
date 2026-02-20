import { useState } from "react";
import { Megaphone, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import SectionCard from "../../components/SectionCard";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext.jsx";

function getError(t, e) {
  return e?.response?.data?.error ? t("b2cCommerce.errGeneric") : t("b2cCommerce.errSkuRequired");
}

export default function PromotionPlanSection() {
  const { t } = useLanguage();
  const [promoSku, setPromoSku] = useState("");
  const [promoName, setPromoName] = useState("");
  const [promoBasePrice, setPromoBasePrice] = useState("");
  const [promoGoal, setPromoGoal] = useState("revenue");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    if (!promoSku.trim()) {
      setError(t("b2cCommerce.errSkuRequired"));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.post("/b2c/promotion-plan", {
        product: {
          sku: promoSku.trim(),
          ...(promoName.trim() && { name: promoName.trim() }),
          ...(promoBasePrice !== "" && { base_price: Number(promoBasePrice) }),
        },
        goal: promoGoal,
      });
      setResult(data);
    } catch (e) {
      setError(getError(t, e));
    } finally {
      setLoading(false);
    }
  };

  const rec = result?.recommendation;
  const plan = result?.execution_plan;

  return (
    <SectionCard title={t("b2cCommerce.promotionTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">{t("b2cCommerce.promotionDesc")}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.sku")}</label>
          <input
            type="text"
            value={promoSku}
            onChange={(e) => setPromoSku(e.target.value)}
            placeholder={t("b2cCommerce.skuPlaceholder")}
            className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.productName")}</label>
          <input
            type="text"
            value={promoName}
            onChange={(e) => setPromoName(e.target.value)}
            placeholder=""
            className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.basePrice")}</label>
          <input
            type="number"
            value={promoBasePrice}
            onChange={(e) => setPromoBasePrice(e.target.value)}
            placeholder="15000"
            className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.goal")}</label>
          <select
            value={promoGoal}
            onChange={(e) => setPromoGoal(e.target.value)}
            className="rounded border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="revenue">{t("b2cCommerce.goalRevenue")}</option>
            <option value="profit">{t("b2cCommerce.goalProfit")}</option>
            <option value="clearance">{t("b2cCommerce.goalClearance")}</option>
          </select>
        </div>
        <button
          onClick={run}
          disabled={loading || !promoSku.trim()}
          className="flex items-center gap-2 rounded bg-pillar3 px-4 py-2 text-sm font-medium text-black disabled:opacity-50 mt-6"
        >
          <Megaphone className="w-4 h-4" />
          {loading ? t("b2cCommerce.planning") : t("b2cCommerce.planPromotion")}
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
          <div className="font-medium text-foreground flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-pillar3" />
            {t("b2cCommerce.recommendedPromo")} ({rec?.type}: {String(rec?.value ?? rec?.bundle_discount ?? "")}%)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <div className="rounded border border-border bg-background/50 px-3 py-2">
              {t("b2cCommerce.projectedRevenue")} <strong>₩{rec?.projected_revenue?.toLocaleString()}</strong>
            </div>
            <div className="rounded border border-border bg-background/50 px-3 py-2">
              {t("b2cCommerce.projectedProfit")} <strong>₩{rec?.projected_profit?.toLocaleString()}</strong>
            </div>
            <div className="rounded border border-border bg-background/50 px-3 py-2">
              {t("b2cCommerce.projectedUnits")} <strong>{rec?.projected_units_sold}{t("b2cCommerce.units")}</strong>
            </div>
          </div>
          {plan && (
            <div className="text-sm space-y-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pillar3" />
                {t("b2cCommerce.dateRange").replace("{start}", plan.start_date).replace("{end}", plan.end_date)}
              </div>
              <p className="text-muted-foreground">{t("b2cCommerce.copy")}: {plan.messaging}</p>
              <p className="text-muted-foreground">{t("b2cCommerce.channels")}: {plan.channels?.join(", ")}</p>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-pillar3" />
                {t("b2cCommerce.budget")}: ₩{plan.budget?.toLocaleString()}
              </div>
            </div>
          )}
          <details className="text-xs text-muted-foreground">
            <summary>{t("b2cCommerce.allScenarios").replace("{count}", result.all_scenarios?.length ?? 0)}</summary>
            <ul className="mt-2 space-y-1">
              {result.all_scenarios?.map((s, i) => (
                <li key={i}>
                  {s.type} {s.value != null ? String(s.value) : `bundle ${s.bundle_discount}%`} — {t("b2cCommerce.projectedRevenue")} ₩{s.projected_revenue?.toLocaleString()}, {t("b2cCommerce.projectedProfit")} ₩{s.projected_profit?.toLocaleString()}, {s.projected_units_sold}{t("b2cCommerce.units")}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </SectionCard>
  );
}
