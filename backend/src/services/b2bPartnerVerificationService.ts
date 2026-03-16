/**
 * B2B 파트너 사전 검증 (콘텐츠 감독과 분리).
 * 법률/비즈니스/윤리 감독관별 소스·체크 결과 스키마. 실제 ONAPI/블랙리스트 연동은 이후 단계.
 */

export type PartnerVerificationDecision = "APPROVED" | "REJECTED" | "PENDING";

/** 감독 역할별 점수·소스 (문서: Legal=ONAPI/RNC, Business=LinkedIn/노란페이지, Ethics=뉴스/감성) */
export interface PartnerVerificationByRole {
  role: "legal" | "business" | "ethics";
  score: number; // 0..100
  passed: boolean;
  /** 체크한 항목 요약 */
  checks: string[];
  /** 소스 요약 (예: ONAPI, Paginas Amarillas) */
  sources_used?: string[];
  reject_reasons?: string[];
}

export interface PartnerVerificationResult {
  partner_id: string;
  organization_name?: string;
  country_code: string;
  /** RNC 등 사업자 식별자 */
  registration_id?: string;
  decision: PartnerVerificationDecision;
  overall_score: number; // 0..100, 80+ 권장 APPROVED
  by_role: {
    legal: PartnerVerificationByRole;
    business: PartnerVerificationByRole;
    ethics: PartnerVerificationByRole;
  };
  verified_at: string; // ISO 8601
  /** 리드 ID와 연결 시 */
  lead_id?: string;
}

export interface PartnerVerificationInput {
  partner_id: string;
  organization_name?: string;
  country_code: string;
  registration_id?: string; // RNC (DO), RUC (PA) 등
  lead_id?: string;
}

const store = new Map<string, PartnerVerificationResult>();

/**
 * 파트너 검증 실행 (현재 목(mock): 실제 ONAPI/블랙리스트/뉴스 API 연동 시 교체).
 * 80점 이상이면 APPROVED.
 */
export function runPartnerVerification(input: PartnerVerificationInput): PartnerVerificationResult {
  const id = input.partner_id;
  const now = new Date().toISOString();
  // Mock: 해시 기반 일관된 점수
  const seed = id + (input.registration_id ?? "") + input.country_code;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i);
  h = Math.abs(h);
  const legalScore = 60 + (h % 35);
  const businessScore = 55 + ((h >> 4) % 40);
  const ethicsScore = 50 + ((h >> 8) % 45);
  const overall = Math.round((legalScore + businessScore + ethicsScore) / 3);
  const decision: PartnerVerificationDecision =
    overall >= 80 ? "APPROVED" : overall >= 50 ? "PENDING" : "REJECTED";

  const result: PartnerVerificationResult = {
    partner_id: input.partner_id,
    organization_name: input.organization_name,
    country_code: input.country_code,
    registration_id: input.registration_id,
    decision,
    overall_score: overall,
    by_role: {
      legal: {
        role: "legal",
        score: legalScore,
        passed: legalScore >= 70,
        checks: ["registration_valid", "blacklist_check"],
        sources_used: ["ONAPI", "internal_blacklist"],
      },
      business: {
        role: "business",
        score: businessScore,
        passed: businessScore >= 60,
        checks: ["operating_duration", "web_active"],
        sources_used: ["LinkedIn", "Paginas Amarillas"],
      },
      ethics: {
        role: "ethics",
        score: ethicsScore,
        passed: ethicsScore >= 60,
        checks: ["sentiment_news", "reputation_risk"],
        sources_used: ["news_sentiment"],
      },
    },
    verified_at: now,
    lead_id: input.lead_id,
  };
  store.set(id, result);
  return result;
}

export function getPartnerVerificationStatus(partner_id: string): PartnerVerificationResult | undefined {
  return store.get(partner_id);
}

/** Make.com 발송 게이트: 80점 이상 APPROVED만 발송 허용 */
export function isPartnerApprovedForSend(partner_id: string): boolean {
  const r = store.get(partner_id);
  return r?.decision === "APPROVED" && r.overall_score >= 80;
}
