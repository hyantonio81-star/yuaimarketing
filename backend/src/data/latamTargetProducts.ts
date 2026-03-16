/**
 * 중남미 B2B 타겟 품목 리스트 (2026).
 * DO·PA 거점 기준 수익성 극대화 카테고리. Hot Lead·매칭 기본값으로 사용.
 */

export interface LatamTargetProduct {
  hs_code: string;
  label_es: string;
  label_en: string;
  category: string;
  priority_countries: string[];
}

export const LATAM_TARGET_PRODUCTS_2026: LatamTargetProduct[] = [
  { hs_code: "8504", label_es: "inversores solares / transformadores eléctricos", label_en: "solar inverters / electrical transformers", category: "power_equipment", priority_countries: ["DO", "PA"] },
  { hs_code: "8541", label_es: "diodos, células fotovoltaicas", label_en: "diodes, photovoltaic cells", category: "electronics", priority_countries: ["DO", "PA"] },
  { hs_code: "8419", label_es: "equipos de refrigeración y calefacción", label_en: "refrigeration and heating equipment", category: "machinery", priority_countries: ["DO", "PA"] },
  { hs_code: "8471", label_es: "computadoras y equipos de oficina", label_en: "computers and office equipment", category: "electronics", priority_countries: ["DO", "PA"] },
  { hs_code: "8517", label_es: "teléfonos y equipos de transmisión", label_en: "telephones and transmission equipment", category: "electronics", priority_countries: ["DO", "PA"] },
  { hs_code: "7308", label_es: "estructuras y perfiles de acero", label_en: "steel structures and profiles", category: "steel", priority_countries: ["DO", "PA"] },
  { hs_code: "8486", label_es: "máquinas y aparatos de elevación", label_en: "lifting machinery", category: "machinery", priority_countries: ["PA", "DO"] },
  { hs_code: "0803", label_es: "plátanos y bananas", label_en: "bananas and plantains", category: "fruits_agri", priority_countries: ["DO", "PA"] },
  { hs_code: "2710", label_es: "aceites de petróleo y combustibles", label_en: "petroleum oils and fuels", category: "raw_materials", priority_countries: ["PA", "DO"] },
];

export const DEFAULT_HS_LATAM = "8504";

export function getLatamTargetProductsByCountry(country_code: string): LatamTargetProduct[] {
  const code = (country_code || "").toUpperCase().slice(0, 2);
  return LATAM_TARGET_PRODUCTS_2026.filter((p) => p.priority_countries.includes(code));
}

export function getDefaultHsForLatam(country_code: string): string {
  const list = getLatamTargetProductsByCountry(country_code);
  return list[0]?.hs_code ?? DEFAULT_HS_LATAM;
}
