import type { CountryB2BMetadata } from "../types/market.js";
import { COUNTRY_MASTER } from "./countryMaster.js";

/** B2B 매칭/필터용 산업·섹터 코드 */
export const B2B_SECTORS = [
  "steel",
  "machinery",
  "power_equipment",
  "raw_materials",
  "fruits_agri",
  "electronics",
] as const;

export type B2BSector = (typeof B2B_SECTORS)[number];

export function isValidSector(s: string): s is B2BSector {
  return (B2B_SECTORS as readonly string[]).includes(s);
}

/** HS 대역과 섹터 매핑 (간이) */
export const HS_TO_SECTOR: Record<string, B2BSector> = {
  "72": "steel",
  "73": "steel",
  "84": "machinery",
  "85": "electronics",
  "8541": "electronics",
  "8504": "power_equipment",
  "26": "raw_materials",
  "27": "raw_materials",
  "03": "fruits_agri",
  "08": "fruits_agri",
};

/** 국가별 B2B 메타데이터: 결제 선호, 대표 산업, 물류 난이도, FTA 등 */
const B2B_METADATA: CountryB2BMetadata[] = [
  { country_code: "KR", region: "Northeast Asia", payment_preference: "T/T, LC", key_industries: ["electronics", "machinery", "steel"], logistics_difficulty: "low", fta_with_kr: true },
  { country_code: "US", region: "North America", payment_preference: "T/T, LC", key_industries: ["electronics", "machinery", "raw_materials"], logistics_difficulty: "low", fta_with_kr: true, note: "FDA/FCC 등 규제 고려" },
  { country_code: "JP", region: "Northeast Asia", payment_preference: "T/T, LC", key_industries: ["electronics", "machinery"], logistics_difficulty: "low", fta_with_kr: true },
  { country_code: "CN", region: "Northeast Asia", payment_preference: "LC, D/P", key_industries: ["electronics", "machinery", "raw_materials", "steel"], logistics_difficulty: "medium", fta_with_kr: true },
  { country_code: "VN", region: "Southeast Asia", payment_preference: "LC, T/T", key_industries: ["electronics", "fruits_agri", "raw_materials"], logistics_difficulty: "medium", fta_with_kr: true },
  { country_code: "SG", region: "Southeast Asia", payment_preference: "T/T, LC", key_industries: ["electronics", "machinery"], logistics_difficulty: "low", fta_with_kr: true },
  { country_code: "IN", region: "South Asia", payment_preference: "LC", key_industries: ["raw_materials", "machinery", "electronics"], logistics_difficulty: "medium", fta_with_kr: false },
  { country_code: "DE", region: "Europe", payment_preference: "T/T, LC", key_industries: ["machinery", "electronics", "steel"], logistics_difficulty: "low", fta_with_kr: true, note: "CE, REACH 등 규격" },
  { country_code: "GB", region: "Europe", payment_preference: "T/T, LC", key_industries: ["electronics", "machinery"], logistics_difficulty: "low", fta_with_kr: true },
  { country_code: "NL", region: "Europe", payment_preference: "T/T, LC", key_industries: ["electronics", "fruits_agri", "machinery"], logistics_difficulty: "low", fta_with_kr: true },
  { country_code: "FR", region: "Europe", payment_preference: "T/T, LC", key_industries: ["machinery", "electronics"], logistics_difficulty: "low", fta_with_kr: true },
  { country_code: "IT", region: "Europe", payment_preference: "T/T, LC", key_industries: ["machinery", "electronics"], logistics_difficulty: "low", fta_with_kr: true },
  { country_code: "ES", region: "Europe", payment_preference: "T/T, LC", key_industries: ["fruits_agri", "machinery"], logistics_difficulty: "low", fta_with_kr: true },
  { country_code: "MX", region: "Latin America", payment_preference: "LC, T/T", key_industries: ["electronics", "machinery", "raw_materials"], logistics_difficulty: "medium", fta_with_kr: true, note: "USMCA" },
  { country_code: "BR", region: "Latin America", payment_preference: "LC", key_industries: ["raw_materials", "fruits_agri", "machinery"], logistics_difficulty: "high", fta_with_kr: false },
  { country_code: "CL", region: "Latin America", payment_preference: "LC, T/T", key_industries: ["fruits_agri", "raw_materials"], logistics_difficulty: "medium", fta_with_kr: true },
  { country_code: "CO", region: "Latin America", payment_preference: "LC", key_industries: ["fruits_agri", "raw_materials"], logistics_difficulty: "medium", fta_with_kr: true },
  { country_code: "PE", region: "Latin America", payment_preference: "LC", key_industries: ["raw_materials", "fruits_agri"], logistics_difficulty: "medium", fta_with_kr: true },
  { country_code: "PA", region: "Latin America", payment_preference: "LC, T/T", key_industries: ["electronics", "machinery"], logistics_difficulty: "low", note: "물류 허브" },
  { country_code: "GT", region: "Central America", payment_preference: "LC", key_industries: ["fruits_agri", "raw_materials"], logistics_difficulty: "medium", fta_with_kr: false },
  { country_code: "HN", region: "Central America", payment_preference: "LC", key_industries: ["fruits_agri"], logistics_difficulty: "medium", fta_with_kr: false },
  { country_code: "SV", region: "Central America", payment_preference: "LC, T/T", key_industries: ["electronics", "fruits_agri"], logistics_difficulty: "medium", fta_with_kr: false },
  { country_code: "NI", region: "Central America", payment_preference: "LC", key_industries: ["fruits_agri", "raw_materials"], logistics_difficulty: "medium", fta_with_kr: false },
  { country_code: "CR", region: "Central America", payment_preference: "LC, T/T", key_industries: ["electronics", "fruits_agri"], logistics_difficulty: "medium", fta_with_kr: false },
  { country_code: "DO", region: "Latin America", payment_preference: "LC", key_industries: ["fruits_agri", "electronics"], logistics_difficulty: "medium", fta_with_kr: false },
  { country_code: "AE", region: "Middle East", payment_preference: "LC, T/T", key_industries: ["electronics", "machinery", "power_equipment"], logistics_difficulty: "low", fta_with_kr: false, note: "에너지·인프라 수요" },
  { country_code: "SA", region: "Middle East", payment_preference: "LC", key_industries: ["power_equipment", "machinery", "steel"], logistics_difficulty: "medium", fta_with_kr: false, note: "발전·인프라 프로젝트" },
  { country_code: "QA", region: "Middle East", payment_preference: "LC", key_industries: ["power_equipment", "machinery"], logistics_difficulty: "low", fta_with_kr: false },
  { country_code: "KW", region: "Middle East", payment_preference: "LC", key_industries: ["power_equipment", "machinery", "raw_materials"], logistics_difficulty: "medium", fta_with_kr: false },
  { country_code: "EG", region: "Africa", payment_preference: "LC", key_industries: ["raw_materials", "machinery", "fruits_agri"], logistics_difficulty: "medium", fta_with_kr: false },
  { country_code: "ZA", region: "Africa", payment_preference: "LC, T/T", key_industries: ["raw_materials", "machinery", "fruits_agri"], logistics_difficulty: "medium", fta_with_kr: false },
  { country_code: "NG", region: "Africa", payment_preference: "LC", key_industries: ["raw_materials", "power_equipment"], logistics_difficulty: "high", fta_with_kr: false },
  // fallbacks for countries without explicit metadata
  { country_code: "AR", region: "Latin America", payment_preference: "LC", key_industries: ["raw_materials", "fruits_agri"], logistics_difficulty: "high", fta_with_kr: false },
  { country_code: "EC", region: "Latin America", payment_preference: "LC", key_industries: ["fruits_agri", "raw_materials"], logistics_difficulty: "medium", fta_with_kr: false },
  { country_code: "VE", region: "Latin America", payment_preference: "LC", key_industries: ["raw_materials"], logistics_difficulty: "high", fta_with_kr: false },
  { country_code: "CU", region: "Latin America", payment_preference: "LC", key_industries: ["raw_materials", "fruits_agri"], logistics_difficulty: "high", fta_with_kr: false },
];

