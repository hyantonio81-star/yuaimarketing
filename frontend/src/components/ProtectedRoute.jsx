import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { isSupabaseConfigured } from "../lib/supabase.js";

const DEV_SKIP_LOGIN_KEY = "dev_skip_login";

/** true면 미로그인 시 로그인 화면 먼저 노출. 기본값 true(접속 시 로그인 우선). 명시적으로 false/0일 때만 비활성화 */
export function isRequireLoginEnabled() {
  const v = import.meta.env.VITE_REQUIRE_LOGIN;
  if (v === "false" || v === "0") return false;
  return true;
}

export function getDevSkipLogin() {
  if (typeof window === "undefined") return false;
  // dev_skip_login bypass는 개발 환경에서만 허용합니다.
  if (!import.meta.env.DEV) return false;
  try {
    return window.sessionStorage.getItem(DEV_SKIP_LOGIN_KEY) === "1";
  } catch {
    return false;
  }
}

export function setDevSkipLogin(value) {
  try {
    // dev_skip_login bypass는 개발 환경에서만 허용합니다.
    if (!import.meta.env.DEV) return;
    if (value) window.sessionStorage.setItem(DEV_SKIP_LOGIN_KEY, "1");
    else window.sessionStorage.removeItem(DEV_SKIP_LOGIN_KEY);
  } catch {}
}

/**
 * - VITE_REQUIRE_LOGIN=true 이면: 항상 로그인 화면을 먼저 보여줌. (Supabase 미설정 시 Login 페이지에서 "개발: 로그인 없이 진행" 가능)
 * - VITE_REQUIRE_LOGIN 미설정이고 Supabase가 없으면: 로그인 없이 통과 (기존 동작).
 * - Supabase가 있으면: 세션이 있을 때만 자식 렌더, 없으면 /login으로 리다이렉트.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const supabaseConfigured = isSupabaseConfigured;
  const requireLogin = isRequireLoginEnabled();
  const devSkip = getDevSkipLogin();

  if (supabaseConfigured) {
    // 개발 모드에서는 세션 로딩 중이거나 유저가 없더라도 리뷰를 위해 통과시킵니다.
    if (import.meta.env.DEV) {
      return children;
    }

    if (loading) {
      return (
        <div className="min-h-[40vh] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
      );
    }
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
    return children;
  }

  if (requireLogin && !devSkip) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
