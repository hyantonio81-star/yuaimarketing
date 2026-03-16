import { useState, useEffect } from "react";
import { Shield, Users, UserPlus, AlertTriangle, Lock } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { adminApi } from "../lib/api.js";
import SectionCard from "../components/SectionCard.jsx";

export default function Admin() {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const [bootstrapStatus, setBootstrapStatus] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bootstrapEmail, setBootstrapEmail] = useState("");
  const [bootstrapPassword, setBootstrapPassword] = useState("");
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapDone, setBootstrapDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [status, usersRes] = await Promise.all([
          adminApi.getBootstrapStatus().catch(() => ({ allowed: false, reason: "error" })),
          isAdmin ? adminApi.getUsers().catch((e) => ({ users: [], _err: e })) : Promise.resolve({ users: [] }),
        ]);
        if (!cancelled) {
          setBootstrapStatus(status);
          setUsers(usersRes?.users ?? []);
          if (usersRes?._err) setError(usersRes._err?.response?.data?.message || usersRes._err?.message || "Failed to load users");
        }
      } catch (e) {
        if (!cancelled) setError(e?.message ?? "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAdmin]);

  const handleBootstrap = async (e) => {
    e.preventDefault();
    if (!bootstrapEmail.trim() || !bootstrapPassword) return;
    setBootstrapLoading(true);
    setError(null);
    try {
      await adminApi.postBootstrap(bootstrapEmail.trim(), bootstrapPassword);
      setBootstrapDone(true);
      setBootstrapStatus({ allowed: false, reason: "admin_exists" });
    } catch (e) {
      setError(e?.response?.data?.error ?? e?.message ?? "Bootstrap failed");
    } finally {
      setBootstrapLoading(false);
    }
  };

  const showBootstrap = bootstrapStatus?.allowed === true && !bootstrapDone;

  return (
    <div className="p-6 lg:p-8 min-h-[60vh]">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Shield className="w-7 h-7 text-pillar4" aria-hidden />
          {t("admin.title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("admin.subtitle")}</p>
      </header>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2" role="alert">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-auto underline">Dismiss</button>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
      ) : (
        <div className="space-y-6">
          {showBootstrap && (
            <SectionCard title={t("admin.bootstrapTitle")} className="border-amber-500/50">
              <p className="text-sm text-muted-foreground mb-4">{t("admin.bootstrapDesc")}</p>
              <form onSubmit={handleBootstrap} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t("auth.email")}</label>
                  <input
                    type="email"
                    value={bootstrapEmail}
                    onChange={(e) => setBootstrapEmail(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t("auth.password")}</label>
                  <input
                    type="password"
                    value={bootstrapPassword}
                    onChange={(e) => setBootstrapPassword(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
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
                  disabled={bootstrapLoading}
                  className="inline-flex items-center gap-2 rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {bootstrapLoading ? t("common.loading") : t("admin.createAdmin")}
                </button>
              </form>
            </SectionCard>
          )}

          {bootstrapDone && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-sm">
              {t("admin.bootstrapSuccess")}
            </div>
          )}

          {isAdmin && (
            <SectionCard title={t("admin.usersTitle")}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-lg">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left p-2 font-medium">{t("admin.email")}</th>
                      <th className="text-left p-2 font-medium">{t("admin.role")}</th>
                      <th className="text-left p-2 font-medium">{t("admin.createdAt")}</th>
                      <th className="text-left p-2 font-medium">{t("admin.lastSignIn")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(users ?? []).map((u) => (
                      <tr key={u.id} className="border-b border-border last:border-0">
                        <td className="p-2">{u.email ?? "—"}</td>
                        <td className="p-2">
                          <span className={u.role === "admin" ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}>
                            {u.role === "admin" ? "Admin" : "User"}
                          </span>
                        </td>
                        <td className="p-2 text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                        <td className="p-2 text-muted-foreground">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(!users || users.length === 0) && (
                <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t("admin.noUsers")}
                </p>
              )}
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}
