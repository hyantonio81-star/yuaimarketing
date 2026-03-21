import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, setAdminToken, getErrorMessage } from "../../lib/landingAdminApi";

export default function TiendaAdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(password);
    setLoading(false);
    if (result.ok) {
      setAdminToken(result.token);
      onLogin?.();
      navigate("/tienda-admin", { replace: true });
    } else {
      setError(getErrorMessage(result.error) || "Contraseña incorrecta.");
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 shadow-xl">
        <h1 className="text-xl font-bold text-white mb-1">Tienda Admin</h1>
        <p className="text-slate-400 text-sm mb-6">Operador: inicia sesión para gestionar productos.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-sm text-amber-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
