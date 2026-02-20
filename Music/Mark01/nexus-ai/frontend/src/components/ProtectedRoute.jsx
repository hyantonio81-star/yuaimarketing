import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Supabase가 없으면 로그인 없이 통과 (로컬 개발).
 * Supabase가 있으면 세션이 있을 때만 자식 렌더, 없으면 /login으로 리다이렉트.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const supabaseConfigured =
    typeof import.meta.env.VITE_SUPABASE_URL === "string" &&
    import.meta.env.VITE_SUPABASE_URL.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (supabaseConfigured && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
