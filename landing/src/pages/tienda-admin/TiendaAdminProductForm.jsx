import { useState, useEffect } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import {
  fetchProductList,
  createProduct,
  updateProduct,
  getAdminToken,
  removeAdminToken,
} from "../../lib/landingAdminApi";

const defaultProduct = {
  title: "",
  slug: "",
  description: "",
  price: "",
  currency: "USD",
  image: "",
  category: "",
  origin: "Dominican Republic",
  stock_quantity: "0",
  is_visible: true,
  partner: "",
  contact_whatsapp: "",
  contact_email: "",
};

export default function TiendaAdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { onUnauth } = useOutletContext() || {};
  const isEdit = Boolean(id);
  const [form, setForm] = useState(defaultProduct);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingInitial, setLoadingInitial] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const result = await fetchProductList();
      if (result.unauthorized) {
        removeAdminToken();
        onUnauth?.();
        setLoadingInitial(false);
        return;
      }
      if (!result.ok) {
        setError(result.error || "Error al cargar");
        setLoadingInitial(false);
        return;
      }
      const product = (result.products ?? []).find((p) => p.id === id);
      if (!product) {
        setError("Producto no encontrado");
        setLoadingInitial(false);
        return;
      }
      setForm({
        title: product.title ?? "",
        slug: product.slug ?? "",
        description: product.description ?? "",
        price: String(product.price ?? ""),
        currency: product.currency ?? "USD",
        image: product.image ?? "",
        category: product.category ?? "",
        origin: product.origin ?? "Dominican Republic",
        stock_quantity: String(product.stock_quantity ?? 0),
        is_visible: product.is_visible !== false,
        partner: product.partner ?? "",
        contact_whatsapp: product.contact_whatsapp ?? "",
        contact_email: product.contact_email ?? "",
      });
      setLoadingInitial(false);
    })();
  }, [id, isEdit, onUnauth]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const buildBody = () => ({
    title: form.title.trim(),
    slug: form.slug.trim() || undefined,
    description: form.description.trim() || undefined,
    price: form.price === "" ? undefined : Number(form.price),
    currency: form.currency.trim() || "USD",
    image: form.image.trim() || undefined,
    category: form.category.trim() || undefined,
    origin: form.origin.trim() || "Dominican Republic",
    stock_quantity: form.stock_quantity === "" ? 0 : Math.max(0, Number(form.stock_quantity) || 0),
    is_visible: form.is_visible,
    partner: form.partner.trim() || undefined,
    contact_whatsapp: form.contact_whatsapp.trim() || undefined,
    contact_email: form.contact_email.trim() || undefined,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Título es obligatorio.");
      return;
    }
    const priceNum = form.price === "" ? 0 : Number(form.price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError("El precio debe ser un número mayor o igual a 0.");
      return;
    }
    const slugVal = form.slug.trim().toLowerCase();
    if (slugVal && !/^[a-z0-9_-]+$/.test(slugVal)) {
      setError("El slug solo puede tener letras minúsculas, números, guiones y guión bajo.");
      return;
    }
    setError("");
    setLoading(true);
    const body = buildBody();
    const result = isEdit ? await updateProduct(id, body) : await createProduct(body);
    setLoading(false);
    if (result.unauthorized) {
      removeAdminToken();
      onUnauth?.();
      return;
    }
    if (!result.ok) {
      setError(result.error || "Error al guardar");
      return;
    }
    navigate("/tienda-admin", { replace: true });
  };

  if (!getAdminToken()) {
    navigate("/tienda-admin", { replace: true });
    return null;
  }

  if (loadingInitial) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-slate-500">
        Cargando…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate("/tienda-admin")}
          className="text-slate-400 hover:text-white text-sm"
        >
          ← Volver a la lista
        </button>
        <h1 className="text-xl font-bold text-white">
          {isEdit ? "Editar producto" : "Nuevo producto"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        {error && (
          <p className="rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 text-sm">
            {error}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Título *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Slug (vacío = auto)</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            placeholder="ejemplo-producto"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white placeholder-slate-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Precio</label>
            <input
              type="number"
              step="any"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Moneda</label>
            <select
              value={form.currency}
              onChange={(e) => update("currency", e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white"
            >
              <option value="USD">USD</option>
              <option value="DOP">DOP</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">URL imagen</label>
          <input
            type="url"
            value={form.image}
            onChange={(e) => update("image", e.target.value)}
            placeholder="https://…"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white placeholder-slate-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Categoría</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Origen</label>
            <input
              type="text"
              value={form.origin}
              onChange={(e) => update("origin", e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">LOCAL / BOX</label>
          <p className="text-xs text-slate-500 mb-1">LOCAL = productos locales en general · BOX = Carton DR / empaque</p>
          <select
            value={form.partner === "Carton DR" ? "Carton DR" : ""}
            onChange={(e) => update("partner", e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white"
          >
            <option value="">LOCAL</option>
            <option value="Carton DR">BOX (Carton DR)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Cantidad en stock</label>
          <input
            type="number"
            min="0"
            value={form.stock_quantity}
            onChange={(e) => update("stock_quantity", e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_visible"
            checked={form.is_visible}
            onChange={(e) => update("is_visible", e.target.checked)}
            className="rounded border-slate-600 bg-slate-900 text-primary focus:ring-primary"
          />
          <label htmlFor="is_visible" className="text-sm text-slate-300">
            Visible en la tienda
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">WhatsApp (número)</label>
          <input
            type="text"
            value={form.contact_whatsapp}
            onChange={(e) => update("contact_whatsapp", e.target.value)}
            placeholder="18295551234"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white placeholder-slate-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Email contacto</label>
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => update("contact_email", e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear producto"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/tienda-admin")}
            className="rounded-lg border border-slate-600 px-6 py-2.5 text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
