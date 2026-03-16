/**
 * AI 감독관 (Compliance Overseer) — ISO/IEC 42001 기반.
 * 콘텐츠 발행 직전 9대 체크리스트 검수, APPROVE/REJECT.
 */

import type { ContentComplianceInput, ComplianceCheckResult, ComplianceCheckItemId, TargetCountryCode, CommitteeRole, CommitteeMemberVote, OversightBoardResult, OversightDecision } from "./types.js";

/** B2B 메시지 말미에 붙일 수신 거부 문구 (LGPD/옵트아웃 준수) */
export const B2B_OPT_OUT_FOOTER_ES =
  "\n\nPara dejar de recibir estas ofertas, responde con la palabra 'BAJA'.";
/** B2B 메시지 말미 (pt-BR) */
export const B2B_OPT_OUT_FOOTER_PT =
  "\n\nPara deixar de receber estas ofertas, responda com a palavra 'BAIXA' ou 'BAJA'.";

const CHECK_IDS: ComplianceCheckItemId[] = [
  "transparency",
  "customs_regulations",
  "language_guardrail",
  "privacy_optout",
  "accuracy",
  "copyright",
  "ethics",
  "expertise",
  "false_urgency",
];

/** 위원회 역할별 담당 체크리스트 (Legal / Ethics / Business) */
export const CHECK_IDS_BY_ROLE: Record<CommitteeRole, ComplianceCheckItemId[]> = {
  legal: ["transparency", "customs_regulations", "privacy_optout", "copyright"],
  ethics: ["language_guardrail", "ethics", "false_urgency"],
  business: ["accuracy", "expertise"],
};

/** 제휴/광고 표기 필수 키워드 (하나라도 있으면 통과) */
const AFFILIATE_MARKERS = [
  "afiliado",
  "afiliados",
  "enlaces de afiliados",
  "publicidad",
  "enlace de afiliado",
  "comisión",
  "descargo de responsabilidad",
];

/** 도미니카 $200 면세 관련 키워드 */
const DO_200_MARKERS = ["200", "usd", "dólar", "dolar", "sin impuestos", "libre de impuestos", "exento", "aduana", "rd"];

/** 금지 표현 (혐오·비속어) — 발견 시 language_guardrail 실패 */
const BANNED_PATTERNS = [
  /\b(puta|mierda|coño|joder)\b/i,
  /\b(mata|kill)\s+(negro|mujer|gay)\b/i,
  // 추가 패턴은 정책 업데이트 시 확장
];

/** B2B 수신 거부 필수 문구 */
const OPT_OUT_MARKERS = ["baja", "dejar de recibir", "opt-out", "unsubscribe", "darse de baja"];

/** 허위 긴급성·과장 문구 — 발견 시 false_urgency 실패 (소비자보호) */
const FALSE_URGENCY_PATTERNS = [
  /\bsolo\s+quedan\s+\d+/i,
  /\búltimas?\s+unidades?\b/i,
  /\bultimas?\s+unidades?\b/i,
  /\bse\s+agotan\s+ya\b/i,
  /\baprovecha\s+ya\s+o\s+pierde\b/i,
  /\b100\s*%\s*descuento\b/i,
  /\bdescuento\s+increíble\s+limitado\b/i,
  /\boferta\s+solo\s+hoy\b/i,
  /\bno\s+te\s+quedes\s+sin\b/i,
  /\búltima\s+oportunidad\b/i,
  /\bultima\s+oportunidad\b/i,
];

