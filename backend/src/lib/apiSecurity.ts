/**
 * API 입력 검증·정규화: B2B/B2C 등 쿼리·바디 파라미터.
 * 국가 코드 화이트리스트, 길이 제한, null 바이트 제거.
 */
import { COUNTRY_MASTER } from "../data/countryMaster.js";

const VALID_COUNTRY_CODES = new Set(COUNTRY_MASTER.map((c) => c.country_code.toUpperCase()));

const MAX_ITEM_LENGTH = 500;
const MAX_ORG_ID_LENGTH = 64;
const MAX_HS_LENGTH = 20;
const ORG_ID_REG = /^[a-zA-Z0-9_-]+$/;

function trimAndRemoveNull(s: string): string {
  return s.replace(/\0/g, "").trim();
}

/**
 * 국가 코드: 2자리, 화이트리스트만 허용. 아니면 null.
 */
export function sanitizeCountryCode(raw: unknown): string | null {
  if (raw == null) return null;
  const code = trimAndRemoveNull(String(raw)).toUpperCase().slice(0, 2);
  return code.length === 2 && VALID_COUNTRY_CODES.has(code) ? code : null;
}

/**
 * 국가 코드 또는 기본값 반환 (검증 실패 시 defaultCode).
 */
export function sanitizeCountryCodeWithDefault(raw: unknown, defaultCode: string): string {
  const code = sanitizeCountryCode(raw);
  return code ?? (VALID_COUNTRY_CODES.has(defaultCode.toUpperCase()) ? defaultCode.toUpperCase().slice(0, 2) : "US");
}

/**
 * 아이템/품목/제품명 등: 최대 길이 제한, null 제거.
 */
export function sanitizeItemOrProduct(raw: unknown, maxLength: number = MAX_ITEM_LENGTH): string {
  if (raw == null) return "";
  return trimAndRemoveNull(String(raw)).slice(0, maxLength);
}

/**
 * HS 코드: 숫자만 허용, 최대 10자리.
 */
export function sanitizeHsCode(raw: unknown): string {
  if (raw == null) return "";
  const s = String(raw).replace(/\D/g, "").slice(0, 10);
  return s || "8504";
}

/**
 * 조직 ID: 영숫자·하이픈·언더스코어만, 최대 길이.
 */
export function sanitizeOrgId(raw: unknown): string {
  if (raw == null) return "default";
  const s = trimAndRemoveNull(String(raw)).slice(0, MAX_ORG_ID_LENGTH);
  return ORG_ID_REG.test(s) ? s : "default";
}

/**
 * 숫자 파라미터: min~max 클램프, NaN이면 default.
 */
export function sanitizeNumber(raw: unknown, defaultVal: number, min: number, max: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return defaultVal;
  return Math.min(max, Math.max(min, n));
}

/**
 * 짧은 문자열 (레이블 등): 최대 200자.
 */
export function sanitizeShortString(raw: unknown, maxLength: number = 200): string {
  if (raw == null) return "";
  return trimAndRemoveNull(String(raw)).slice(0, maxLength);
}
