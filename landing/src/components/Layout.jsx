import { Link } from "react-router-dom";
import { SITE_NAME, SUPPORT_EMAIL } from "../lib/config";
import { useLanguage } from "../context/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Layout({ children, showFooter = true }) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-700/50 bg-slate-900/70 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="text-lg font-semibold text-white hover:text-primary transition-colors shrink-0">
            {SITE_NAME}
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/" className="text-slate-400 hover:text-white text-sm">{t("nav.home")}</Link>
            <Link to="/products" className="text-slate-400 hover:text-white text-sm">{t("nav.products")}</Link>
            <Link to="/tienda" className="text-slate-400 hover:text-white text-sm">{t("nav.tienda")}</Link>
            <Link to="/blog" className="text-slate-400 hover:text-white text-sm">{t("nav.blog")}</Link>
            <Link to="/carton-dr" className="text-slate-400 hover:text-white text-sm">{t("nav.cartonDr")}</Link>
            <Link to="/contact" className="text-slate-400 hover:text-white text-sm">{t("nav.contact")}</Link>
            <LanguageSwitcher />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      {showFooter && (
        <footer className="border-t border-slate-700/50 py-6 px-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm">
            <Link to="/links" className="text-slate-500 hover:text-primary transition-colors">
              {t("nav.allLinks")}
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-slate-500 hover:text-primary transition-colors">
              {SUPPORT_EMAIL}
            </a>
          </div>
          <p className="text-center text-slate-500 text-sm mt-4">
            {t("footer", { year: new Date().getFullYear(), site: SITE_NAME })}
          </p>
        </footer>
      )}
    </div>
  );
}