function normalizeForCheck(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function checkTransparency(blogBody: string, snsCopy: string): boolean {
  const combined = normalizeForCheck(blogBody + " " + snsCopy);
  return AFFILIATE_MARKERS.some((m) => combined.includes(normalizeForCheck(m)));
}

function checkCustomsRegulations(blogBody: string, snsCopy: string, country: TargetCountryCode): boolean {
  if (country !== "DO") return true; // DO일 때만 $200 안내 의무
  const combined = normalizeForCheck(blogBody + " " + snsCopy);
  const has200 = combined.includes("200") && (combined.includes("usd") || combined.includes("dolar") || combined.includes("dólar") || combined.includes("$"));
  const hasTaxFree = DO_200_MARKERS.some((m) => combined.includes(normalizeForCheck(m)));
  return has200 || hasTaxFree;
}

function checkLanguageGuardrail(blogBody: string, snsCopy: string): boolean {
  const combined = blogBody + " " + snsCopy;
  return !BANNED_PATTERNS.some((re) => re.test(combined));
}

function checkPrivacyOptout(content: string, contentType: "b2c_affiliate" | "b2b_message"): boolean {
  if (contentType !== "b2b_message") return true;
  const normalized = normalizeForCheck(content);
  return OPT_OUT_MARKERS.some((m) => normalized.includes(normalizeForCheck(m)));
}

function checkAccuracy(blogBody: string, snsCopy: string, productPrice?: number): boolean {
  if (productPrice == null || productPrice <= 0) return true;
  const combined = blogBody + " " + snsCopy;
  // 본문에서 가격 유사 패턴 추출: $15, US$18.99, 20 USD 등
  const priceMatches = combined.match(/(?:US?\$|USD\s*)\s*(\d+(?:[.,]\d{1,2})?)|(\d+(?:[.,]\d{1,2})?)\s*(?:USD|dólares?|dolares?)/gi);
  if (!priceMatches || priceMatches.length === 0) return true; // 가격 미언급 시 통과
  const tolerance = Math.max(1, productPrice * 0.15); // 15% 허용
  const hasMatchingPrice = priceMatches.some((m) => {
    const num = parseFloat(m.replace(/[^0-9.,]/g, "").replace(",", "."));
    return !Number.isNaN(num) && Math.abs(num - productPrice) <= tolerance;
  });
  return hasMatchingPrice; // 하나라도 원본과 15% 이내면 통과
}

function checkCopyright(_blogBody: string, _snsCopy: string): boolean {
  // 이미지/상표 검증은 수동 또는 별도 모듈. 자동 검수에서는 통과.
  return true;
}

function checkEthics(_blogBody: string, _snsCopy: string): boolean {
  // 윤리적 영향 평가는 정성적. 자동 규칙 확장 시 보강.
  return true;
}

/** 허위 긴급성·과장 문구 검사 (solo quedan X, últimas unidades, 100% descuento 등) */
function checkFalseUrgency(blogBody: string, snsCopy: string): boolean {
  const combined = blogBody + " " + snsCopy;
  return !FALSE_URGENCY_PATTERNS.some((re) => re.test(combined));
}

/** B2C 블로그 전문성: 최소 길이 + 소재/배송/팁 등 정보성 문구 포함 */
function checkExpertise(blogBody: string, _snsCopy: string, country: TargetCountryCode): boolean {
  const stripped = blogBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (stripped.length < 200) return false; // 최소 200자
  const lower = normalizeForCheck(stripped);
  const hasInfo = [
    "envío",
    "envio",
    "tip",
    "precio",
    "material",
    "especificación",
    "especificacion",
    "recomendación",
    "consejo",
    "pedido",
    "courier",
    "aduana",
    "impuesto",
  ].some((w) => lower.includes(w));
  if (!hasInfo) return false;
  if (country === "DO" || country === "MX") {
    const hasLocal = ["rd", "república", "republica", "dominicana", "méxico", "mexico", "santo", "cdmx"].some(
      (w) => lower.includes(normalizeForCheck(w))
    );
    return hasLocal;
  }
  return true;
}

/** 9대 체크 전부 실행 — 결과만 반환 (단일 감독관/위원회 공용) */
function runAllChecks(input: ContentComplianceInput): Record<ComplianceCheckItemId, boolean> {
  const blogBody = input.blogBodyForPublish ?? "";
  const snsCopy = input.snsCopy ?? "";
  const combined = blogBody + " " + snsCopy;
  return {
    transparency: checkTransparency(blogBody, snsCopy),
    customs_regulations: checkCustomsRegulations(blogBody, snsCopy, input.targetCountry),
    language_guardrail: checkLanguageGuardrail(blogBody, snsCopy),
    privacy_optout: checkPrivacyOptout(combined, input.contentType),
    accuracy: checkAccuracy(blogBody, snsCopy, input.productPrice),
    copyright: checkCopyright(blogBody, snsCopy),
    ethics: checkEthics(blogBody, snsCopy),
    expertise: checkExpertise(blogBody, snsCopy, input.targetCountry),
    false_urgency: checkFalseUrgency(blogBody, snsCopy),
  };
}

const LABELS: Record<ComplianceCheckItemId, string> = {
  transparency: "투명성(광고/제휴 표기)",
  customs_regulations: "무역 규정(DO $200 면세 안내)",
  language_guardrail: "언어 가드레일(비속어·혐오 표현)",
  privacy_optout: "개인정보(수신 거부 문구)",
  accuracy: "가격·정보 정확성",
  copyright: "저작권",
  ethics: "윤리적 영향",
  expertise: "전문성(소재·배송·팁 등 정보성 콘텐츠)",
  false_urgency: "허위 긴급성·과장 문구 금지",
};
const LABELS_ES: Record<ComplianceCheckItemId, string> = {
  transparency: "Nota de afiliado/enlaces de afiliados faltante.",
  customs_regulations: "Información aduanera (ej. US$200 libre de impuestos en RD) no mencionada.",
  language_guardrail: "Expresiones prohibidas o discriminatorias detectadas.",
  privacy_optout: "Falta opción de baja (BAJA) en el mensaje.",
  accuracy: "Precisión de precios o datos insuficiente.",
  copyright: "Posible violación de derechos de autor o marca.",
  ethics: "Riesgo ético o de malentendido para el usuario.",
  expertise: "Falta contenido informativo (material, envío, tips, especificaciones).",
  false_urgency: "Uso de urgencia falsa o mensajes exagerados (ej. solo quedan X, últimas unidades) no permitido.",
};

/**
 * 위원회 1명(역할별) 검수. 해당 역할의 체크리스트만 실행해 투표 결과 반환.
 * Legal 위원: transparency 또는 customs_regulations 실패 시 fatal 플래그.
 */
export function runComplianceCheckForRole(input: ContentComplianceInput, role: CommitteeRole): CommitteeMemberVote {
  const results = runAllChecks(input);
  const ids = CHECK_IDS_BY_ROLE[role];
  const rejectReasons: string[] = [];
  const rejectReasonsEs: string[] = [];
  const checklistResults: Partial<Record<ComplianceCheckItemId, boolean>> = {};
  let fatal = false;
  for (const id of ids) {
    checklistResults[id] = results[id];
    if (!results[id]) {
      rejectReasons.push(LABELS[id]);
      rejectReasonsEs.push(LABELS_ES[id]);
      if (role === "legal" && (id === "transparency" || id === "customs_regulations")) fatal = true;
    }
  }
  const approved = rejectReasons.length === 0;
  return {
    role,
    vote: approved ? "APPROVE" : "REJECT",
    score: approved ? 100 : Math.max(0, 100 - rejectReasons.length * 25),
    rejectReasons,
    rejectReasonsEs,
    fatal: fatal ? true : undefined,
    checklistResults,
  };
}

/**
 * AI 감독 위원회(3인) 실행. 다수결(2/3 이상 승인) + fatal 시 DISCARD.
 * @returns APPROVE(발행) | REVISE(수정 후 재검수) | DISCARD(폐기)
 */
export function runOversightBoard(input: ContentComplianceInput): OversightBoardResult {
  const checkedAt = new Date().toISOString();
  const legal = runComplianceCheckForRole(input, "legal");
  const ethics = runComplianceCheckForRole(input, "ethics");
  const business = runComplianceCheckForRole(input, "business");

  const fatalBy = legal.fatal ? "legal" : ethics.fatal ? "ethics" : business.fatal ? "business" : undefined;
  const approveCount = [legal, ethics, business].filter((v) => v.vote === "APPROVE").length;

  let decision: OversightDecision;
  if (fatalBy) decision = "DISCARD";
  else if (approveCount >= 2) decision = "APPROVE";
  else decision = "REVISE";

  const rejectReasonsByRole: Record<CommitteeRole, string[]> = {
    legal: legal.rejectReasons,
    ethics: ethics.rejectReasons,
    business: business.rejectReasons,
  };
  const rejectReasonsEsByRole: Record<CommitteeRole, string[]> = {
    legal: legal.rejectReasonsEs ?? [],
    ethics: ethics.rejectReasonsEs ?? [],
    business: business.rejectReasonsEs ?? [],
  };

  return {
    decision,
    compliance_status: decision === "APPROVE" ? "APPROVE" : "REJECT",
    votes: { legal, ethics, business },
    rejectReasonsByRole,
    rejectReasonsEsByRole,
    fatalBy,
    checkedAt,
  };
}

/**
 * 발행 직전 콘텐츠에 대해 9대 체크리스트 실행.
 * 하나라도 실패 시 approved: false, rejectReasons/rejectReasonsEs에 사유 추가.
 */
export function runComplianceCheck(input: ContentComplianceInput): ComplianceCheckResult {
  const blogBody = input.blogBodyForPublish ?? "";
  const snsCopy = input.snsCopy ?? "";
  const checkedAt = new Date().toISOString();
  const results = runAllChecks(input);

  const rejectReasons: string[] = [];
  const rejectReasonsEs: string[] = [];
  for (const id of CHECK_IDS) {
    if (!results[id]) {
      rejectReasons.push(LABELS[id]);
      rejectReasonsEs.push(LABELS_ES[id]);
    }
  }
  const approved = rejectReasons.length === 0;

  return {
    approved,
    compliance_status: approved ? "APPROVE" : "REJECT",
    rejectReasons,
    rejectReasonsEs,
    checklistResults: results,
    checkedAt,
  };
}
