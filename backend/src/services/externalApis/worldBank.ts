/**
 * World Bank Open Data API (무료, API 키 불필요)
 * https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures
 */

const BASE = "https://api.worldbank.org/v2";
const SEARCH_BASE = "https://search.worldbank.org/api/v3";

export interface WorldBankIndicatorPoint {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  value: number | null;
  date: string;
}

export interface WorldBankCountryIndicatorResponse {
  data: Array<{
    indicator: { id: string; value: string };
    country: { id: string; value: string };
    value: number | null;
    date: string;
  }>;
  total: number;
}

/** 국가별 지표 조회 (예: GDP). countryCode: ISO 2자리 (USA, KOR 등) */
export async function fetchCountryIndicator(
  countryCode: string,
  indicatorCode: string,
  perPage = 5
): Promise<WorldBankIndicatorPoint[]> {
  const code = countryCode.length === 2 ? (countryCode === "KR" ? "KOR" : countryCode.toUpperCase()) : countryCode;
  const url = `${BASE}/country/${code}/indicator/${indicatorCode}?format=json&per_page=${perPage}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const json = await res.json();
    if (Array.isArray(json) && json[1]) return json[1];
    return [];
  } catch {
    return [];
  }
}

/** 주요 지표 코드: GDP, 인구, 무역 등 */
export const WORLD_BANK_INDICATORS = {
  GDP: "NY.GDP.MKTP.CD",
  GDP_PER_CAPITA: "NY.GDP.PCAP.CD",
  POPULATION: "SP.POP.TOTL",
  EXPORT: "NE.EXP.GNFS.ZS",
  IMPORT: "NE.IMP.GNFS.ZS",
} as const;

export interface WorldBankProjectHit {
  id: string;
  project_name: string;
  countryshortname?: string;
  status?: string;
  url?: string;
  boardapprovaldate?: string;
}

/** World Bank Projects & Operations 검색 (입찰/프로젝트 정보) */
export async function fetchProjectsSearch(
  params: { countryCode?: string; keyword?: string; perPage?: number } = {}
): Promise<WorldBankProjectHit[]> {
  const perPage = Math.min(50, params.perPage ?? 10);
  const url = new URL(`${SEARCH_BASE}/projects`);
  url.searchParams.set("format", "json");
  url.searchParams.set("rows", String(perPage));
  if (params.countryCode) url.searchParams.set("countrycode", params.countryCode);
  if (params.keyword) url.searchParams.set("q", params.keyword);
  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const data = await res.json();
    const list = data?.projects ?? data?.response ?? data;
    if (!Array.isArray(list)) return [];
    return list.map((p: Record<string, unknown>) => ({
      id: String(p.id ?? p.projectid ?? ""),
      project_name: String(p.project_name ?? p.projectname ?? p.title ?? ""),
      countryshortname: p.countryshortname != null ? String(p.countryshortname) : undefined,
      status: p.status != null ? String(p.status) : undefined,
      url: p.url != null ? String(p.url) : undefined,
      boardapprovaldate: p.boardapprovaldate != null ? String(p.boardapprovaldate) : undefined,
    }));
  } catch {
    return [];
  }
}
