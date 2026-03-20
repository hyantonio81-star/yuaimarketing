import { NavLink, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  ShoppingCart,
  Store,
  FileCheck,
  Video,
  Crosshair,
  Search,
  Globe,
  LogOut,
  MapPin,
  Shield,
  User,
  Link2,
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
  `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
    isActive ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
  }`;

const subLinkClass = (isActive) =>
  `flex items-center gap-3 pl-8 pr-3 py-1.5 rounded-md text-xs transition-colors ${
    isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
  }`;

export default function Layout() {
  const { t, language, setLanguage, languageCodes } = useLanguage();
  const { user, session, signOut, isAdmin, refreshSession } = useAuth();
  const { countries, currentCountryCode, setCountry, loading: marketLoading } = useMarket();
  const [govManualMode, setGovManualMode] = useState(false);

  useEffect(() => {
    api
      .get("/gov/status")
      .then(({ data }) => setGovManualMode(data?.mode === "manual"))
      .catch(() => setGovManualMode(true));
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-56 border-r border-border bg-card/50 flex flex-col shrink-0">
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
      <main className="flex-1 overflow-auto">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
