import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { adminApi } from "../lib/api.js";

/**
 * Admin: (1) bootstrap 허용 시(관리자 0명) 로그인 없이 진입 가능.
 * (2) 그 외에는 로그인 + isAdmin 필요. 아니면 / 로 이동.
 */
export default function AdminGuard({ children }) {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const location = useLocation();
  const [bootstrapAllowed, setBootstrapAllowed] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const supabaseConfigured =
    typeof import.meta.env.VITE_SUPABASE_URL === "string" &&
    import.meta.env.VITE_SUPABASE_URL.length > 0;

  useEffect(() => {
    if (!supabaseConfigured || (user && isAdmin)) {
      setStatusLoading(false);
      return;
    }
    adminApi.getBootstrapStatus()
      .then((s) => setBootstrapAllowed(s?.allowed === true))
      .catch(() => setBootstrapAllowed(false))
      .finally(() => setStatusLoading(false));
  }, [supabaseConfigured, user, isAdmin]);

  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!supabaseConfigured) return children;

  if (!user && !bootstrapAllowed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && !isAdmin && !bootstrapAllowed) {
    return <Navigate to="/" replace />;
  }

  return children;
}
