import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Lock, UserPlus, AlertTriangle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { adminApi } from "../lib/api.js";

/**
 * 최초 운영자 등록 전용 페이지. 로그인 없이 접근 가능.
 * GET /api/admin/bootstrap-status 가 allowed=true 일 때만 폼 표시.
 * 운영자 생성 후 로그인 페이지로 이동.
 */
export default function Setup() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getBootstrapStatus()
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus({ allowed: false, reason: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError("");
    setSubmitLoading(true);
    try {
      await adminApi.postBootstrap(email.trim(), password);
      setDone(true);
      setTimeout(() => navigate("/login", { state: { message: "setup_success" }, replace: true }), 2000);
    } catch (e) {
      setError(e?.response?.data?.error ?? e?.message ?? "Bootstrap failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (status && !status.allowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm border border-border rounded-lg bg-card p-6 shadow-lg text-center">
          <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-4" aria-hidden />
          <h1 className="text-lg font-semibold text-foreground mb-2">{t("setup.notAllowedTitle")}</h1>
          <p className="text-sm text-muted-foreground mb-6">{t("setup.notAllowedDesc")}</p>
          <Link to="/login" className="inline-block py-2 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90">
            {t("auth.signIn")}
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm border border-border rounded-lg bg-card p-6 shadow-lg text-center">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">{t("admin.bootstrapSuccess")}</h1>
          <p className="text-sm text-muted-foreground">{t("setup.redirectToLogin")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm border border-border rounded-lg bg-card p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-primary" aria-hidden />
          <h1 className="text-xl font-bold text-primary">{t("setup.title")}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{t("setup.subtitle")}</p>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2" role="alert">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="setup-email" className="block text-sm font-medium text-foreground mb-1">
              {t("auth.email")}
            </label>
            <input
              id="setup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="setup-password" className="block text-sm font-medium text-foreground mb-1">
              {t("auth.password")}
            </label>
            <input
              id="setup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground mt-1">{t("admin.passwordMin")}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-4 h-4 shrink-0" aria-hidden />
            <span>{t("admin.bootstrapOnce")}</span>
          </div>
          <button
            type="submit"
            disabled={submitLoading}
            className="w-full py-2 px-4 rounded-md bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {submitLoading ? t("common.loading") : t("admin.createAdmin")}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/login" className="text-primary hover:underline">
            {t("setup.goLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
