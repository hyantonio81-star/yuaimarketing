import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { API_BASE } from "../lib/config";
import { useSeoMeta } from "../lib/seo";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=500&fit=crop";

export default function TiendaDetail() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mainImage, setMainImage] = useState(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    const url = API_BASE
      ? `${API_BASE}/api/landing/dr-products/${encodeURIComponent(slug)}`
      : `/api/landing/dr-products/${encodeURIComponent(slug)}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((p) => {
        setProduct(p);
        setMainImage(p.image || (p.images && p.images[0]) || DEFAULT_IMAGE);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useSeoMeta({
    title: product ? `${product.title} | ${t("tienda.title")}` : t("tienda.title"),
    description: product ? (product.description?.slice(0, 160) || product.title) : t("tienda.subtitle"),
    path: product ? `/tienda/${product.slug || slug}` : "/tienda",
    image: product?.image || product?.images?.[0] || DEFAULT_IMAGE,
    noIndex: !product,
  });

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

  const hasContact = product?.contact_whatsapp || product?.contact_email;

  if (loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden animate-pulse">
            <div className="aspect-[4/3] sm:aspect-[2/1] bg-slate-700" />
            <div className="p-6 space-y-3">
              <div className="h-3 bg-slate-600 rounded w-1/4" />
              <div className="h-8 bg-slate-600 rounded w-3/4" />
              <div className="h-4 bg-slate-600/80 rounded w-full" />
              <div className="h-4 bg-slate-600/80 rounded w-1/3 mt-4" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-white mb-4">{t("tienda.productNotFound")}</h1>
          <p className="text-slate-400 mb-6">{t("tienda.noProductsFilter")}</p>
          <Link to="/tienda" className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90">
            {t("tienda.backToTienda")}
          </Link>
        </div>
      </Layout>
    );
  }

  const images = product.images?.length ? [product.image, ...product.images].filter(Boolean) : [product.image || DEFAULT_IMAGE];
  const showGallery = images.length > 1;

  return (
    <Layout>
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.title,
              description: product.description,
              image: product.image || (product.images && product.images[0]),
              offers: {
                "@type": "Offer",
                price: product.price,
                priceCurrency: product.currency || "USD",
                availability: product.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              },
            }),
          }}
        />
      )}
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden">
          <div className="aspect-[4/3] sm:aspect-[2/1] bg-slate-700 relative">
            <img
              src={mainImage || DEFAULT_IMAGE}
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = DEFAULT_IMAGE;
              }}
            />
            <span className="absolute top-3 left-3 rounded-lg bg-emerald-600/90 px-2.5 py-1 text-xs font-medium text-white">
              {t("tienda.localBadge")}
            </span>
            {product.partner && (
              <span className="absolute top-3 right-3 rounded-lg bg-slate-700/90 px-2.5 py-1 text-xs font-medium text-white">
                {product.partner}
              </span>
            )}
          </div>
          {showGallery && (
            <div className="flex gap-2 p-3 border-t border-slate-700/50 overflow-x-auto">
              {images.slice(0, 6).map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMainImage(src)}
                  className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                    mainImage === src ? "border-primary" : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="p-6">
            {product.category && (
              <p className="text-xs text-slate-500 uppercase tracking-wider">{t("tienda.category")}: {product.category}</p>
            )}
            <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">{t("tienda.origin")}: {product.origin}</p>
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
              {!hasContact && (
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-600 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  {t("tienda.contactFallback")}
                </Link>
              )}
            </div>
          </div>
        </div>
        <p className="text-center mt-8">
          <Link to="/tienda" className="text-slate-500 hover:text-primary text-sm">
            ← {t("tienda.backToTienda")}
          </Link>
        </p>
      </div>
    </Layout>
  );
}
