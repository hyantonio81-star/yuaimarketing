import { useState } from "react";
import { MessageSquare, AlertTriangle } from "lucide-react";
import SectionCard from "../../components/SectionCard";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext.jsx";

function getError(t, e) {
  return e?.response?.data?.error ? t("b2cCommerce.errGeneric") : t("b2cCommerce.errReviewTextRequired");
}

export default function NegativeReviewSection() {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [rating, setRating] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    if (!text.trim()) {
      setError(t("b2cCommerce.errReviewTextRequired"));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.post("/b2c/handle-negative-review", {
        review: {
          text: text.trim(),
          ...(rating !== "" && { rating: Number(rating) }),
        },
      });
      setResult(data);
    } catch (e) {
      setError(getError(t, e));
    } finally {
      setLoading(false);
    }
  };

  const severityLabel = result?.severity === "low" ? t("b2cCommerce.severityLow") : result?.severity === "medium" ? t("b2cCommerce.severityMedium") : result?.severity === "high" ? t("b2cCommerce.severityHigh") : "";
  const actionLabel = result?.action === "auto_posted" ? t("b2cCommerce.actionAutoPosted") : result?.action === "queued_for_approval" ? t("b2cCommerce.actionQueued") : result?.action === "escalated" ? t("b2cCommerce.actionEscalated") : "";

  return (
    <SectionCard title={t("b2cCommerce.negReviewTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">{t("b2cCommerce.negReviewDesc")}</p>
      <div className="mb-4">
        <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.reviewText")}</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("b2cCommerce.reviewTextPlaceholder")}
          rows={3}
          className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
        />
      </div>
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.ratingOptional")}</label>
          <input
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="3"
            className="rounded border border-border bg-background px-3 py-2 text-sm w-20"
          />
        </div>
        <button
          onClick={run}
          disabled={loading || !text.trim()}
          className="flex items-center gap-2 rounded bg-pillar3 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          <MessageSquare className="w-4 h-4" />
          {loading ? t("b2cCommerce.handling") : t("b2cCommerce.handleNegative")}
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
            {t("b2cCommerce.severity")}:{" "}
            <span
              className={
                result.severity === "high"
                  ? "text-destructive"
                  : result.severity === "medium"
                  ? "text-amber-500"
                  : "text-green-600 dark:text-green-400"
              }
            >
              {severityLabel}
            </span>
            <span className="text-muted-foreground text-sm"> · {actionLabel}</span>
          </div>
          <div className="text-sm">
            <div className="text-xs font-medium text-muted-foreground mb-1">{t("b2cCommerce.generatedResponse")}</div>
            <p className="rounded border border-border bg-background/50 px-3 py-2">{result.response}</p>
          </div>
          {(result.offer || result.commitment || (result.alerts_sent?.length > 0)) && (
            <ul className="text-xs text-muted-foreground space-y-1">
              {result.offer && <li>{t("b2cCommerce.offer")}: {result.offer}</li>}
              {result.commitment && <li>{t("b2cCommerce.commitment")}: {result.commitment}</li>}
              {result.alerts_sent?.length > 0 && <li>{t("b2cCommerce.alertsSent")}: {result.alerts_sent.join(", ")}</li>}
            </ul>
          )}
        </div>
      )}
    </SectionCard>
  );
}
