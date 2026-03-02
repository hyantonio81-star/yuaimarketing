import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, getStoredToken } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MobileChecklist from './pages/MobileChecklist';
import Admin from './pages/Admin';
import { getMe } from './api/client';

function Nav() {
  const { user, logout, isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  const canDashboard = !user?.role || ['gm', 'director', 'leader', 'staff'].includes(user.role);
  const canAdmin = user?.role === 'gm' || user?.role === 'director';
  return (
    <nav className="bg-slate-800 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2">
      <div className="flex gap-4 text-sm">
        {canDashboard && <Link to="/" className="hover:underline">공장장 대시보드</Link>}
        <Link to="/mobile" className="hover:underline">현장 체크리스트</Link>
        {canAdmin && <Link to="/admin" className="hover:underline">Organigrama / Pipeline</Link>}
      </div>
      <div className="flex items-center gap-3 text-sm">
        {user && <span className="text-slate-300">{user.name} ({user.role})</span>}
        <button type="button" onClick={logout} className="text-rose-300 hover:underline">
          로그아웃
        </button>
      </div>
    </nav>
  );
}

function AppRoutes() {
  const { isAuthenticated, user, setToken } = useAuth();
  const [checking, setChecking] = useState(!!getStoredToken() && !user);

  useEffect(() => {
    if (!checking) return;
    getMe()
      .then((me) => setToken(getStoredToken(), me))
      .catch(() => setToken(null, null))
      .finally(() => setChecking(false));
  }, [checking, setToken]);

  if (checking) {
    return (
      <div className="p-8 flex justify-center">
        <p className="text-slate-500">인증 확인 중…</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mobile"
        element={
          <ProtectedRoute>
            <MobileChecklist />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Nav />
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
