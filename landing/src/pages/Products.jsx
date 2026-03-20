import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { ALL_PRODUCTS, CATEGORIES } from "../lib/constants";
import { API_BASE } from "../lib/config";
import { useSeoMeta } from "../lib/seo";

const DEFAULT_IMG = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop";

const SORT_OPTIONS = [
  { id: "trend", labelKey: "products.sortTrend" },
  { id: "newest", labelKey: "products.sortNewest" },
  { id: "price", labelKey: "products.sortPrice" },
];

function getTrendScore(p) {
  if (p.trendData && p.trendData.length > 0) return p.trendData[p.trendData.length - 1];
  if (p.marketSnapshot && p.marketSnapshot.growth) {
    const n = parseFloat(String(p.marketSnapshot.growth).replace(/%/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function getPriceNum(p) {
  const s = String(p.price || "").replace(/[^0-9.]/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export default function Products() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("trend");

  useSeoMeta({
    title: t("products.title"),
    description: t("products.subtitle"),
    path: "/products",
  });

  const filtered = useMemo(() => {
    let list = ALL_PRODUCTS;
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    }
    return list;
  }, [search, category]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sort === "trend") list.sort((a, b) => getTrendScore(b) - getTrendScore(a));
    else if (sort === "price") list.sort((a, b) => getPriceNum(a) - getPriceNum(b));
    return list;
  }, [filtered, sort]);

  const goUrl = (goId) => (API_BASE ? `${API_BASE}/go/${goId}` : `/go/${goId}`);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
          {t("products.title")}
        </h1>
        <p className="text-slate-400 text-center mb-8">{t("products.subtitle")}</p>

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("products.searchPlaceholder")}
              className="flex-1 rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
              aria-label="Search products"
            />
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    category === cat.id
                      ? "bg-primary text-white"
                      : "border border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t(cat.labelKey)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-500 text-sm">
              {t("products.productCount", { n: sorted.length })}
            </span>
            <div className="flex gap-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSort(opt.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    sort === opt.id
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "border border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((p) => {
            const snapshot = p.marketSnapshot;
            const bestForPreview = (p.bestFor || []).slice(0, 2);
            const trendData = p.trendData || [];
            const maxTrend = trendData.length ? Math.max(...trendData) : 1;
            return (
              <article
                key={p.id}
                className="rounded-2xl bg-slate-800/40 border border-slate-700/80 backdrop-blur-sm overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30"
              >
                <Link to={`/p/${p.slug}`} className="block aspect-[4/3] overflow-hidden bg-slate-700 group relative">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMG; }}
                  />
                  {snapshot && snapshot.growth && (
                    <span className="absolute top-2 right-2 rounded-md bg-primary/90 px-2 py-0.5 text-xs font-medium text-white">
                      {t("products.growthYoY", { growth: snapshot.growth })}
                    </span>
                  )}
                  {trendData.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-0.5 h-8 px-2 py-1 bg-slate-900/70">
                      {trendData.map((val, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-primary/60 min-h-[4px] transition-all"
                          style={{ height: `${(val / maxTrend) * 100}%` }}
                          aria-hidden
                        />
                      ))}
                    </div>
                  )}
                </Link>
                <div className="p-4">
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">
                    {p.category}
                  </span>
                  <h2 className="font-semibold text-white mt-1 line-clamp-2">{p.title}</h2>
                  <p className="text-slate-400 text-sm mt-1 line-clamp-2">{p.description}</p>
                  {bestForPreview.length > 0 && (
                    <p className="text-slate-500 text-xs mt-1.5">
                      {t("products.idealFor")}:{" "}
                      {bestForPreview.map((key, i) => (
                        <span key={i}>
                          {typeof key === "string" && key.startsWith("product.") ? t(key) : key}
                          {i < bestForPreview.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </p>
                  )}
                  <p className="text-primary font-medium mt-2">{p.price}</p>
                  <div className="flex gap-2 mt-3">
                    <Link
                      to={`/p/${p.slug}`}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {t("products.viewDetails")}
                    </Link>
                    <a
                      href={goUrl(p.goId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {t("products.buyNow")}
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">{t("products.noResults")}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => { setCategory("all"); setSearch(""); }}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                {t("products.emptyViewAll")}
              </button>
              <Link
                to="/"
                className="rounded-lg bg-primary/20 border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/30 transition-colors"
              >
                {t("products.emptyViewFeatured")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
