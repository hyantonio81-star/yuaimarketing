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
import SimulationProductsSection from "./B2C/SimulationProductsSection";
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
  const [productForOptimalPrice, setProductForOptimalPrice] = useState(null);
  const [productForPromotion, setProductForPromotion] = useState(null);
  const [productForReview, setProductForReview] = useState(null);

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
              {connections.filter(Boolean).map((c) => (c?.channel === "shopify" ? "Shopify" : c?.channel || "")).filter(Boolean).join(", ")} {t("ecommerce.connected")}
            </span>
          )}
        </div>
        {hasConnection && (
          <p className="text-xs text-muted-foreground mt-2">
            {t("ecommerce.connectedChannelBanner")} {t("ecommerce.connectedChannelUsedInSync")}
          </p>
        )}
        {!hasConnection && (
          <SectionCard className="mt-4 mb-6 border-amber-500/40 bg-amber-500/5">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">
              계정 연동을 완료하면 아래 모든 기능을 사용할 수 있습니다.
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              재고 동기화, 최적가, 프로모션, 리뷰 분석, 이탈 방지 등이 연동 채널(Shopify 등) 기준으로 동작합니다.
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
              {t("ecommerce.simulationModeNotice")}
            </p>
            <Link
              to="/b2c/ecommerce"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              <Store className="w-4 h-4" />
              이커머스 연동 설정하기
            </Link>
          </SectionCard>
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
            <span className="text-foreground">{(typeof t("b2cCommerce.pendingApprovalsCount") === "string" ? t("b2cCommerce.pendingApprovalsCount") : "승인 대기 {count}건").replace("{count}", String(pendingCount))}</span>
          </div>
        )}
      </SectionCard>

      <InventorySyncSection connectedChannels={connections} />
      <ProcessOrderSection />
      <SimulationProductsSection
        onSelectForOptimalPrice={setProductForOptimalPrice}
        onSelectForPromotion={setProductForPromotion}
        onSelectForReview={setProductForReview}
      />
      <OptimalPriceSection connectedChannels={connections} initialProduct={productForOptimalPrice} />
      <PromotionPlanSection initialProduct={productForPromotion} />
      <ReviewAnalysisSection initialProduct={productForReview} />
      <NegativeReviewSection />
      <ChurnPreventionSection />
      <RecommendationsSection />
    </div>
  );
}