const METADATA_BY_COUNTRY = new Map<string, CountryB2BMetadata>(
  B2B_METADATA.map((m) => [m.country_code.toUpperCase(), m])
);

export function getCountryB2BMetadata(countryCode: string): CountryB2BMetadata | null {
  const key = (countryCode || "").toUpperCase().slice(0, 2);
  return METADATA_BY_COUNTRY.get(key) ?? null;
}

export function getCountriesByRegion(region: string): string[] {
  return COUNTRY_MASTER.filter((c) => c.region === region).map((c) => c.country_code);
}

/** 매칭 등에서 사용할 B2B 대상 국가 코드 풀 (countryMaster 기준) */
export function getB2bCountryPool(): string[] {
  return COUNTRY_MASTER.map((c) => c.country_code);
}

/** HS 코드(앞 2자리 또는 4자리)로 섹터 추정 */
export function getSectorFromHsCode(hsCode: string): B2BSector | null {
  const s = (hsCode || "").replace(/\D/g, "").slice(0, 4);
  if (s.length >= 2) {
    const by2 = s.slice(0, 2);
    if (HS_TO_SECTOR[by2]) return HS_TO_SECTOR[by2];
    if (HS_TO_SECTOR[s]) return HS_TO_SECTOR[s];
  }
  return null;
}

export function getRegionsList(): string[] {
  const set = new Set(B2B_METADATA.map((m) => m.region));
  return Array.from(set).sort();
}
