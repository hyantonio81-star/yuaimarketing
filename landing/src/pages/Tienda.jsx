import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import TiendaSkeleton from "../components/TiendaSkeleton";
import { useLanguage } from "../context/LanguageContext";
import { API_BASE } from "../lib/config";
import { useSeoMeta } from "../lib/seo";

const PARTNER_CARTON_DR = "Carton DR";
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop";

const VALID_FILTERS = ["all", "carton-dr", "other"];

function normalizeProducts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p) => p && typeof p === "object" && typeof p.slug === "string" && p.slug.trim());
}

export default function Tienda() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const urlFilter = searchParams.get("filter");
  const initialFilter = VALID_FILTERS.includes(urlFilter ?? "") ? urlFilter : "all";
  const [filter, setFilter] = useState(initialFilter);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest"); // newest | priceLow | priceHigh

  useSeoMeta({
    title: t("tienda.title"),
    description: t("tienda.subtitle"),
    path: "/tienda",
  });

  const loadProducts = () => {
    setLoading(true);
    setError(null);
    const url = API_BASE ? `${API_BASE}/api/landing/dr-products` : "/api/landing/dr-products";
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setProducts(normalizeProducts(data?.products)))
      .catch(() => {
        setError(true);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const f = searchParams.get("filter");
    if (VALID_FILTERS.includes(f ?? "")) setFilter(f);
  }, [searchParams]);

  const filteredByPartner =
    filter === "all"
      ? products
      : filter === "carton-dr"
        ? products.filter((p) => (p.partner ?? "").toLowerCase() === PARTNER_CARTON_DR.toLowerCase())
        : products.filter((p) => (p.partner ?? "").toLowerCase() !== PARTNER_CARTON_DR.toLowerCase());

  const filteredBySearch = useMemo(() => {
    if (!search.trim()) return filteredByPartner;
    const q = search.trim().toLowerCase();
    return filteredByPartner.filter(
      (p) =>
        (p.title ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q)
    );
  }, [filteredByPartner, search]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredBySearch];
    if (sort === "priceLow") list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    else if (sort === "priceHigh") list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    else list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return list;
  }, [filteredBySearch, sort]);

  const formatPrice = (p) => {
    const price = Number(p?.price);
    if (!Number.isFinite(price)) return "—";
    const cur = (p?.currency || "USD").toUpperCase();
    if (cur === "USD") return `$${price.toFixed(2)}`;
    if (cur === "DOP") return `RD$${Math.round(price)}`;
    return `${price} ${cur}`;
  };

  const partnerBadge = (p) => {
    if ((p.partner ?? "").toLowerCase() === PARTNER_CARTON_DR.toLowerCase()) return "BOX";
    return "LOCAL";
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
          {t("tienda.title")}
        </h1>
        <p className="text-slate-400 text-center mb-8">{t("tienda.subtitle")}</p>

        {/* Filters + search + sort — only when we have products */}
        {!loading && !error && products.length > 0 && (
          <>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {[
                { value: "all", labelKey: "tienda.filterAll" },
                { value: "carton-dr", labelKey: "tienda.filterCartonPackaging" },
                { value: "other", labelKey: "tienda.filterOther" },
              ].map(({ value, labelKey }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    filter === value
                      ? "bg-primary text-white"
                      : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700"
                  }`}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
            <p className="text-center text-slate-500 text-sm mb-4">
              {t("tienda.productCount", { n: sortedProducts.length })}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("tienda.searchPlaceholder")}
                className="flex-1 rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-white focus:border-primary focus:outline-none"
              >
                <option value="newest">{t("tienda.sortNewest")}</option>
                <option value="priceLow">{t("tienda.sortPriceLow")}</option>
                <option value="priceHigh">{t("tienda.sortPriceHigh")}</option>
              </select>
            </div>
          </>
        )}

        {loading && <TiendaSkeleton />}

        {error && (
          <div className="text-center py-12">
            <p className="text-amber-400 mb-4">{t("tienda.errorMessage")}</p>
            <button
              type="button"
              onClick={loadProducts}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              {t("tienda.retry")}
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-2">{t("tienda.noProducts")}</p>
            <Link to="/contact" className="text-primary hover:underline text-sm">
              {t("tienda.contactFallback")}
            </Link>
          </div>
        )}

        {!loading && products.length > 0 && sortedProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">{t("tienda.noProductsFilter")}</p>
            <button
              type="button"
              onClick={() => { setFilter("all"); setSearch(""); }}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              {t("tienda.resetFilter")}
            </button>
          </div>
        )}

        {!loading && sortedProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProducts.map((p) => (
              <Link
                key={p.id}
                to={`/tienda/${p.slug}`}
                className="card-float rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="aspect-[4/3] bg-slate-700 relative">
                  <img
                    src={p.image || DEFAULT_IMAGE}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_IMAGE;
                    }}
                  />
                  <span className="absolute top-2 left-2 rounded-md bg-emerald-600/90 px-2 py-0.5 text-xs font-medium text-white">
                    {t("tienda.localBadge")}
                  </span>
                  <span className="absolute top-2 right-2 rounded-md bg-slate-700/90 px-2 py-0.5 text-xs font-medium text-white">
                    {partnerBadge(p)}
                  </span>
                  {Number(p.stock_quantity) === 0 && (
                    <span className="absolute bottom-2 left-2 rounded-md bg-amber-600/90 px-2 py-0.5 text-xs font-medium text-white">
                      {t("tienda.outOfStock")}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  {p.category && (
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">{p.category}</p>
                  )}
                  <h2 className="font-semibold text-white line-clamp-2">{p.title}</h2>
                  <p className="text-primary font-semibold mt-1">{formatPrice(p)}</p>
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
