/**
 * FRED (Federal Reserve Economic Data) API
 * 무료 API 키: https://fredaccount.stlouisfed.org/apikeys
 * 환경변수 FRED_API_KEY 설정 시에만 호출 (미설정 시 빈 배열 반환)
 */

const BASE = "https://api.stlouisfed.org/fred";

function getApiKey(): string | null {
  try {
    return (process.env.FRED_API_KEY ?? "").trim() || null;
  } catch {
    return null;
  }
}

export interface FredSeriesPoint {
  date: string;
  value: string;
}

/** 시계열 데이터 조회 (예: GDP, 금리). API 키 필요 */
export async function fetchSeries(
  seriesId: string,
  options: { limit?: number; observationStart?: string } = {}
): Promise<FredSeriesPoint[]> {
  const key = getApiKey();
  if (!key) return [];
  const limit = Math.min(100, options.limit ?? 10);
  const url = new URL(`${BASE}/series/observations`);
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("api_key", key);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("limit", String(limit));
  if (options.observationStart) url.searchParams.set("observation_start", options.observationStart);
  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const json = await res.json();
    const obs = json?.observations ?? [];
    return Array.isArray(obs)
      ? obs.map((o: { date?: string; value?: string }) => ({ date: String(o.date ?? ""), value: String(o.value ?? "") }))
      : [];
  } catch {
    return [];
  }
}

/** 인기 시계열 ID 예시 */
export const FRED_SERIES_IDS = {
  GDP: "GDP",
  FED_FUNDS: "FEDFUNDS",
  CPI: "CPIAUCSL",
  UNEMPLOYMENT: "UNRATE",
} as const;
