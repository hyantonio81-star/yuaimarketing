/**
 * SerpApi (유료) — Google 검색 / Google Trends 스크래핑
 * 환경변수 SERPAPI_KEY 설정 시 사용
 * https://serpapi.com/google-trends-api
 */

const BASE = "https://serpapi.com/search";

function getApiKey(): string | null {
  const key = (process.env.SERPAPI_KEY ?? process.env.SERP_API_KEY ?? "").trim();
  return key || null;
}

export interface SerpApiTrendsPoint {
  date: string;
  value: number | null;
  /** 다중 쿼리 시 키워드별 값 */
  values?: Record<string, number | null>;
}

export interface SerpApiTrendsResult {
  keyword: string;
  keywords?: string[];
  data_type: string;
  timeline: SerpApiTrendsPoint[];
  related_topics?: unknown[];
  related_queries?: unknown[];
}

/** Google Trends (관심도 시계열). API 키 필요(유료) */
export async function getGoogleTrends(
  q: string,
  options: { data_type?: "TIMESERIES" | "GEO_MAP" | "GEO_MAP_0" | "RELATED_TOPICS" | "RELATED_QUERIES"; geo?: string; hl?: string; limit?: number } = {}
): Promise<SerpApiTrendsResult | null> {
  const key = getApiKey();
  if (!key) return null;
  const url = new URL(BASE);
  url.searchParams.set("engine", "google_trends");
  url.searchParams.set("api_key", key);
  url.searchParams.set("q", q.slice(0, 100));
  if (options.data_type) url.searchParams.set("data_type", options.data_type);
  if (options.geo) url.searchParams.set("geo", options.geo);
  if (options.hl) url.searchParams.set("hl", options.hl);
  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const json = await res.json();
    const interest = json?.interest_over_time ?? json?.timeline_data ?? [];
    const timeline = Array.isArray(interest)
      ? interest.slice(0, options.limit ?? 90).map((p: { date?: string; values?: Array<{ value?: string; query?: string }>; value?: number }) => {
          const values = p?.values;
          const value = typeof p?.value === "number" ? p.value : (Array.isArray(values) && values[0]) ? parseInt(String(values[0]?.value ?? 0), 10) : null;
          const valuesMap: Record<string, number | null> = {};
          if (Array.isArray(values)) values.forEach((v: { query?: string; value?: string }) => { valuesMap[v?.query ?? ""] = v?.value != null ? parseInt(String(v.value), 10) : null; });
          return { date: String(p?.date ?? ""), value: value ?? null, values: Object.keys(valuesMap).length ? valuesMap : undefined };
        })
      : [];
    return {
      keyword: q,
      data_type: options.data_type ?? "TIMESERIES",
      timeline,
      related_topics: json?.related_topics,
      related_queries: json?.related_queries,
    };
  } catch {
    return null;
  }
}

export interface SerpApiSearchResultItem {
  title: string;
  link: string;
  snippet?: string;
  position?: number;
}

/** Google 검색 결과 (SerpApi). API 키 필요(유료) */
export async function getGoogleSearch(
  q: string,
  options: { num?: number; country?: string; hl?: string } = {}
): Promise<{ items: SerpApiSearchResultItem[]; total?: number }> {
  const key = getApiKey();
  if (!key) return { items: [] };
  const url = new URL(BASE);
  url.searchParams.set("engine", "google");
  url.searchParams.set("api_key", key);
  url.searchParams.set("q", q.slice(0, 300));
  if (options.num) url.searchParams.set("num", String(Math.min(20, options.num)));
  if (options.country) url.searchParams.set("gl", options.country);
  if (options.hl) url.searchParams.set("hl", options.hl);
  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { items: [] };
    const json = await res.json();
    const organic = json?.organic_results ?? [];
    const items = organic.slice(0, options.num ?? 10).map((o: { title?: string; link?: string; snippet?: string; position?: number }, i: number) => ({
      title: String(o?.title ?? ""),
      link: String(o?.link ?? ""),
      snippet: o?.snippet != null ? String(o.snippet) : undefined,
      position: o?.position ?? i + 1,
    }));
    return { items, total: json?.search_information?.total_results ?? undefined };
  } catch {
    return { items: [] };
  }
}
