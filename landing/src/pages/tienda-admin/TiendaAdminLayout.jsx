import { useState, useCallback } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Layout from "../../components/Layout";
import TiendaAdminLogin from "./TiendaAdminLogin";
import { getAdminToken } from "../../lib/landingAdminApi";

export default function TiendaAdminLayout() {
  const [token, setToken] = useState(getAdminToken);

  const handleLogin = useCallback(() => {
    setToken(getAdminToken());
  }, []);

  const handleLogout = useCallback(() => {
    setToken(null);
  }, []);

  return (
    <Layout>
      <div className="min-h-[60vh] bg-slate-900/30">
        {!token ? (
          <TiendaAdminLogin onLogin={handleLogin} />
        ) : (
          <Outlet context={{ onLogout: handleLogout, onUnauth: handleLogout }} />
        )}
      </div>
    </Layout>
  );
}
