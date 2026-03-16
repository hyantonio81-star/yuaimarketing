/**
 * Google Custom Search JSON API (무료 100회/일, 초과 시 유료)
 * 환경변수: GOOGLE_API_KEY, GOOGLE_CSE_ID (Programmable Search Engine ID)
 * 참고: 2027년 1월 서비스 종료 예정이므로 신규는 SerpApi 등 대안 권장
 */

const BASE = "https://www.googleapis.com/customsearch/v1";

function getConfig(): { apiKey: string; cseId: string } | null {
  const apiKey = (process.env.GOOGLE_API_KEY ?? "").trim();
  const cseId = (process.env.GOOGLE_CSE_ID ?? process.env.GOOGLE_CX ?? "").trim();
  if (!apiKey || !cseId) return null;
  return { apiKey, cseId };
}

export interface GoogleSearchItem {
  title: string;
  link: string;
  snippet?: string;
  displayLink?: string;
}

/** Custom Search (무료 100쿼리/일). API 키 + CSE ID 필요 */
export async function customSearch(
  q: string,
  options: { num?: number; start?: number; country?: string; lang?: string } = {}
): Promise<{ items: GoogleSearchItem[]; totalResults?: number; nextStartIndex?: number }> {
  const config = getConfig();
  if (!config) return { items: [] };
  const num = Math.min(10, Math.max(1, options.num ?? 10));
  const start = Math.max(1, options.start ?? 1);
  const url = new URL(BASE);
  url.searchParams.set("key", config.apiKey);
  url.searchParams.set("cx", config.cseId);
  url.searchParams.set("q", q.slice(0, 300));
  url.searchParams.set("num", String(num));
  url.searchParams.set("start", String(start));
  if (options.country) url.searchParams.set("cr", `country${options.country.toUpperCase().slice(0, 2)}`);
  if (options.lang) url.searchParams.set("hl", options.lang);
  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return { items: [] };
    const json = await res.json();
    const items = (json?.items ?? []).map((o: { title?: string; link?: string; snippet?: string; displayLink?: string }) => ({
      title: String(o?.title ?? ""),
      link: String(o?.link ?? ""),
      snippet: o?.snippet != null ? String(o.snippet) : undefined,
      displayLink: o?.displayLink != null ? String(o.displayLink) : undefined,
    }));
    const totalResults = json?.searchInformation?.totalResults != null ? parseInt(String(json.searchInformation.totalResults), 10) : undefined;
    const nextStartIndex = json?.queries?.nextPage?.[0]?.startIndex;
    return { items, totalResults, nextStartIndex };
  } catch {
    return { items: [] };
  }
}
