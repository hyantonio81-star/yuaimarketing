import React, { createContext, useContext, useState, useCallback } from 'react';
import { REFRESH_KEY, apiLogout } from '../api/client';

const TOKEN_KEY = 'factory_kpi_token';
const USER_KEY = 'factory_kpi_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem(USER_KEY);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const setToken = useCallback((newToken, newUser) => {
    setTokenState(newToken);
    setUser(newUser ?? null);
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
      if (newUser) localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      try { localStorage.removeItem(REFRESH_KEY); } catch (_) {}
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setToken(null, null);
  }, [setToken]);

  const value = { token, user, setToken, logout, isAuthenticated: !!token };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}
