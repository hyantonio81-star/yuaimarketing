/**
 * Master plan: Organization + Country (Market) scope for all Pillars.
 */

export interface CountryMaster {
  country_code: string;
  name: string;
  name_en: string;
  locale: string;
  currency: string;
  region?: string;
}

/** B2B 무역용 국가/지역 메타: 결제 선호, 대표 산업, 물류 난이도, FTA 등 */
export interface CountryB2BMetadata {
  country_code: string;
  region: string;
  payment_preference: string;
  key_industries: string[];
  logistics_difficulty: "low" | "medium" | "high";
  fta_with_kr?: boolean;
  note?: string;
}

export interface OrganizationMarket {
  id: string;
  organization_id: string;
  country_code: string;
  locale: string;
  currency: string;
  is_default: boolean;
  b2b_enabled: boolean;
  b2c_enabled: boolean;
}

export interface MarketProfile {
  organization_id: string;
  country_code: string;
  product_categories: string[];
  industries: string[];
  company_type: string;
  b2b_strategy?: Record<string, unknown>;
  b2c_strategy?: Record<string, unknown>;
  keywords: string[];
  competitor_ids: string[];
  seo_locale?: string;
}

export interface MarketContext {
  country_code: string;
  country: CountryMaster;
  profile?: MarketProfile | null;
}

export interface RegisterOrganizationBody {
  organization_name: string;
  target_countries: string[];
  product_categories: string[];
  industry: string;
  company_type: string;
  b2b_enabled?: boolean;
  b2c_enabled?: boolean;
  user_email?: string;
  /** 등록회사 해당국가 외 기초 정보 */
  company_registration_country?: string;
  company_address?: string;
  company_contact?: string;
  /** 타깃 시장 기타 (직접 입력) */
  target_market_other?: string;
}
