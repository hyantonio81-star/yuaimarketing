/**
 * AI 백신·대응: 사용자 입력 검증, 길이 제한, 프롬프트 인젝션 패턴 완화.
 * AI 호출 전 모든 사용자 입력에 적용 권장.
 */

const MAX_INPUT_LENGTH = 8 * 1024; // 8KB
const DANGEROUS_PATTERNS = [
  /ignore\s+(previous|above|all)\s+instructions/i,
  /you\s+are\s+now\s+/i,
  /system\s*:\s*/i,
  /\[INST\]|\[\/INST\]/i,
  /<\|[a-z_]+\|>/g,
  /\[\[.*?\]\]/g,
];

/**
 * 사용자 입력 정규화: null 바이트 제거, 앞뒤 공백, 길이 제한.
 */
export function normalizeAiInput(raw: unknown): string {
  if (raw == null) return "";
  let s = String(raw)
    .replace(/\0/g, "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (s.length > MAX_INPUT_LENGTH) s = s.slice(0, MAX_INPUT_LENGTH);
  return s;
}

/**
 * 프롬프트 인젝션 의심 패턴이 있으면 제거 또는 플래그.
 * 반환: { sanitized, flagged } — flagged 시 로그/감사 권장.
 */
export function sanitizeForAi(input: string): { sanitized: string; flagged: boolean } {
  const normalized = normalizeAiInput(input);
  let flagged = false;
  for (const pat of DANGEROUS_PATTERNS) {
    if (pat.test(normalized)) {
      flagged = true;
      break;
    }
  }
  const sanitized = normalized
    .replace(/<\|[^|]+\|>/g, "")
    .replace(/\[\[[\s\S]*?\]\]/g, "");
  return { sanitized: sanitized.trim() || normalized, flagged };
}

/**
 * handle-request 등 AI 요청 바디에 적용할 검증.
 * 길이 초과 시 400, sanitized 텍스트 반환.
 */
export function validateAiRequestBody(
  raw: unknown
): { ok: true; sanitized: string; flagged: boolean } | { ok: false; statusCode: number; error: string } {
  const { sanitized, flagged } = sanitizeForAi(String(raw ?? ""));
  if (sanitized.length === 0) {
    return { ok: false, statusCode: 400, error: "request required" };
  }
  return { ok: true, sanitized, flagged };
}
