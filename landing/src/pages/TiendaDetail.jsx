import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { API_BASE } from "../lib/config";

export default function TiendaDetail() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    const url = API_BASE ? `${API_BASE}/api/landing/dr-products/${encodeURIComponent(slug)}` : `/api/landing/dr-products/${encodeURIComponent(slug)}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setProduct)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const formatPrice = (p) => {
    if (!p) return "";
    const price = Number(p.price);
    const cur = (p.currency || "USD").toUpperCase();
    if (cur === "USD") return `$${price.toFixed(2)}`;
    if (cur === "DOP") return `RD$${Math.round(price)}`;
    return `${price} ${cur}`;
  };

  const whatsappUrl = (p) => {
    const num = (p?.contact_whatsapp || "").replace(/\D/g, "");
    const text = encodeURIComponent(`Hola, me interesa: ${p?.title}`);
    return `https://wa.me/${num || "18095551234"}?text=${text}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center text-slate-400">
          {t("go.redirecting")}
        </div>
      </Layout>
    );
  }
  if (error || !product) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-white mb-4">{t("tienda.title")}</h1>
          <p className="text-slate-400 mb-6">{t("tienda.noProducts")}</p>
          <Link to="/tienda" className="text-primary hover:underline">{t("tienda.viewDetails")}</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden">
          <div className="aspect-[4/3] sm:aspect-[2/1] bg-slate-700 relative">
            <img
              src={product.image || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=500&fit=crop"}
              alt=""
              className="w-full h-full object-cover"
            />
            <span className="absolute top-3 left-3 rounded-lg bg-emerald-600/90 px-2.5 py-1 text-xs font-medium text-white">
              {t("tienda.localBadge")}
            </span>
          </div>
          <div className="p-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider">{t("tienda.origin")}: {product.origin}</p>
            <h1 className="text-2xl font-bold text-white mt-1">{product.title}</h1>
            <p className="text-slate-400 mt-2">{product.description}</p>
            <p className="text-primary font-semibold text-lg mt-4">{formatPrice(product)}</p>
            <p className="text-slate-500 text-sm mt-1">
              {product.stock_quantity > 0 ? t("tienda.inStock") : t("tienda.outOfStock")}
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              {product.contact_whatsapp && (
                <a
                  href={whatsappUrl(product)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
                >
                  {t("tienda.whatsapp")}
                </a>
              )}
              {product.contact_email && (
                <a
                  href={`mailto:${product.contact_email}?subject=Consulta: ${encodeURIComponent(product.title)}`}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-600 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  {t("tienda.email")}
                </a>
              )}
            </div>
          </div>
        </div>
        <p className="text-center mt-8">
          <Link to="/tienda" className="text-slate-500 hover:text-primary text-sm">
            ← {t("tienda.title")}
          </Link>
        </p>
      </div>
    </Layout>
  );
}
