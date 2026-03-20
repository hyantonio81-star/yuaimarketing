import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { useSeoMeta } from "../lib/seo";

export default function Privacy() {
  const { t } = useLanguage();
  useSeoMeta({
    title: t("legal.privacyTitle"),
    description: t("legal.privacyIntro"),
    path: "/privacy",
  });
  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="section-title mb-6">{t("legal.privacyTitle")}</h1>
        <div className="space-y-6 text-slate-400 text-sm leading-relaxed">
          <p>{t("legal.privacyIntro")}</p>
          <p>{t("legal.privacyCollect")}</p>
          <p>{t("legal.privacyRights")}</p>
          <p>{t("legal.privacyAffiliate")}</p>
          <p>{t("legal.privacyContact")}</p>
        </div>
      </div>
    </Layout>
  );
}
