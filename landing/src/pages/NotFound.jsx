import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { useSeoMeta } from "../lib/seo";

export default function NotFound() {
  const { t } = useLanguage();
  useSeoMeta({
    title: t("notFound.title"),
    description: t("notFound.description"),
    path: "/404",
    noIndex: true,
  });
  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {t("notFound.title")}
        </h1>
        <p className="text-slate-400 mb-6">{t("notFound.description")}</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          {t("notFound.backHome")}
        </Link>
      </div>
    </Layout>
  );
}
