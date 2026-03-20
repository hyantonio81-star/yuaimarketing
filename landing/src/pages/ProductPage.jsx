import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { ALL_PRODUCTS } from "../lib/constants";
import { API_BASE } from "../lib/config";
import { useSeoMeta } from "../lib/seo";

const TREND_MONTHS = ["S", "O", "N", "D", "J", "F"];

/**
 * /p/[slug] — 제품 랜딩. AI 분석 리포트형 상세: 스펙, 시장 스냅샷, 선정 이유, 베스트포, 트렌드 미니 차트.
 */
export default function ProductPage() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const product = ALL_PRODUCTS.find((p) => p.slug === slug);

  useSeoMeta({
    title: product ? product.title : t("products.noResults"),
    description: product ? product.description : t("product.description"),
    path: product ? `/p/${product.slug}` : "/products",
    image: product?.image,
    noIndex: !product,
  });

  if (!product) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">{t("product.title")}</h1>
          <p className="text-slate-400 mb-6">{t("product.slugLabel")} {slug}</p>
          <p className="text-slate-500 text-sm mb-8">{t("product.description")}</p>
          <Link to="/products" className="text-primary hover:underline">
            {t("products.title")}
          </Link>
        </div>
      </Layout>
    );
  }

  const goUrl = API_BASE ? `${API_BASE}/go/${product.goId}` : `/go/${product.goId}`;
  const snapshot = product.marketSnapshot;
  const specs = product.specs || [];
  const bestFor = product.bestFor || [];
  const trendData = product.trendData || [];
  const maxTrend = trendData.length ? Math.max(...trendData) : 1;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* 제품 카드 */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden">
          <div className="aspect-[4/3] sm:aspect-[2/1] bg-slate-700 relative">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop"; }}
            />
            {product.analysisUpdated && (
              <div className="absolute top-3 right-3 rounded-lg bg-slate-900/90 px-2.5 py-1 text-xs text-slate-400">
                {t("product.analysisUpdated")}: {product.analysisUpdated}
              </div>
            )}
          </div>
          <div className="p-6">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              {product.category}
            </span>
            <h1 className="text-2xl font-bold text-white mt-1">{product.title}</h1>
            <p className="text-slate-400 mt-2">{product.description}</p>
            <p className="text-primary font-semibold text-lg mt-4">{product.price}</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <a
                href={goUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                {t("products.buyNow")}
              </a>
              <Link
                to="/products"
                className="inline-flex items-center justify-center rounded-lg border border-slate-600 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                {t("products.title")}
              </Link>
            </div>
          </div>
        </div>

        {/* 스펙 테이블 */}
        {specs.length > 0 && (
          <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
            <h2 className="text-lg font-semibold text-white mb-1">{t("product.specsTitle")}</h2>
            <p className="text-slate-500 text-xs mb-4">{t("product.specsSource")}</p>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-700">
                {specs.map((row, i) => (
                  <tr key={i}>
                    <td className="py-2 text-slate-400">
                      {row.labelKey ? t(row.labelKey) : row.label}
                    </td>
                    <td className="py-2 text-right text-white font-medium">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* 시장 스냅샷 */}
        {snapshot && (
          <section className="mt-6 rounded-2xl border border-primary/20 bg-slate-800/40 p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <span className="text-primary">◆</span> {t("product.marketSnapshotTitle")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{t("product.growthYoY")}</p>
                <p className="text-xl font-semibold text-primary">{snapshot.growth}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Trend</p>
                <p className="text-slate-300 text-sm">{snapshot.trendKey ? t(snapshot.trendKey) : snapshot.trend}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Region</p>
                <p className="text-slate-300 text-sm">{snapshot.regionKey ? t(snapshot.regionKey) : snapshot.region}</p>
              </div>
            </div>
          </section>
        )}

        {/* Why we picked it — YUAI's Insight */}
        {product.insight && (
          <section className="mt-6 rounded-2xl border border-primary/30 bg-slate-800/50 p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-primary">◆</span> {t("product.whyWePickedTitle")}
            </h2>
            <p className="text-slate-400 text-sm mt-2">{t("product.insightDesc")}</p>
            <p className="text-white mt-3">{product.insight}</p>
          </section>
        )}

        {/* Best for */}
        {bestFor.length > 0 && (
          <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
            <h2 className="text-lg font-semibold text-white mb-3">{t("product.bestForTitle")}</h2>
            <div className="flex flex-wrap gap-2">
              {bestFor.map((key, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-slate-700/80 px-3 py-1.5 text-sm text-slate-300"
                >
                  {typeof key === "string" && key.startsWith("product.") ? t(key) : key}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 트렌드 미니 차트 */}
        {trendData.length > 0 && (
          <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
            <h2 className="text-lg font-semibold text-white mb-3">{t("product.trendIndexTitle")}</h2>
            <div className="flex items-end justify-between gap-1 h-20">
              {trendData.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="w-full rounded-t bg-primary/70 min-h-[6px] transition-all duration-300"
                    style={{ height: `${(val / maxTrend) * 100}%` }}
                  />
                  <span className="text-[10px] text-slate-500">{TREND_MONTHS[i]}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="text-center mt-8">
          <Link to="/products" className="text-slate-500 hover:text-primary text-sm">
            ← {t("products.title")}
          </Link>
        </p>
      </div>
    </Layout>
  );
}
