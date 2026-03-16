import { ShoppingCart, Store, Globe, Share2, Users } from "lucide-react";
import SectionCard from "../../components/SectionCard";
import { useLanguage } from "../../context/LanguageContext.jsx";

const OWN_CHANNELS = ["Shopify", "WooCommerce", "Custom Website"];
const MARKETPLACE_KR = ["쿠팡 (Coupang)", "네이버 스마트스토어", "11번가", "지마켓, 옥션"];
const MARKETPLACE_GLOBAL = ["Amazon (US, JP, EU)", "eBay", "Walmart Marketplace", "Rakuten (일본)", "Lazada (동남아)"];
const SOCIAL_COMMERCE = ["Facebook/Instagram Shop", "TikTok Shop", "Pinterest Shopping", "YouTube Shopping"];

const GROUP_BUYING_KEYS = [
  "groupBuyingYouTube",
  "groupBuyingInstagram",
  "groupBuyingFacebook",
  "groupBuyingTikTok",
  "groupBuyingPinterest",
  "groupBuyingX",
  "groupBuyingLinkedIn",
  "groupBuyingKakao",
  "groupBuyingNaver",
  "groupBuyingOthers",
];

export default function MultiChannelSection() {
  const { t } = useLanguage();
  return (
    <>
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

        <div className="mt-6 p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2 font-medium text-foreground mb-2">
            <Users className="w-5 h-5 text-pillar3" />
            {t("b2cCommerce.groupBuyingTitle")}
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t("b2cCommerce.groupBuyingDesc")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {GROUP_BUYING_KEYS.map((key) => (
              <div
                key={key}
                className="flex items-start gap-2 p-3 rounded-md border border-border bg-background/80 text-sm text-foreground"
              >
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-pillar3 mt-1.5" />
                <span>{t(`b2cCommerce.${key}`)}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </>
  );
}
