/**
 * Mediastack API — 7,500+ 소스 실시간 뉴스, 국가별 필터.
 * MEDIASTACK_ACCESS_KEY 환경 변수 필요.
 */

export interface MediastackArticle {
  author?: string;
  title?: string;
  description?: string;
  url?: string;
  source?: string;
  image?: string;
  category?: string;
  language?: string;
  country?: string;
  published_at?: string;
}

export interface MediastackResponse {
  pagination?: { limit: number; offset: number; count: number; total: number };
  data?: MediastackArticle[];
}

export interface NewsSummaryLike {
  title: string;
  summary: string;
  source: string;
  url?: string;
  b2b_b2c: "b2b" | "b2c" | "both";
  date?: string;
}

const API_BASE = "http://api.mediastack.com/v1";

function normalizeCountry(countryCode: string): string {
  const c = (countryCode || "").trim().toLowerCase();
  if (c.length === 2) return c;
  const map: Record<string, string> = {
    DO: "do", MX: "mx", BR: "br", CO: "co", PE: "pe", CL: "cl", PA: "pa",
    US: "us", KR: "kr", AR: "ar", EC: "ec", GT: "gt", PR: "pr",
  };
  return map[countryCode?.toUpperCase() ?? ""] ?? c.slice(0, 2);
}

/**
 * 국가별 뉴스 수집. 여러 국가 쉼표 구분 가능.
 */
export async function fetchMediastackNews(
  countryCodes: string | string[],
  options: { limit?: number; languages?: string } = {}
): Promise<NewsSummaryLike[]> {
  const key = (process.env.MEDIASTACK_ACCESS_KEY ?? "").trim();
  if (!key) return [];

  const countries = Array.isArray(countryCodes)
    ? countryCodes.map(normalizeCountry).filter(Boolean).join(",")
    : normalizeCountry(countryCodes);
  if (!countries) return [];

  const limit = Math.min(50, Math.max(1, options.limit ?? 15));
  const params = new URLSearchParams({
    access_key: key,
    countries,
    limit: String(limit),
    ...(options.languages ? { languages: options.languages } : {}),
  });

  try {
    const url = `${API_BASE}/news?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as MediastackResponse;
    const list = data.data ?? [];
    return list.map((a) => ({
      title: (a.title ?? "").trim() || "Untitled",
      summary: (a.description ?? "").trim().slice(0, 400),
      source: (a.source ?? "Mediastack").trim(),
      url: a.url?.trim(),
      b2b_b2c: "both" as const,
      date: a.published_at ? new Date(a.published_at).toISOString().slice(0, 10) : undefined,
    }));
  } catch {
    return [];
  }
}
