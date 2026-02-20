import type { CountryMaster, MarketProfile, RegisterOrganizationBody } from "../types/market.js";
import { COUNTRY_MASTER } from "../data/countryMaster.js";

const orgStore = new Map<string, RegisterOrganizationBody & { id: string }>();

export function getCountries(): CountryMaster[] {
  return COUNTRY_MASTER;
}

export function getCountryByCode(countryCode: string): CountryMaster | null {
  const code = (countryCode || "").toUpperCase().slice(0, 2);
  return COUNTRY_MASTER.find((c) => c.country_code === code) ?? null;
}

export function getMarketProfile(
  organizationId: string,
  countryCode: string
): MarketProfile | null {
  const country = getCountryByCode(countryCode);
  if (!country) return null;
  const stored = orgStore.get(organizationId);
  const categories = stored?.product_categories?.length
    ? stored.product_categories
    : ["electronics", "consumer_goods"];
  const industries = stored?.industry ? [stored.industry] : ["manufacturing", "trading"];
  return {
    organization_id: organizationId,
    country_code: country.country_code,
    product_categories: categories,
    industries,
    company_type: stored?.company_type ?? "manufacturer",
    keywords: [],
    competitor_ids: [],
    seo_locale: country.locale,
  };
}

export function registerOrganization(
  body: RegisterOrganizationBody
): { organization_id: string } {
  const id = "org_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  orgStore.set(id, {
    ...body,
    company_registration_country: body.company_registration_country ?? "",
    company_address: body.company_address ?? "",
    company_contact: body.company_contact ?? "",
    target_market_other: body.target_market_other ?? "",
    id,
  });
  return { organization_id: id };
}
