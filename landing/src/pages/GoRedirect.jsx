import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../lib/config";
import { useLanguage } from "../context/LanguageContext";

/**
 * /go/:id → 백엔드 GET /api/go/:id 가 반환하는 302 Location으로 리다이렉트.
 * 백엔드 미설정 시 안내 메시지 표시.
 */
export default function GoRedirect() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [error, setError] = useState(null);

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
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">
      <p>{t("go.redirecting")}</p>
    </div>
  );
}
