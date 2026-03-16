/**
 * NewsData.io API — 중남미·전세계 200+국 뉴스, 국가별 필터.
 * NEWSDATA_API_KEY 환경 변수 필요.
 */

export interface NewsDataIoArticle {
  article_id?: string;
  title?: string;
  link?: string;
  description?: string;
  content?: string;
  pubDate?: string;
  source_id?: string;
  source_url?: string;
  source_name?: string;
  source_priority?: number;
  country?: string[];
  category?: string[];
  language?: string;
  sentiment?: string;
}

export interface NewsDataIoResponse {
  status?: string;
  totalResults?: number;
  results?: NewsDataIoArticle[];
  nextPage?: string;
}

export interface NewsSummaryLike {
  title: string;
  summary: string;
  source: string;
  url?: string;
  b2b_b2c: "b2b" | "b2c" | "both";
  date?: string;
}

const API_BASE = "https://newsdata.io/api/1";

/** ISO 2자리 국가 코드로 NewsData.io country 파라미터 (소문자) */
function normalizeCountry(countryCode: string): string {
  const c = (countryCode || "").trim().toLowerCase();
  if (c.length === 2) return c;
  const map: Record<string, string> = {
    DO: "do", MX: "mx", BR: "br", CO: "co", PE: "pe", CL: "cl", PA: "pa",
    US: "us", KR: "kr", AR: "ar", EC: "ec", GT: "gt", CU: "cu", PR: "pr",
  };
  return map[countryCode?.toUpperCase() ?? ""] ?? c.slice(0, 2);
}

/**
 * 국가별 뉴스 헤드라인 수집. 키 없으면 빈 배열.
 */
export async function fetchNewsDataIo(
  countryCode: string,
  options: { limit?: number; language?: string; category?: string } = {}
): Promise<NewsSummaryLike[]> {
  const key = (process.env.NEWSDATA_API_KEY ?? "").trim();
  if (!key) return [];

  const country = normalizeCountry(countryCode);
  const limit = Math.min(50, Math.max(1, options.limit ?? 15));
  const params = new URLSearchParams({
    apikey: key,
    country,
    ...(options.language ? { language: options.language } : {}),
    ...(options.category ? { category: options.category } : {}),
  });

  try {
    const url = `${API_BASE}/news?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as NewsDataIoResponse;
    const results = data.results ?? [];
    return results.slice(0, limit).map((a) => ({
      title: (a.title ?? "").trim() || "Untitled",
      summary: (a.description ?? a.content ?? "").trim().slice(0, 400),
      source: (a.source_name ?? a.source_id ?? "NewsData.io").trim(),
      url: a.link?.trim(),
      b2b_b2c: "both" as const,
      date: a.pubDate ? new Date(a.pubDate).toISOString().slice(0, 10) : undefined,
    }));
  } catch {
    return [];
  }
}
