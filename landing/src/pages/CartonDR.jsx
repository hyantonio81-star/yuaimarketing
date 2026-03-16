import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import {
  CARTON_DR_NAME,
  CARTON_DR_EMAIL,
  CARTON_DR_WHATSAPP,
  CARTON_DR_PHONE_1,
  CARTON_DR_PHONE_2,
  SITE_NAME,
} from "../lib/config";

const CATEGORIES = [
  {
    id: "agricola",
    image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=400&fit=crop",
    titleKey: "cartonDr.catAgricola",
    descKey: "cartonDr.catAgricolaDesc",
  },
  {
    id: "alimentos",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
    titleKey: "cartonDr.catAlimentos",
    descKey: "cartonDr.catAlimentosDesc",
  },
  {
    id: "varios",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop",
    titleKey: "cartonDr.catVarios",
    descKey: "cartonDr.catVariosDesc",
  },
];

/** 사이드바 이미지 모듈: 클릭 시 해당 섹션 또는 페이지로 이동 */
const SIDEBAR_MODULES = [
  { type: "hash", id: "agricola", image: CATEGORIES[0].image, titleKey: "cartonDr.catAgricola" },
  { type: "hash", id: "alimentos", image: CATEGORIES[1].image, titleKey: "cartonDr.catAlimentos" },
  { type: "hash", id: "varios", image: CATEGORIES[2].image, titleKey: "cartonDr.catVarios" },
  {
    type: "route",
    path: "/blog",
    image: "https://images.unsplash.com/photo-1499750310107-5efef85a6065?w=400&h=250&fit=crop",
    titleKey: "cartonDr.blog",
  },
  {
    type: "route",
    path: "/tienda",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop",
    titleKey: "cartonDr.eShop",
  },
  { type: "hash", id: "about", image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=250&fit=crop", titleKey: "cartonDr.about" },
  { type: "hash", id: "faq", image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop", titleKey: "cartonDr.faq" },
  { type: "route", path: "/contact", image: "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=400&h=250&fit=crop", titleKey: "cartonDr.contact" },
];

export default function CartonDR() {
  const { t } = useLanguage();
  const whatsappUrl = `https://wa.me/${CARTON_DR_WHATSAPP}`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      {/* Top bar — 연락처 */}
      <div className="bg-slate-800 border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold text-white">{CARTON_DR_NAME}</span>
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <a href={`mailto:${CARTON_DR_EMAIL}`} className="hover:text-white transition-colors">
              {CARTON_DR_EMAIL}
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              {CARTON_DR_PHONE_1}
            </a>
            <a href={`tel:${CARTON_DR_PHONE_2.replace(/\s/g, "")}`} className="hover:text-white transition-colors">
              {CARTON_DR_PHONE_2}
            </a>
          </div>
        </div>
      </div>

      {/* Header — 로고 + 네비 */}
      <header className="border-b border-slate-700/50 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link
            to="/carton-dr"
            className="text-xl font-bold text-white hover:text-primary transition-colors shrink-0"
          >
            {CARTON_DR_NAME}
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/carton-dr#about" className="text-slate-400 hover:text-white text-sm">
              {t("cartonDr.about")}
            </Link>
            <Link to="/blog" className="text-slate-400 hover:text-white text-sm">
              {t("cartonDr.blog")}
            </Link>
            <Link to="/blog" className="text-slate-400 hover:text-white text-sm">
              {t("cartonDr.casosExito")}
            </Link>
            <Link to="/tienda" className="text-slate-400 hover:text-white text-sm">
              {t("cartonDr.eShop")}
            </Link>
            <Link to="/carton-dr#faq" className="text-slate-400 hover:text-white text-sm">
              {t("cartonDr.faq")}
            </Link>
            <Link to="/contact" className="text-slate-400 hover:text-white text-sm">
              {t("cartonDr.contact")}
            </Link>
            <LanguageSwitcher />
          </nav>
        </div>
      </header>

      {/* 레이아웃: 왼쪽 사이드바(이미지 모듈) + 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* 왼쪽 사이드바 — 이미지 모듈 네비게이션 */}
        <aside className="lg:w-56 xl:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-700/50 bg-slate-900/50 lg:sticky lg:top-[53px] lg:self-start lg:max-h-[calc(100vh-53px)] lg:overflow-y-auto">
          <nav className="flex lg:flex-col gap-0 p-2 lg:p-3 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto" aria-label={t("cartonDr.categoriesTitle")}>
            {SIDEBAR_MODULES.map((mod) => (
              mod.type === "hash" ? (
                <a
                  key={mod.id}
                  href={`#${mod.id}`}
                  className="group flex flex-col lg:flex-row items-center gap-2 shrink-0 lg:shrink-0 w-28 lg:w-full lg:rounded-xl lg:border lg:border-slate-700 lg:bg-slate-800/50 lg:overflow-hidden lg:mb-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                  aria-label={t(mod.titleKey)}
                >
                  <div className="w-20 h-14 lg:w-full lg:aspect-[16/10] bg-slate-700 overflow-hidden rounded-lg lg:rounded-none">
                    <img src={mod.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <span className="text-xs lg:text-sm font-medium text-slate-300 group-hover:text-primary px-2 pb-2 lg:py-2 lg:px-3 text-center lg:text-left">
                    {t(mod.titleKey)}
                  </span>
                </a>
              ) : (
                <Link
                  key={mod.path}
                  to={mod.path}
                  className="group flex flex-col lg:flex-row items-center gap-2 shrink-0 lg:shrink-0 w-28 lg:w-full lg:rounded-xl lg:border lg:border-slate-700 lg:bg-slate-800/50 lg:overflow-hidden lg:mb-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                  aria-label={t(mod.titleKey)}
                >
                  <div className="w-20 h-14 lg:w-full lg:aspect-[16/10] bg-slate-700 overflow-hidden rounded-lg lg:rounded-none">
                    <img src={mod.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <span className="text-xs lg:text-sm font-medium text-slate-300 group-hover:text-primary px-2 pb-2 lg:py-2 lg:px-3 text-center lg:text-left">
                    {t(mod.titleKey)}
                  </span>
                </Link>
              )
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
        {/* Hero */}
        <section className="relative bg-slate-800">
          <div className="absolute inset-0 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=600&fit=crop"
              alt=""
              className="w-full h-full object-cover opacity-40"
            />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              {t("cartonDr.heroTitle")}
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              {t("cartonDr.heroSubtitle")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
              >
                {t("cartonDr.ctaContact")}
              </a>
              <a href="#categorias" className="inline-flex items-center justify-center rounded-xl border border-slate-500 px-8 py-3.5 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors">
                {t("cartonDr.ctaCategories")}
              </a>
            </div>
          </div>
        </section>

        {/* Categorías */}
        <section id="categorias" className="max-w-6xl mx-auto px-4 py-16 scroll-mt-4">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">{t("cartonDr.categoriesTitle")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} id={cat.id} className="scroll-mt-4">
              <a
                href={`#${cat.id}`}
                className="group block rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden hover:border-primary/50 hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-[4/3] bg-slate-700 overflow-hidden">
                  <img
                    src={cat.image}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-white group-hover:text-primary transition-colors">
                    {t(cat.titleKey)}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">{t(cat.descKey)}</p>
                  <span className="inline-block mt-2 text-primary text-sm font-medium">
                    {t("cartonDr.verMas")} →
                  </span>
                </div>
              </a>
              </div>
            ))}
          </div>
        </section>

        {/* Sobre nosotros — 간단 소개 */}
        <section id="about" className="bg-slate-800/50 border-y border-slate-700/50 py-16 scroll-mt-4">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">{t("cartonDr.aboutTitle")}</h2>
            <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t("cartonDr.aboutDesc")}
            </p>
          </div>
        </section>

        {/* CTA — Cotización */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="rounded-2xl bg-slate-800 border border-slate-700 p-8 md:p-10 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">{t("cartonDr.ctaQuoteTitle")}</h3>
            <p className="text-slate-400 mb-6">{t("cartonDr.ctaQuoteDesc")}</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
            >
              {t("cartonDr.whatsapp")}
            </a>
          </div>
        </section>

        {/* FAQ placeholder */}
        <section id="faq" className="bg-slate-800/30 py-16 scroll-mt-4">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">{t("cartonDr.faqTitle")}</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              {t("cartonDr.faqDesc")}
            </p>
            <Link to="/contact" className="inline-block mt-4 text-primary hover:underline">
              {t("cartonDr.contact")}
            </Link>
          </div>
        </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-8 px-4 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400 mb-4">
            <Link to="/carton-dr#about" className="hover:text-white transition-colors">
              {t("cartonDr.about")}
            </Link>
            <Link to="/blog" className="hover:text-white transition-colors">
              {t("cartonDr.blog")}
            </Link>
            <Link to="/blog" className="hover:text-white transition-colors">
              {t("cartonDr.casosExito")}
            </Link>
            <Link to="/carton-dr#faq" className="hover:text-white transition-colors">
              {t("cartonDr.faq")}
            </Link>
            <Link to="/contact" className="hover:text-white transition-colors">
              {t("cartonDr.contact")}
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
            <a href={`mailto:${CARTON_DR_EMAIL}`} className="hover:text-primary transition-colors">
              {CARTON_DR_EMAIL}
            </a>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              {CARTON_DR_PHONE_1}
            </a>
            <a href={`tel:${CARTON_DR_PHONE_2.replace(/\s/g, "")}`} className="hover:text-primary transition-colors">
              {CARTON_DR_PHONE_2}
            </a>
          </div>
          <p className="text-center text-slate-500 text-sm mt-6">
            © {new Date().getFullYear()} {CARTON_DR_NAME} · {SITE_NAME}
          </p>
        </div>
      </footer>
    </div>
  );
}
