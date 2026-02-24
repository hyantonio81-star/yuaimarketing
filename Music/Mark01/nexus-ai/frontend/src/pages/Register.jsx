import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { api } from "../lib/api.js";
import { Building2, Globe, User, ChevronRight, MapPin, Lock } from "lucide-react";

export default function Register() {
  const { t } = useLanguage();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [targetCountries, setTargetCountries] = useState([]);
  const [productCategories, setProductCategories] = useState("");
  const [industry, setIndustry] = useState("");
  const [companyType, setCompanyType] = useState("manufacturer");
  const [b2bEnabled, setB2bEnabled] = useState(true);
  const [b2cEnabled, setB2cEnabled] = useState(true);
  const [companyRegistrationCountry, setCompanyRegistrationCountry] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyContact, setCompanyContact] = useState("");
  const [targetMarketOther, setTargetMarketOther] = useState("");

  useEffect(() => {
    api.get("/markets/countries").then((r) => setCountries(r.data?.countries ?? [])).catch(() => setCountries([]));
  }, []);

  const toggleCountry = (code) => {
    setTargetCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const latinAmericaCodes = countries
    .filter((c) => c.region === "Latin America")
    .map((c) => c.country_code);
  const allLATAMSelected =
    latinAmericaCodes.length > 0 && latinAmericaCodes.every((code) => targetCountries.includes(code));
  const toggleLatinAmerica = () => {
    if (allLATAMSelected) {
      setTargetCountries((prev) => prev.filter((c) => !latinAmericaCodes.includes(c)));
    } else {
      setTargetCountries((prev) => [...new Set([...prev, ...latinAmericaCodes])]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUp(email, password);
      await api.post("/markets/register", {
        organization_name: organizationName,
        target_countries: targetCountries,
        product_categories: productCategories
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        industry: industry.trim(),
        company_type: companyType,
        b2b_enabled: b2bEnabled,
        b2c_enabled: b2cEnabled,
        user_email: email,
        company_registration_country: companyRegistrationCountry || undefined,
        company_address: companyAddress.trim() || undefined,
        company_contact: companyContact.trim() || undefined,
        target_market_other: targetMarketOther.trim() || undefined,
      });
      navigate("/login", { state: { message: "register_success" } });
    } catch (err) {
      setError(err?.message || t("auth.registerError"));
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = email && password?.length >= 6 && organizationName.trim();
  const hasTargetMarket = targetCountries.length > 0 || targetMarketOther.trim().length > 0;
  const canSubmit = canProceedStep1 && hasTargetMarket;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary">{t("appName")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("register.title")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("register.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Account + Organization */}
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
              <User className="w-4 h-4 text-primary" />
              <span>{t("register.account")}</span>
              <span className="text-muted-foreground">·</span>
              <Building2 className="w-4 h-4 text-primary" />
              <span>{t("register.organization")}</span>
            </div>
            <div className="grid gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                  {t("auth.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                  {t("auth.password")}
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground mt-0.5">{t("common.passwordMin")}</p>
              </div>
              <div>
                <label htmlFor="orgName" className="block text-sm font-medium text-foreground mb-1">
                  {t("register.organizationName")}
                </label>
                <input
                  id="orgName"
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>
          </section>

          {/* 등록회사의 해당국가 외 기초 정보 */}
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{t("register.companyBaseInfo")}</span>
            </div>
            <div className="grid gap-4">
              <div>
                <label htmlFor="regCountry" className="block text-sm font-medium text-foreground mb-1">
                  {t("register.registrationCountry")}
                </label>
                <select
                  id="regCountry"
                  value={companyRegistrationCountry}
                  onChange={(e) => setCompanyRegistrationCountry(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">—</option>
                  {countries.map((c) => (
                    <option key={c.country_code} value={c.country_code}>
                      {c.name} ({c.country_code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="companyAddress" className="block text-sm font-medium text-foreground mb-1">
                  {t("register.address")}
                </label>
                <input
                  id="companyAddress"
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="companyContact" className="block text-sm font-medium text-foreground mb-1">
                  {t("register.contact")}
                </label>
                <input
                  id="companyContact"
                  type="text"
                  value={companyContact}
                  onChange={(e) => setCompanyContact(e.target.value)}
                  placeholder={t("register.contactPlaceholder")}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </section>

          {/* Step 2: Target market (Master plan) */}
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Globe className="w-4 h-4 text-primary" />
              <span>{t("register.market")}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{t("register.targetCountriesHint")}</p>
            <div className="flex flex-wrap gap-2">
              {countries.map((c) => (
                <button
                  key={c.country_code}
                  type="button"
                  onClick={() => toggleCountry(c.country_code)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    targetCountries.includes(c.country_code)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {c.name} ({c.country_code})
                </button>
              ))}
              {latinAmericaCodes.length > 0 && (
                <button
                  type="button"
                  onClick={toggleLatinAmerica}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    allLATAMSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t("register.latinAmerica")}
                </button>
              )}
            </div>
            <div className="mt-4">
              <label htmlFor="targetMarketOther" className="block text-sm font-medium text-foreground mb-1">
                {t("register.other")}
              </label>
              <input
                id="targetMarketOther"
                type="text"
                value={targetMarketOther}
                onChange={(e) => setTargetMarketOther(e.target.value)}
                placeholder={t("register.otherPlaceholder")}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {!hasTargetMarket && (
              <p className="text-xs text-amber-600 mt-2">{t("register.selectOneCountry")}</p>
            )}
          </section>

          {/* Business profile */}
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="text-sm font-medium text-foreground mb-4">{t("register.businessInfo")}</div>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("register.productCategories")}
                </label>
                <input
                  type="text"
                  value={productCategories}
                  onChange={(e) => setProductCategories(e.target.value)}
                  placeholder={t("register.productCategoriesPlaceholder")}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("register.industry")}
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder={t("register.industryPlaceholder")}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("register.companyType")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {["manufacturer", "trader", "brand"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCompanyType(type)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        companyType === type
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {type === "manufacturer"
                        ? t("register.companyTypeManufacturer")
                        : type === "trader"
                          ? t("register.companyTypeTrader")
                          : t("register.companyTypeBrand")}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={b2bEnabled}
                    onChange={(e) => setB2bEnabled(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm">{t("register.b2bEnabled")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={b2cEnabled}
                    onChange={(e) => setB2cEnabled(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm">{t("register.b2cEnabled")}</span>
                </label>
              </div>
            </div>
          </section>

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? t("common.loading") : t("register.submit")}
              <ChevronRight className="w-4 h-4" />
            </button>
            <Link
              to="/login"
              className="flex items-center justify-center py-3 px-4 rounded-md border border-border text-foreground text-sm font-medium hover:bg-muted"
            >
              {t("register.haveAccount")} {t("register.goLogin")}
            </Link>
          </div>
        </form>
        <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span>
            {typeof window !== "undefined" && window.location?.protocol === "https:"
              ? t("auth.secureConnection")
              : t("auth.useHttps")}
          </span>
        </div>
      </div>
    </div>
  );
}
