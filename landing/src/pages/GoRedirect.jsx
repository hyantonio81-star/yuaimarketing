import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout";
import { API_BASE, SITE_NAME } from "../lib/config";
import { useLanguage } from "../context/LanguageContext";
import { useSeoMeta } from "../lib/seo";

/**
 * /go/:id → 백엔드 GET /api/go/:id 가 반환하는 302 Location으로 리다이렉트.
 * 백엔드 미설정 시 안내 메시지 표시.
 */
export default function GoRedirect() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [error, setError] = useState(null);
  useSeoMeta({
    title: SITE_NAME,
    description: t("go.redirecting"),
    path: id ? `/go/${id}` : "/go",
    noIndex: true,
  });

  useEffect(() => {
    if (!id) {
      setError(t("go.noId"));
      return;
    }
    const url = `${API_BASE}/api/go/${encodeURIComponent(id)}`;
    window.location.href = url;
  }, [id, t]);

  if (error) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-white mb-2">{SITE_NAME}</h1>
          <p className="text-slate-400 mb-4">{error}</p>
          <Link to="/links" className="text-primary hover:underline">{t("nav.allLinks")}</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400">{t("go.redirecting")}</p>
      </div>
    </Layout>
  );
}
