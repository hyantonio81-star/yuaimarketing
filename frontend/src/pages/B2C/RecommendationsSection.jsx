import { useState } from "react";
import { Sparkles, AlertTriangle } from "lucide-react";
import SectionCard from "../../components/SectionCard";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext.jsx";

function getError(t, e) {
  return e?.response?.data?.error ? t("b2cCommerce.errGeneric") : t("b2cCommerce.errCustomerIdRequired");
}

export default function RecommendationsSection() {
  const { t } = useLanguage();
  const [customerId, setCustomerId] = useState("");
  const [category, setCategory] = useState("electronics");
  const [context, setContext] = useState("email");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    if (!customerId.trim()) {
      setError(t("b2cCommerce.errCustomerIdRequired"));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.post("/b2c/recommendations", {
        customer: { id: customerId.trim(), favorite_category: category || undefined },
        context,
      });
      setResult(data);
    } catch (e) {
      setError(getError(t, e));
    } finally {
      setLoading(false);
    }
  };

  const list = Array.isArray(result) ? result : [];

  return (
    <SectionCard title={t("b2cCommerce.recTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">{t("b2cCommerce.recDesc")}</p>
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.customerId")}</label>
          <input
            type="text"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            placeholder={t("b2cCommerce.customerIdPlaceholder")}
            className="rounded border border-border bg-background px-3 py-2 text-sm w-32"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.favoriteCategory")}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="electronics">electronics</option>
            <option value="health">health</option>
            <option value="sports">sports</option>
            <option value="furniture">furniture</option>
            <option value="lifestyle">lifestyle</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.context")}</label>
          <select
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="rounded border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="email">email</option>
            <option value="push">push</option>
            <option value="homepage">homepage</option>
          </select>
        </div>
        <button
          onClick={run}
          disabled={loading || !customerId.trim()}
          className="flex items-center gap-2 rounded bg-pillar3 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? t("b2cCommerce.generating") : t("b2cCommerce.generateRec")}
        </button>
      </div>
      {error && (
        <p className="text-sm text-destructive mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </p>
      )}
      {list.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
          <div className="text-sm font-medium text-foreground">{t("b2cCommerce.recommendedProducts").replace("{count}", list.length)}</div>
          <ul className="space-y-2">
            {list.slice(0, 8).map((p, i) => (
              <li key={p.id || i} className="rounded border border-border bg-background/50 px-3 py-2 text-sm">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground">₩{p.price?.toLocaleString()} · {p.category}</span>
                </div>
                {p.message && <p className="text-muted-foreground text-xs mt-1">{p.message}</p>}
              </li>
            ))}
          </ul>
          {list.length > 8 && <p className="text-xs text-muted-foreground">{t("b2cCommerce.andMore").replace("{count}", list.length - 8)}</p>}
        </div>
      )}
    </SectionCard>
  );
}
