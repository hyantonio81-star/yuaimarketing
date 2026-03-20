import { Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowRight, BarChart3, ShoppingBag, FileText, Globe2, Users, Handshake } from "lucide-react";
import { SOCIAL_STATS } from "../lib/config";
import { useLanguage } from "../context/LanguageContext";

export default function Landing() {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = t("landing.pageTitle");
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", t("landing.metaDescription"));
    // 픽셀/GA4: 랜딩 뷰 이벤트 발송
    if (window.fbq) window.fbq('track', 'PageView');
    if (window.gtag) window.gtag('event', 'page_view', { page_title: t("landing.pageTitle") });
  }, [t]);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
        <header className="text-center mb-10 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            YUAI Marketop
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mt-3">
            {t("landing.heroTitle")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("landing.heroSubtitle")}
          </p>
        </header>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 md:mb-16">
          <Link
            to="/links"
            className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] [touch-action:manipulation]"
          >
            {t("landing.viewAllLinks")}
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/links#shopping"
            className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-card px-6 py-3.5 text-base font-semibold text-foreground hover:border-primary hover:bg-primary/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] [touch-action:manipulation]"
          >
            {t("landing.startShopping")}
          </Link>
        </div>

        {/* Social Proof: 신뢰 수치 — 브랜드 가치 강조 */}
        <section className="grid grid-cols-3 gap-4 mb-12 md:mb-16 border-y border-border py-8 px-2 bg-muted/5 rounded-2xl" aria-label={t("landing.globalCoverage")}>
          <div className="text-center">
            <div className="flex justify-center mb-2 text-primary">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tabular-nums">
              {SOCIAL_STATS.users}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">
              {t("landing.activeUsers")}
            </p>
          </div>
          <div className="text-center border-x border-border">
            <div className="flex justify-center mb-2 text-primary">
              <Handshake className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tabular-nums">
              {SOCIAL_STATS.partners}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">
              {t("landing.partners")}
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2 text-primary">
              <Globe2 className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tabular-nums">
              {SOCIAL_STATS.globalReach}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">
              {t("landing.globalCoverage")}
            </p>
          </div>
        </section>

        {/* Bento grid: 서비스 요약 — 모바일에서 단일 열, 터치 영역 확보 */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 mb-12 md:mb-16" aria-label={t("landing.heroTitle")}>
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 md:p-6 flex flex-col justify-center md:col-span-2 md:row-span-2 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] min-h-[120px] sm:min-h-0">
            <div className="inline-flex p-2 rounded-lg bg-pillar1/15 text-pillar1 mb-3 w-fit mx-auto md:mx-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground text-center md:text-left">{t("landing.marketIntel")}</h3>
            <p className="text-sm text-muted-foreground mt-1 text-center md:text-left">{t("landing.marketIntelDesc")}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 flex flex-col justify-center transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] min-h-[100px] sm:min-h-0">
            <div className="inline-flex p-2 rounded-lg bg-pillar3/15 text-pillar3 mb-3 w-fit">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground">{t("landing.productCuration")}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t("landing.productCurationDesc")}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 flex flex-col justify-center transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] min-h-[100px] sm:min-h-0">
            <div className="inline-flex p-2 rounded-lg bg-primary/15 text-primary mb-3 w-fit">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground">{t("landing.contentMarketing")}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t("landing.contentMarketingDesc")}</p>
          </div>
        </section>

        <footer className="pt-6 sm:pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <a href="mailto:hyantonio81@gmail.com" className="hover:text-foreground transition-colors">hyantonio81@gmail.com</a>
          {" · "}
          <Link to="/links" className="hover:text-foreground transition-colors">{t("landing.linkHub")}</Link>
        </footer>
      </div>
    </div>
  );
}
