import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  ShoppingCart,
  FileCheck,
  Crosshair,
  Search,
  Globe,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";

const navKeys = [
  { to: "/", key: "nav.masterControl", icon: LayoutDashboard },
  { to: "/market-intel", key: "nav.marketIntel", icon: TrendingUp },
  { to: "/competitors", key: "nav.competitorTracking", icon: Crosshair },
  { to: "/seo", key: "nav.seoContent", icon: Search },
  { to: "/b2b", key: "nav.b2bTrade", icon: Building2 },
  { to: "/b2c", key: "nav.b2cCommerce", icon: ShoppingCart },
  { to: "/gov", key: "nav.govTender", icon: FileCheck },
];

export default function Layout() {
  const { t, language, setLanguage, languageCodes } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-56 border-r border-border bg-card/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h1 className="font-bold text-lg tracking-tight text-primary font-mono">
            {t("appName")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("appSubtitle")}
          </p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navKeys.map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {t(key)}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-border">
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
        <Outlet />
      </main>
    </div>
  );
}
