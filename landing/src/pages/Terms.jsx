import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { useSeoMeta } from "../lib/seo";

export default function Terms() {
  const { t } = useLanguage();
  useSeoMeta({
    title: t("legal.termsTitle"),
    description: t("legal.termsIntro"),
    path: "/terms",
  });
  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="section-title mb-6">{t("legal.termsTitle")}</h1>
        <div className="space-y-6 text-slate-400 text-sm leading-relaxed">
          <p>{t("legal.termsIntro")}</p>
          <p>{t("legal.termsScope")}</p>
          <p>{t("legal.termsAffiliate")}</p>
          <p>{t("legal.termsChanges")}</p>
        </div>
      </div>
    </Layout>
  );
}
