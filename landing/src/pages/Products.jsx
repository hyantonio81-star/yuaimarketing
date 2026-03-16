import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { ALL_PRODUCTS, CATEGORIES } from "../lib/constants";
import { API_BASE } from "../lib/config";

export default function Products() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

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

  const goUrl = (goId) => (API_BASE ? `${API_BASE}/go/${goId}` : `/go/${goId}`);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
          {t("products.title")}
        </h1>
        <p className="text-slate-400 text-center mb-8">{t("products.subtitle")}</p>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <article
              key={p.id}
              className="rounded-2xl bg-slate-800/40 border border-slate-700/80 backdrop-blur-sm overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30"
            >
              <Link to={`/p/${p.slug}`} className="block aspect-[4/3] overflow-hidden bg-slate-700 group">
                <img
                  src={p.image}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </Link>
              <div className="p-4">
                <span className="text-xs font-medium text-primary uppercase tracking-wider">
                  {p.category}
                </span>
                <h2 className="font-semibold text-white mt-1 line-clamp-2">{p.title}</h2>
                <p className="text-slate-400 text-sm mt-1 line-clamp-2">{p.description}</p>
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
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-slate-500 py-12">{t("products.noResults")}</p>
        )}
      </div>
    </Layout>
  );
}
