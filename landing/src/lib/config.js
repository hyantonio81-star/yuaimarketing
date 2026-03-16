/**
 * 백엔드 API 베이스 (Nexus AI). /go/:id 리다이렉트용.
 * Vercel 배포 시 동일 도메인에서 API 서브도메인 쓰면 예: https://api.yuaimarketop.com
 * 별도 백엔드면 예: https://nexus-ai.vercel.app/api
 */
export const API_BASE =
  typeof import.meta.env?.VITE_API_URL === "string" && import.meta.env.VITE_API_URL.trim() !== ""
    ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
    : typeof window !== "undefined"
      ? ""
      : "http://localhost:4000";

export const SITE_NAME = "YUAI Marketop";
export const SUPPORT_EMAIL = "hyantonio81@gmail.com";

/** Carton DR (B2B 카톤/박스) 전용 연락처 */
export const CARTON_DR_NAME = "Carton DR";
export const CARTON_DR_EMAIL = SUPPORT_EMAIL;
export const CARTON_DR_WHATSAPP = "18295868282";
export const CARTON_DR_PHONE_1 = "+1 829 586 8282";
export const CARTON_DR_PHONE_2 = "+1 829 993 8985";
