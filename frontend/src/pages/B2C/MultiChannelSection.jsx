import { ShoppingCart, Store, Globe, Share2 } from "lucide-react";
import SectionCard from "../../components/SectionCard";
import { useLanguage } from "../../context/LanguageContext.jsx";

const OWN_CHANNELS = ["Shopify", "WooCommerce", "Custom Website"];
const MARKETPLACE_KR = ["쿠팡 (Coupang)", "네이버 스마트스토어", "11번가", "지마켓, 옥션"];
const MARKETPLACE_GLOBAL = ["Amazon (US, JP, EU)", "eBay", "Walmart Marketplace", "Rakuten (일본)", "Lazada (동남아)"];
const SOCIAL_COMMERCE = ["Facebook/Instagram Shop", "TikTok Shop", "Pinterest Shopping"];

export default function MultiChannelSection() {
  const { t } = useLanguage();
  return (
    <SectionCard title={t("b2cCommerce.module31Title")} className="mb-6">
      <p className="text-sm text-muted-foreground mb-4">{t("b2cCommerce.module31Desc")}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center gap-2 font-medium text-foreground mb-2">
            <Store className="w-4 h-4 text-pillar3" />
            {t("b2cCommerce.ownChannel")}
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            {OWN_CHANNELS.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center gap-2 font-medium text-foreground mb-2">
            <ShoppingCart className="w-4 h-4 text-pillar3" />
            {t("b2cCommerce.marketplaceKr")}
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            {MARKETPLACE_KR.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center gap-2 font-medium text-foreground mb-2">
            <Globe className="w-4 h-4 text-pillar3" />
            {t("b2cCommerce.marketplaceGlobal")}
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            {MARKETPLACE_GLOBAL.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center gap-2 font-medium text-foreground mb-2">
            <Share2 className="w-4 h-4 text-pillar3" />
            {t("b2cCommerce.socialCommerce")}
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            {SOCIAL_COMMERCE.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}
