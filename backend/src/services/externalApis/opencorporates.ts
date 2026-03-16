/**
 * OpenCorporates API (무료 티어: API 토큰 필요, 제한 있음)
 * https://api.opencorporates.com/documentation/API-Reference
 * 환경변수 OPENCOMPORATES_API_TOKEN 설정 시 검색 가능
 */

const BASE = "https://api.opencorporates.com/v0.4";

function getToken(): string | null {
  try {
    return (process.env.OPENCOMPORATES_API_TOKEN ?? "").trim() || null;
  } catch {
    return null;
  }
}

export interface OpenCorporatesCompany {
  name: string;
  company_number?: string;
  jurisdiction_code?: string;
  opencorporates_url?: string;
  incorporation_date?: string;
}

/** 회사 검색. q=회사명, jurisdiction_code=국가(선택) */
export async function searchCompanies(
  query: string,
  options: { jurisdictionCode?: string; perPage?: number } = {}
): Promise<OpenCorporatesCompany[]> {
  const token = getToken();
  const perPage = Math.min(30, options.perPage ?? 10);
  const url = new URL(`${BASE}/companies/search`);
  url.searchParams.set("q", query.slice(0, 200));
  url.searchParams.set("per_page", String(perPage));
  if (options.jurisdictionCode) url.searchParams.set("jurisdiction_code", options.jurisdictionCode);
  if (token) url.searchParams.set("api_token", token);
  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const json = await res.json();
    const results = json?.results?.companies ?? [];
    if (!Array.isArray(results)) return [];
    return results.map((c: Record<string, unknown>) => {
      const company = (c?.company ?? c) as Record<string, unknown>;
      return {
        name: String(company?.name ?? ""),
        company_number: company?.company_number != null ? String(company.company_number) : undefined,
        jurisdiction_code: company?.jurisdiction_code != null ? String(company.jurisdiction_code) : undefined,
        opencorporates_url: company?.opencorporates_url != null ? String(company.opencorporates_url) : undefined,
        incorporation_date: company?.incorporation_date != null ? String(company.incorporation_date) : undefined,
      };
    });
  } catch {
    return [];
  }
}
