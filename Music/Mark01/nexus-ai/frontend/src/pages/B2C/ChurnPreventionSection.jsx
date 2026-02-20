import { useState } from "react";
import { Users, Mail, Smartphone, AlertTriangle } from "lucide-react";
import SectionCard from "../../components/SectionCard";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext.jsx";

function getError(t, e) {
  return e?.response?.data?.error ? t("b2cCommerce.errGeneric") : t("b2cCommerce.errGeneric");
}

export default function ChurnPreventionSection() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.post("/b2c/churn-prevention-campaign", { limit: 100 });
      setResult(data);
    } catch (e) {
      setError(getError(t, e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title={t("b2cCommerce.churnTitle")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">{t("b2cCommerce.churnDesc")}</p>
      <button
        onClick={run}
        disabled={loading}
        className="flex items-center gap-2 rounded bg-pillar3 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
      >
        <Users className="w-4 h-4" />
        {loading ? t("b2cCommerce.running") : t("b2cCommerce.runChurnCampaign")}
      </button>
      {error && (
        <p className="text-sm text-destructive mt-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </p>
      )}
      {result && (
        <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-pillar3" />
              {t("b2cCommerce.atRiskCount").replace("{count}", result.at_risk_count)}
            </span>
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-pillar3" />
              {t("b2cCommerce.emailsSent").replace("{count}", result.emails_sent)}
            </span>
            <span className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-pillar3" />
              {t("b2cCommerce.smsSent").replace("{count}", result.sms_sent)}
            </span>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">{t("b2cCommerce.atRiskTop")}</div>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {result.at_risk_top?.slice(0, 20).map((r, i) => (
                <li key={i} className="flex justify-between items-center text-sm rounded border border-border bg-background/50 px-3 py-2">
                  <span className="font-medium">{r.customer_id}</span>
                  <span className="text-muted-foreground truncate max-w-[140px]">{r.email}</span>
                  <span>{t("b2cCommerce.churnProb")} {(r.churn_prob * 100).toFixed(0)}%</span>
                  <span>CLV ₩{r.clv?.toLocaleString()}</span>
                  {r.sms_sent && <span className="text-xs text-pillar3">SMS</span>}
                </li>
              ))}
            </ul>
            {result.at_risk_top?.length > 20 && (
              <p className="text-xs text-muted-foreground mt-2">{t("b2cCommerce.andMore").replace("{count}", result.at_risk_top.length - 20)}</p>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
