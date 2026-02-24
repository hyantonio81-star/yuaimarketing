import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { Link } from "react-router-dom";
import { Store, CheckCircle, Bot, ClipboardList } from "lucide-react";
import { ecommerceApi, b2cApi } from "../lib/api.js";
import SectionCard from "../components/SectionCard";
import InventorySyncSection from "./B2C/InventorySyncSection";
import ProcessOrderSection from "./B2C/ProcessOrderSection";
import OptimalPriceSection from "./B2C/OptimalPriceSection";
import PromotionPlanSection from "./B2C/PromotionPlanSection";
import ReviewAnalysisSection from "./B2C/ReviewAnalysisSection";
import NegativeReviewSection from "./B2C/NegativeReviewSection";
import ChurnPreventionSection from "./B2C/ChurnPreventionSection";
import RecommendationsSection from "./B2C/RecommendationsSection";

export default function B2CCommerce() {
  const { t } = useLanguage();
  const [connections, setConnections] = useState([]);
  const [settings, setSettings] = useState({ ai_automation_enabled: false });
  const [pendingCount, setPendingCount] = useState(0);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    ecommerceApi
      .getConnections()
      .then((d) => setConnections(d?.connections ?? []))
      .catch(() => setConnections([]));
  }, []);

  useEffect(() => {
    b2cApi
      .getSettings()
      .then((d) => setSettings(d || { ai_automation_enabled: false }))
      .catch(() => setSettings({ ai_automation_enabled: false }))
      .finally(() => setSettingsLoading(false));
    b2cApi
      .getPendingApprovals()
      .then((d) => setPendingCount(d?.pending_count ?? 0))
      .catch(() => setPendingCount(0));
  }, []);

  const handleAiAutomationChange = (checked) => {
    setSettingsSaving(true);
    b2cApi
      .setSettings({ ai_automation_enabled: checked })
      .then((d) => setSettings(d || { ai_automation_enabled: checked }))
      .catch(() => {})
      .finally(() => setSettingsSaving(false));
  };

  const hasConnection = Array.isArray(connections) && connections.length > 0;

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {t("b2cCommerce.pillarTitle")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("b2cCommerce.pillarSubtitle")}
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <Link
            to="/b2c/ecommerce"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-muted/30 text-sm font-medium text-foreground hover:bg-muted/50"
          >
            <Store className="w-4 h-4" />
            {t("nav.ecommerce")}
          </Link>
          {hasConnection && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm">
              <CheckCircle className="w-4 h-4" />
              {connections.map((c) => (c.channel === "shopify" ? "Shopify" : c.channel)).join(", ")} {t("ecommerce.connected")}
            </span>
          )}
        </div>
        {hasConnection && (
          <p className="text-xs text-muted-foreground mt-2">
            {t("ecommerce.connectedChannelBanner")} {t("ecommerce.connectedChannelUsedInSync")}
          </p>
        )}
        {!hasConnection && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/30">
            {t("ecommerce.simulationModeNotice")}
          </p>
        )}
      </header>

      <SectionCard title={t("b2cCommerce.aiSettingsTitle")} className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">{t("b2cCommerce.aiSettingsDesc")}</p>
        {settingsLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!settings.ai_automation_enabled}
                onChange={(e) => handleAiAutomationChange(e.target.checked)}
                disabled={settingsSaving}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <Bot className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{t("b2cCommerce.aiAutomationLabel")}</span>
            </label>
            {settingsSaving && <span className="text-xs text-muted-foreground">{t("common.loading")}</span>}
            {!settings.ai_automation_enabled && (
              <span className="text-xs text-muted-foreground">{t("b2cCommerce.semiAutoHint")}</span>
            )}
          </div>
        )}
        {pendingCount > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <ClipboardList className="w-4 h-4 text-amber-500" />
            <span className="text-foreground">{t("b2cCommerce.pendingApprovalsCount").replace("{count}", String(pendingCount))}</span>
          </div>
        )}
      </SectionCard>

      <InventorySyncSection connectedChannels={connections} />
      <ProcessOrderSection />
      <OptimalPriceSection connectedChannels={connections} />
      <PromotionPlanSection />
      <ReviewAnalysisSection />
      <NegativeReviewSection />
      <ChurnPreventionSection />
      <RecommendationsSection />
    </div>
  );
}
