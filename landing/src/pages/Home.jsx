import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import MarketPulse from "../components/MarketPulse";
import { useLanguage } from "../context/LanguageContext";
import { API_BASE, SITE_NAME, SOCIAL_STATS } from "../lib/config";
import { POPULAR_PRODUCTS } from "../lib/constants";
import { useSeoMeta } from "../lib/seo";

const DEFAULT_IMG = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop";

const TREND_MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
const TREND_VALUES = [62, 78, 85, 72, 88, 94];
const maxVal = Math.max(...TREND_VALUES);

const services = [
  { titleKey: "home.service1Title", descKey: "home.service1Desc", to: "/blog" },
  { titleKey: "home.service2Title", descKey: "home.service2Desc", to: "/products" },
  { titleKey: "home.service3Title", descKey: "home.service3Desc", to: "/links#sns" },
];

export default function Home() {
  const { t } = useLanguage();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSent, setNewsletterSent] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterError, setNewsletterError] = useState(null);

  useSeoMeta({
    title: SITE_NAME,
    description: t("home.subline"),
    path: "/",
  });

  const handleNewsletter = async (e) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) return;
    setNewsletterLoading(true);
    setNewsletterError(null);
    try {
      const url = API_BASE ? `${API_BASE}/api/landing/newsletter` : "/api/landing/newsletter";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "landing-home" }),
      });
      if (!res.ok) throw new Error("newsletter_failed");
      setNewsletterSent(true);
      setNewsletterEmail("");
    } catch {
      setNewsletterError(t("contact.errorGeneric"));
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <Layout>
      {/* Hero — Editorial typography, large type */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16 md:pt-28 md:pb-24 text-center">
        <h1 className="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6">
          {t("home.headline")}
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ letterSpacing: "0.01em" }}>
          {t("home.subline")}
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-10">
          <Link
            to="/products"
            className="btn-micro inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3.5 text-sm font-medium text-white hover:opacity-90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/20"
          >
            {t("home.ctaShop")}
          </Link>
          <Link
            to="/blog"
            className="btn-micro inline-flex items-center justify-center rounded-xl border border-slate-600 px-8 py-3.5 text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:border-slate-500 transition-all duration-200"
          >
            {t("nav.blog")}
          </Link>
        </div>
      </section>

      {/* Social proof — glass strip */}
      <section className="border-y border-slate-700/50 bg-slate-800/20 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary tabular-nums">
                {SOCIAL_STATS.users}
              </p>
              <p className="text-slate-400 text-sm mt-1 tracking-wide">{t("home.socialProof1")}</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary tabular-nums">
                {SOCIAL_STATS.partners}
              </p>
              <p className="text-slate-400 text-sm mt-1 tracking-wide">{t("home.socialProof2")}</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary tabular-nums">
                {SOCIAL_STATS.globalReach}
              </p>
              <p className="text-slate-400 text-sm mt-1 tracking-wide">{t("home.socialProof3")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid: Live Market Pulse + Trend + Services */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="section-title mb-10 text-center">{t("home.sectionServices")}</h2>
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 bento-grid"
          style={{ gridAutoRows: "minmax(180px, auto)" }}
        >
          {/* Cell 1: Market Pulse — 1 col */}
          <div className="md:row-span-2 bento-cell bento-cell-featured">
            <MarketPulse />
          </div>
          {/* Cell 2–3: Trend chart — span 2 cols */}
          <div className="md:col-span-2 glass-panel rounded-2xl p-6 flex flex-col justify-end min-h-[200px] bento-cell ring-1 ring-slate-700/50 hover:ring-primary/30 transition-shadow duration-300">
            <p className="text-slate-500 text-sm mb-3">{t("home.trendTitle")}</p>
            <div className="flex items-end justify-between gap-2 h-28">
              {TREND_VALUES.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-primary/70 hover:bg-primary transition-all duration-300 min-h-[4px]"
                    style={{ height: `${(val / maxVal) * 100}%` }}
                    title={`${TREND_MONTHS[i]}: ${val}`}
                  />
                  <span className="text-xs text-slate-500">{TREND_MONTHS[i]}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Services: 3 cards in a row (each 1 col on md) */}
          {services.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="card-float glass-panel rounded-2xl p-6 flex flex-col justify-center min-h-[140px] md:min-h-[120px] bento-cell"
            >
              <h3 className="font-semibold text-white mb-1">{t(item.titleKey)}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{t(item.descKey)}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products — card float + image hover */}
      <section className="max-w-5xl mx-auto px-4 py-14 border-t border-slate-700/50">
        <h2 className="section-title mb-10 text-center">{t("home.popularProducts")}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {POPULAR_PRODUCTS.map((p) => (
            <Link
              key={p.id}
              to={`/p/${p.slug}`}
              className="card-float glass-panel rounded-2xl overflow-hidden group"
            >
              <div className="img-hover-wrap relative aspect-square bg-slate-700">
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMG; }}
                />
              </div>
              <div className="p-4">
                <p className="text-white font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {p.title}
                </p>
                <p className="text-primary text-sm mt-1 font-medium">{p.price}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            to="/products"
            className="text-primary font-medium hover:underline text-sm inline-flex items-center gap-1"
          >
            {t("home.viewAllProducts")} →
          </Link>
        </div>
      </section>

      {/* Newsletter — glass CTA */}
      <section className="max-w-5xl mx-auto px-4 py-14 border-t border-slate-700/50">
        <div className="glass-panel rounded-2xl p-8 md:p-10 text-center">
          <h3 className="section-title mb-1">{t("home.newsletterTitle")}</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">{t("home.newsletterDesc")}</p>
          {newsletterSent ? (
            <p className="text-primary font-medium">{t("home.newsletterSuccess")}</p>
          ) : (
            <form
              onSubmit={handleNewsletter}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder={t("home.newsletterPlaceholder")}
                className="flex-1 rounded-xl border border-slate-600 bg-slate-900/80 px-4 py-3 text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                required
              />
              <button
                type="submit"
                disabled={newsletterLoading}
                className="btn-micro rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                {newsletterLoading ? "..." : t("home.newsletterSubmit")}
              </button>
            </form>
          )}
          {newsletterError && (
            <p className="text-amber-400 text-sm mt-3">{newsletterError}</p>
          )}
        </div>
      </section>

      {/* Tienda local CTA */}
      <section className="max-w-5xl mx-auto px-4 py-12 border-t border-slate-700/50">
        <div className="glass-panel rounded-2xl p-6 text-center">
          <h3 className="text-lg font-semibold text-white mb-1">{t("home.tiendaTitle")}</h3>
          <p className="text-slate-400 text-sm mb-4">{t("tienda.subtitle")}</p>
          <Link
            to="/tienda"
            className="btn-micro inline-flex items-center justify-center rounded-xl bg-emerald-600/90 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            {t("home.tiendaCta")}
          </Link>
        </div>
      </section>

      {/* Bio hub CTA */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="glass-panel rounded-2xl p-6 text-center">
          <p className="text-slate-400 mb-4">{t("home.hubLine")}</p>
          <Link
            to="/links"
            className="text-primary font-medium hover:underline inline-flex items-center gap-1"
          >
            {t("home.hubCta")}
          </Link>
        </div>
      </section>
    </Layout>
  );
}