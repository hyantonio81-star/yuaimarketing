/**
 * IMF Data API (무료, API 키 불필요)
 * DataMapper: https://www.imf.org/external/datamapper/api/help
 * 예: /weo/{country}/{indicator} → NGDPD(GDP), PCPIPCH(인플레이션) 등
 */

const BASE = "https://www.imf.org/external/datamapper/api";

export interface ImfSeriesPoint {
  year: string;
  value: number | null;
}

/** WEO(World Economic Outlook) 지표. country: ISO2 (USA, KOR 등) */
export async function fetchWeoIndicator(
  countryCode: string,
  indicator: string,
  limit = 10
): Promise<ImfSeriesPoint[]> {
  const country = countryCode.length === 2 ? (countryCode === "KR" ? "KOR" : countryCode.toUpperCase()) : countryCode.toUpperCase();
  const url = `${BASE}/weo/${country}/${indicator}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();
    let raw = data?.[country]?.[indicator] ?? data?.values ?? data;
    if (typeof raw !== "object" || raw === null) return [];
    const entries = Array.isArray(raw) ? raw : Object.entries(raw);
    const out: ImfSeriesPoint[] = [];
    for (const p of entries.slice(0, limit)) {
      if (Array.isArray(p)) {
        const v = p[1];
        out.push({ year: String(p[0]), value: typeof v === "number" ? v : null });
      } else if (typeof p === "object" && p !== null && "year" in p) {
        const o = p as { year: unknown; value: unknown };
        out.push({ year: String(o.year), value: typeof o.value === "number" ? o.value : null });
      }
    }
    return out.sort((a, b) => b.year.localeCompare(a.year));
  } catch {
    return [];
  }
}

/** 자주 쓰는 WEO 지표 코드 */
export const IMF_WEO_INDICATORS = {
  NGDPD: "GDP (current prices)",
  NGDP_R: "GDP (constant prices)",
  PCPIPCH: "Inflation (annual %)",
  LUR: "Unemployment (%)",
  GGR_GDP: "Government revenue (% GDP)",
  GGD_GDP: "Government debt (% GDP)",
} as const;
