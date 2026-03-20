import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { CARTON_DR_NAME, CARTON_DR_WHATSAPP } from "../lib/config";
import { useSeoMeta } from "../lib/seo";

const DEFAULT_IMG = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop";
const HERO_IMG = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=600&fit=crop";

const CATEGORIES = [
  { id: "agricola", image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=400&fit=crop", titleKey: "cartonDr.catAgricola", descKey: "cartonDr.catAgricolaDesc" },
  { id: "alimentos", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop", titleKey: "cartonDr.catAlimentos", descKey: "cartonDr.catAlimentosDesc" },
  { id: "varios", image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop", titleKey: "cartonDr.catVarios", descKey: "cartonDr.catVariosDesc" },
];

/** 사이드바 메뉴: 텍스트 링크만 (다른 페이지와 동일한 상담뷰 라인) */
const SIDEBAR_LINKS = [
  { to: "/carton-dr#about", labelKey: "cartonDr.about" },
  { to: "/carton-dr#categorias", labelKey: "cartonDr.categoriesTitle" },
  { to: "/carton-dr#faq", labelKey: "cartonDr.faq" },
  { to: "/tienda", labelKey: "cartonDr.eShop" },
  { to: "/blog", labelKey: "cartonDr.blog" },
  { to: "/contact", labelKey: "cartonDr.contact" },
];

export default function CartonDR() {
  const { t } = useLanguage();
  const whatsappUrl = `https://wa.me/${CARTON_DR_WHATSAPP}`;

  useSeoMeta({
    title: CARTON_DR_NAME,
    description:
      "Soluciones en empaque y carton para la industria. Cajas para agricola, alimentos y usos varios en Republica Dominicana.",
    path: "/carton-dr",
    image: HERO_IMG,
  });

  const imgProps = (alt) => ({
    alt,
    onError: (e) => { e.target.onerror = null; e.target.src = DEFAULT_IMG; },
  });

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row min-h-0 flex-1">
        {/* 왼쪽 사이드바 — 텍스트 메뉴 (다른 페이지와 동일 톤) */}
        <aside className="shrink-0 border-b lg:border-b-0 lg:border-r border-slate-700/50 bg-slate-900/30 lg:w-48 lg:sticky lg:top-0 lg:self-start lg:max-h-screen lg:overflow-y-auto">
          <nav className="p-4 lg:py-6 lg:px-4" aria-label={t("cartonDr.categoriesTitle")}>
            <p className="text-slate-500 text-xs mb-4 hidden lg:block">
              {t("cartonDr.partnerNotice")}{" "}
              <Link to="/tienda" className="text-primary hover:underline">{t("cartonDr.partnerNoticeLink")}</Link>.
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 lg:flex-col lg:gap-0">
              {SIDEBAR_LINKS.map((item) => (
                <li key={item.labelKey}>
                  <Link
                    to={item.to}
                    className="text-slate-400 hover:text-white text-sm transition-colors block py-1.5 lg:py-2"
                  >
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="flex-1 min-w-0 bg-slate-900">
          {/* Hero */}
          <section className="relative bg-slate-800">
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={HERO_IMG}
                alt="Carton DR empaque y cartón industrial"
                className="w-full h-full object-cover opacity-40"
                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMG; }}
              />
            </div>
            <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                {t("cartonDr.heroTitle")}
              </h1>
              <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto mb-6">
                {t("cartonDr.heroSubtitle")}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">
                  {t("cartonDr.ctaContact")}
                </a>
                <a href="#categorias" className="inline-flex items-center justify-center rounded-lg border border-slate-500 px-6 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700/80 transition-colors">
                  {t("cartonDr.ctaCategories")}
                </a>
              </div>
            </div>
          </section>

          {/* Categorías */}
          <section id="categorias" className="max-w-6xl mx-auto px-4 py-12 md:py-16 scroll-mt-6">
            <h2 className="text-xl font-bold text-white mb-6 text-center">{t("cartonDr.categoriesTitle")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CATEGORIES.map((cat) => (
                <div key={cat.id} id={cat.id} className="scroll-mt-6 rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden hover:border-slate-600 transition-colors">
                  <div className="aspect-[4/3] bg-slate-700 overflow-hidden">
                    <img src={cat.image} className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" {...imgProps(t(cat.titleKey))} />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white">{t(cat.titleKey)}</h3>
                    <p className="text-slate-400 text-sm mt-0.5">{t(cat.descKey)}</p>
                    <Link to="/tienda?filter=carton-dr" className="inline-block mt-2 text-primary text-sm font-medium hover:underline">
                      {t("cartonDr.viewInTienda")} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Sobre nosotros */}
          <section id="about" className="border-t border-slate-700/50 bg-slate-800/30 py-12 md:py-16 scroll-mt-6">
            <div className="max-w-3xl mx-auto px-4 text-center">
              <h2 className="text-xl font-bold text-white mb-3">{t("cartonDr.aboutTitle")}</h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">{t("cartonDr.aboutDesc")}</p>
            </div>
          </section>

          {/* CTA Cotización */}
          <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
            <div className="rounded-xl bg-slate-800 border border-slate-700 p-6 md:p-8 text-center max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-white mb-1">{t("cartonDr.ctaQuoteTitle")}</h3>
              <p className="text-slate-400 text-sm mb-4">{t("cartonDr.ctaQuoteDesc")}</p>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">
                {t("cartonDr.whatsapp")}
              </a>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="border-t border-slate-700/50 bg-slate-800/20 py-12 md:py-16 scroll-mt-6">
            <div className="max-w-2xl mx-auto px-4">
              <h2 className="text-xl font-bold text-white mb-6 text-center">{t("cartonDr.faqTitle")}</h2>
              <dl className="space-y-5">
                <div>
                  <dt className="font-semibold text-white text-sm mb-0.5">{t("cartonDr.faqQ1")}</dt>
                  <dd className="text-slate-400 text-sm leading-relaxed">{t("cartonDr.faqA1")}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-white text-sm mb-0.5">{t("cartonDr.faqQ2")}</dt>
                  <dd className="text-slate-400 text-sm leading-relaxed">{t("cartonDr.faqA2")}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-white text-sm mb-0.5">{t("cartonDr.faqQ3")}</dt>
                  <dd className="text-slate-400 text-sm leading-relaxed">{t("cartonDr.faqA3")}</dd>
                </div>
              </dl>
              <p className="text-slate-500 text-xs mt-6 text-center">
                {t("cartonDr.faqDesc")}{" "}
                <Link to="/contact" className="text-primary hover:underline">{t("cartonDr.contact")}</Link>
              </p>
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
}
