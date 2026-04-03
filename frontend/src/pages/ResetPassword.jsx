import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock } from "lucide-react";
import { supabase } from "../lib/supabase.js";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase redirects with #access_token=...&type=recovery in the URL hash.
    // onAuthStateChange fires PASSWORD_RECOVERY when that token is present.
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setSessionReady(true);
    });
    // Also check if a session is already active (user clicked link in same tab)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });
    return () => subscription?.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) throw updErr;
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err?.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm border border-border rounded-lg bg-card p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-primary" aria-hidden />
          <h1 className="text-xl font-bold text-primary">YuantO Ai</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">새 비밀번호 설정</p>

        {success ? (
          <div className="p-3 rounded-md bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-sm text-center">
            비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                새 비밀번호
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
                minLength={8}
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-foreground mb-1">
                비밀번호 확인
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
                minLength={8}
              />
            </div>
            {error && (
              <p className="text-sm text-red-500" role="alert">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !sessionReady}
              className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "변경 중..." : "비밀번호 변경"}
            </button>
            {!sessionReady && (
              <p className="text-xs text-muted-foreground text-center">
                이메일 링크를 통해 접속해야 비밀번호를 변경할 수 있습니다.
              </p>
            )}
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span>보안 연결(HTTPS)로 처리됩니다.</span>
        </div>
      </div>
    </div>
  );
}
