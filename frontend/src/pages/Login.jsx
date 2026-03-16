import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Shield, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function Login() {
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || t("auth.error"));
    } finally {
      setLoading(false);
    }
  }

  const isSecure = typeof window !== "undefined" && window.location?.protocol === "https:";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm border border-border rounded-lg bg-card p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-primary" aria-hidden />
          <h1 className="text-xl font-bold text-primary">{t("appName")}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{t("auth.signInTitle")}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? t("common.loading") : t("auth.signIn")}
          </button>
          <p className="text-center text-sm text-muted-foreground mt-4">
            <Link to="/register" className="text-primary hover:underline">
              {t("auth.signUp")}
            </Link>
          </p>
        </form>
        <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span>
            {isSecure ? t("auth.secureConnection") : t("auth.useHttps")}
          </span>
        </div>
      </div>
    </div>
  );
}
