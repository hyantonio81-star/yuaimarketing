import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  fetchProductList,
  deleteProduct,
  removeAdminToken,
} from "../../lib/landingAdminApi";

export default function TiendaAdminList() {
  const { onLogout } = useOutletContext() || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError("");
    const result = await fetchProductList();
    setLoading(false);
    if (result.unauthorized) {
      removeAdminToken();
      onLogout?.();
      return;
    }
    if (!result.ok) {
      setError(result.error || "Error al cargar");
      return;
    }
    setProducts(result.products ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`¿Eliminar “${title}”?`)) return;
    setDeletingId(id);
    const result = await deleteProduct(id);
    setDeletingId(null);
    if (result.unauthorized) {
      removeAdminToken();
      onLogout?.();
      return;
    }
    if (result.ok) load();
    else setError(result.error || "Error al eliminar");
  };

  const formatPrice = (p) => {
    const price = Number(p?.price);
    const cur = (p?.currency || "USD").toUpperCase();
    if (cur === "USD") return `$${price.toFixed(2)}`;
    if (cur === "DOP") return `RD$${Math.round(price)}`;
    return `${price} ${cur}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Productos Tienda</h1>
        <div className="flex items-center gap-3">
          <Link
            to="/tienda-admin/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            + Nuevo producto
          </Link>
          <button
            type="button"
            onClick={() => {
              removeAdminToken();
              onLogout?.();
              navigate("/tienda-admin", { replace: true });
            }}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 text-sm">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-slate-500 py-12 text-center">Cargando…</p>
      ) : products.length === 0 ? (
        <p className="text-slate-500 py-12 text-center">No hay productos. Añade el primero.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/50">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="p-3 text-slate-400 font-medium">Imagen</th>
                <th className="p-3 text-slate-400 font-medium">Título / Slug</th>
                <th className="p-3 text-slate-400 font-medium">Precio</th>
                <th className="p-3 text-slate-400 font-medium">Visible</th>
                <th className="p-3 text-slate-400 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-slate-700/70 hover:bg-slate-800/70">
                  <td className="p-3">
                    <img
                      src={p.image || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=80&h=60&fit=crop"}
                      alt=""
                      className="h-12 w-16 rounded object-cover"
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-white">{p.title}</div>
                    <div className="text-slate-500 text-xs">{p.slug}</div>
                  </td>
                  <td className="p-3 text-slate-300">{formatPrice(p)}</td>
                  <td className="p-3">
                    <span
                      className={
                        p.is_visible
                          ? "rounded bg-emerald-600/20 text-emerald-400 px-2 py-0.5 text-xs"
                          : "rounded bg-slate-600/30 text-slate-500 px-2 py-0.5 text-xs"
                      }
                    >
                      {p.is_visible ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/tienda-admin/edit/${p.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.title)}
                        disabled={deletingId === p.id}
                        className="text-amber-400 hover:text-amber-300 text-sm disabled:opacity-50"
                      >
                        {deletingId === p.id ? "…" : "Eliminar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
