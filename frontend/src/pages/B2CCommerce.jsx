import { useLanguage } from "../context/LanguageContext.jsx";
import MultiChannelSection from "./B2C/MultiChannelSection";
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

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {t("b2cCommerce.pillarTitle")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("b2cCommerce.pillarSubtitle")}
        </p>
      </header>

      <MultiChannelSection />
      <InventorySyncSection />
      <ProcessOrderSection />
      <OptimalPriceSection />
      <PromotionPlanSection />
      <ReviewAnalysisSection />
      <NegativeReviewSection />
      <ChurnPreventionSection />
      <RecommendationsSection />
    </div>
  );
}
