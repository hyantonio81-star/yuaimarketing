import { useState } from "react";
import { MessageSquare, ThumbsUp, ThumbsDown, TrendingUp, AlertTriangle } from "lucide-react";
import SectionCard from "../../components/SectionCard";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext.jsx";

function getError(t, e) {
  return e?.response?.data?.error ? t("b2cCommerce.errGeneric") : t("b2cCommerce.errSkuRequired");
}

export default function ReviewAnalysisSection() {
  const { t } = useLanguage();
  const [reviewSku, setReviewSku] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    if (!reviewSku.trim()) {
      setError(t("b2cCommerce.errSkuRequired"));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.post("/b2c/review-analysis", { product: { sku: reviewSku.trim() } });
      setResult(data);
    } catch (e) {
      setError(getError(t, e));
    } finally {
      setLoading(false);
    }
  };

  const trend = result?.review_volume_trend;
  const sent = result?.sentiment_distribution;

  return (
    <SectionCard title={t("b2cCommerce.reviewTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">{t("b2cCommerce.reviewDesc")}</p>
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.sku")}</label>
          <input
            type="text"
            value={reviewSku}
            onChange={(e) => setReviewSku(e.target.value)}
            placeholder={t("b2cCommerce.skuPlaceholder")}
            className="rounded border border-border bg-background px-3 py-2 text-sm w-40"
          />
        </div>
        <button
          onClick={run}
          disabled={loading || !reviewSku.trim()}
          className="flex items-center gap-2 rounded bg-pillar3 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          <MessageSquare className="w-4 h-4" />
          {loading ? t("b2cCommerce.analyzing") : t("b2cCommerce.analyzeReview")}
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
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-medium text-foreground">{t("b2cCommerce.overallRating")} {result.overall_rating?.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">{t("b2cCommerce.totalReviews").replace("{count}", result.total_reviews)}</span>
            {sent && (
              <span className="text-xs text-muted-foreground">
                {t("b2cCommerce.sentiment")}: +{sent.positive} / 0{sent.neutral} / −{sent.negative}
              </span>
            )}
            {trend && (
              <span className="text-xs">
                {t("b2cCommerce.reviewVolumeTrend")}: {trend.period} {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} {trend.change_pct > 0 ? "+" : ""}{trend.change_pct}%
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <ThumbsUp className="w-4 h-4 text-green-500" />
                {t("b2cCommerce.positiveHighlights")}
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {result.positive_highlights?.map((tema, i) => (
                  <li key={i}>· {tema.description} ({tema.frequency})</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <ThumbsDown className="w-4 h-4 text-amber-500" />
                {t("b2cCommerce.improvementAreas")}
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {result.improvement_areas?.map((tema, i) => (
                  <li key={i}>· {tema.description} ({tema.frequency})</li>
                ))}
              </ul>
            </div>
          </div>
          {result.action_items?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <TrendingUp className="w-4 h-4 text-pillar3" />
                {t("b2cCommerce.actionItems")}
              </div>
              <ul className="space-y-2">
                {result.action_items.map((a, i) => (
                  <li key={i} className="rounded border border-border bg-background/50 px-3 py-2 text-sm">
                    <strong>{a.issue}</strong> ({t("b2cCommerce.severity")} {a.severity}) · {t("b2cCommerce.owner")}: {a.owner}
                    <p className="text-muted-foreground mt-1">{a.suggested_fix}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
