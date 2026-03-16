import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { API_BASE } from "../lib/config";

export default function Tienda() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const url = API_BASE ? `${API_BASE}/api/landing/dr-products` : "/api/landing/dr-products";
    fetch(url)
      .then((res) => res.json())
      .then((data) => setProducts(data?.products ?? []))
      .catch(() => {
        setError(true);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (p) => {
    const price = Number(p?.price);
    const cur = (p?.currency || "USD").toUpperCase();
    if (cur === "USD") return `$${price.toFixed(2)}`;
    if (cur === "DOP") return `RD$${Math.round(price)}`;
    return `${price} ${cur}`;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
          {t("tienda.title")}
        </h1>
        <p className="text-slate-400 text-center mb-8">{t("tienda.subtitle")}</p>

        {loading && (
          <p className="text-center text-slate-500 py-12">{t("products.searchPlaceholder")}</p>
        )}
        {error && (
          <p className="text-center text-amber-500 py-8">
            No se pudo cargar la tienda. Verifica que el backend esté en marcha.
          </p>
        )}
        {!loading && !error && products.length === 0 && (
          <p className="text-center text-slate-500 py-12">{t("tienda.noProducts")}</p>
        )}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <Link
                key={p.id}
                to={`/tienda/${p.slug}`}
                className="rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="aspect-[4/3] bg-slate-700 relative">
                  <img
                    src={p.image || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop"}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 rounded-md bg-emerald-600/90 px-2 py-0.5 text-xs font-medium text-white">
                    {t("tienda.localBadge")}
                  </span>
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-white line-clamp-2">{p.title}</h2>
                  <p className="text-primary font-medium mt-1">{formatPrice(p)}</p>
                  <p className="text-slate-500 text-xs mt-1">{p.origin}</p>
                  <span className="inline-block mt-2 text-slate-400 hover:text-primary text-sm">
                    {t("tienda.viewDetails")} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
