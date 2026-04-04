import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  ShoppingCart,
  Store,
  FileCheck,
  Video,
  BookOpen,
  Crosshair,
  Search,
  Globe,
  LogOut,
  MapPin,
  Shield,
  User,
  Link2,
  Menu,
  X,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useMarket } from "../context/MarketContext.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import { api } from "../lib/api.js";

/** 그룹별 메뉴: 인텔·리서치 / 거래 / 콘텐츠·채널 / 시스템(관리자) */
const navGroups = [
  {
    groupKey: "nav.groupIntel",
    items: [
      { to: "/", key: "nav.masterControl", icon: LayoutDashboard },
      { to: "/market-intel", key: "nav.marketIntel", icon: TrendingUp },
      { to: "/competitors", key: "nav.competitorTracking", icon: Crosshair },
    ],
  },
  {
    groupKey: "nav.groupTrade",
    items: [
      { to: "/b2b", key: "nav.b2bTrade", icon: Building2 },
      {
        to: "/b2c",
        key: "nav.b2cCommerce",
        icon: ShoppingCart,
        children: [{ to: "/b2c/ecommerce", key: "nav.ecommerce", icon: Store }],
      },
      { to: "/gov", key: "nav.govTender", icon: FileCheck },
    ],
  },
  {
    groupKey: "nav.groupContent",
    items: [
      {
        to: "/seo",
        key: "nav.seoContent",
        icon: Search,
        children: [{ to: "/seo/threads-commerce", key: "nav.threadsCommerce", icon: null }],
      },
      { to: "/shorts", key: "nav.shortsAgent", icon: Video },
      { to: "/shorts/serial", key: "nav.serialProjects", icon: BookOpen },
    ],
  },
  {
    groupKey: "nav.groupSettings",
    items: [
      { to: "/settings/account", key: "nav.settingsAccount", icon: User },
      { to: "/settings/connections", key: "nav.settingsConnections", icon: Link2 },
    ],
  },
];

const linkClass = (isActive) =>
  `flex items-center gap-3 px-3 py-2.5 lg:py-2 min-h-11 lg:min-h-0 rounded-md text-sm transition-colors touch-manipulation ${
    isActive ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
  }`;

const subLinkClass = (isActive) =>
  `flex items-center gap-3 pl-8 pr-3 py-2 lg:py-1.5 min-h-10 lg:min-h-0 rounded-md text-xs transition-colors touch-manipulation ${
    isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
  }`;

export default function Layout() {
  const { t, language, setLanguage, languageCodes } = useLanguage();
  const { user, session, signOut, isAdmin, refreshSession } = useAuth();
  const { countries, currentCountryCode, setCountry, loading: marketLoading } = useMarket();
  const [govManualMode, setGovManualMode] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    api
      .get("/gov/status")
      .then(({ data }) => setGovManualMode(data?.mode === "manual"))
      .catch(() => setGovManualMode(true));
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen bg-background flex min-w-0">
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 flex min-h-14 items-center gap-2 border-b border-border bg-card/95 px-3 py-1.5 pt-[max(0.375rem,env(safe-area-inset-top))] backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-muted touch-manipulation"
          aria-expanded={mobileNavOpen}
          aria-controls="app-sidebar"
          aria-label={t("nav.openMenu")}
        >
          <Menu className="h-6 w-6" aria-hidden />
        </button>
        <img src="/logo.png" alt="" className="h-8 w-auto object-contain shrink-0" />
        <span className="truncate text-sm font-semibold text-foreground">{t("appName")}</span>
      </header>

      {mobileNavOpen ? (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-40 bg-black/50 touch-manipulation"
          aria-label={t("nav.closeMenu")}
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,100vw-1rem)] flex-col border-r border-border bg-card shadow-xl transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-56 lg:translate-x-0 lg:bg-card/50 lg:shadow-none shrink-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2 lg:hidden">
          <span className="text-sm font-semibold text-foreground">{t("appName")}</span>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-muted touch-manipulation"
            aria-label={t("nav.closeMenu")}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="p-4 border-b border-border">
          <img
            src="/logo.png"
            alt="YuantO Future Flow"
            className="h-10 w-auto object-contain mb-2"
          />
          <h1 className="font-bold text-lg tracking-tight text-primary font-mono">
            {t("appName")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("appSubtitle")}
          </p>
        </div>
        <nav className="flex-1 p-2 overflow-y-auto space-y-4">
          {navGroups.map(({ groupKey, items }) => (
            <div key={groupKey}>
              <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t(groupKey)}
              </p>
              <ul className="space-y-0.5 mt-0.5">
                {items.map((item) => {
                  const hasChildren = item.children && item.children.length > 0;
                  const Icon = item.icon;
                  const isGov = item.to === "/gov";
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={!hasChildren}
                        className={({ isActive }) => linkClass(isActive)}
                      >
                        {Icon && <Icon className="w-4 h-4 shrink-0" />}
                        <span className="flex-1">{t(item.key)}</span>
                        {isGov && govManualMode && (
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">수동</span>
                        )}
                      </NavLink>
                      {hasChildren && (
                        <ul className="mt-0.5 space-y-0.5 border-l border-border/60 ml-3 pl-1">
                          {item.children.map((sub) => (
                            <li key={sub.to}>
                              <NavLink
                                to={sub.to}
                                className={({ isActive }) => subLinkClass(isActive)}
                              >
                                {sub.icon ? <sub.icon className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 h-3.5 shrink-0 inline-block" />}
                                {t(sub.key)}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {isAdmin && (
            <div>
              <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("nav.groupSystem")}
              </p>
              <NavLink to="/admin" className={({ isActive }) => linkClass(isActive)}>
                <Shield className="w-4 h-4 shrink-0" />
                {t("nav.admin")}
              </NavLink>
            </div>
          )}
        </nav>
        <div className="p-2 border-t border-border space-y-2 shrink-0">
          <div className="px-2 py-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{t("market.countryList")}</span>
            </div>
            {!marketLoading && countries.length > 0 ? (
              <select
                value={currentCountryCode || countries[0]?.country_code}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full mt-0.5 px-2 py-1.5 rounded text-xs bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label={t("market.selectCountry")}
              >
                {countries.map((c) => (
                  <option key={c.country_code} value={c.country_code}>
                    {c.name} ({c.country_code})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5 py-1">{t("common.loading")}</p>
            )}
          </div>
          {(user ?? session) && (
            <div className="px-2 py-1 rounded-md bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground truncate" title={user?.email ?? ""}>
                {user?.email ?? t("nav.signedIn")}
              </p>
              <button
                type="button"
                onClick={() => signOut()}
                className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-3.5 h-3.5" />
                {t("auth.signOut")}
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
            <Globe className="w-3.5 h-3.5" />
            <span>{t("common.language")}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {languageCodes.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  language === code
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 w-full overflow-x-hidden overflow-y-auto pt-[calc(3.5rem+env(safe-area-inset-top,0px))] lg:pt-0">
        <div className="mx-auto w-full max-w-[100vw] px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
