/**
 * OECD Stat API (무료, 60 req/hour 제한)
 * SDMX-JSON: https://stats.oecd.org/SDMX-JSON/data/
 * 예: dataset KEYINDICATORS, 주기·국가 필터
 */

const BASE = "https://stats.oecd.org/SDMX-JSON/data";

export interface OecdDataPoint {
  period: string;
  value: number | null;
  subject?: string;
}

/**
 * OECD 데이터셋 조회 (간단한 구조 가정).
 * dataset: KEYINDICATORS, BLI 등. dimension: LOCATION, TIME, SUBJECT 등.
 */
export async function fetchOecdDataset(
  dataset: string,
  options: { country?: string; subject?: string; limit?: number } = {}
): Promise<OecdDataPoint[]> {
  const limit = Math.min(50, options.limit ?? 10);
  const loc = options.country ?? "KOR";
  const url = `${BASE}/${dataset}/${loc}/?contentType=json&dimensionAtObservation=AllDimensions`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const json = await res.json();
    const dataSets = json?.dataSets ?? [];
    const out: OecdDataPoint[] = [];
    for (const ds of dataSets) {
      const observations = ds?.observations ?? {};
      for (const key of Object.keys(observations).slice(0, limit)) {
        const obs = observations[key];
        const val = Array.isArray(obs) ? obs[0] : obs?.value ?? obs;
        out.push({
          period: key,
          value: typeof val === "number" ? val : null,
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

/** 자주 쓰는 데이터셋 ID */
export const OECD_DATASETS = {
  KEYINDICATORS: "Key indicators",
  GDP: "GDP",
  QNA: "Quarterly National Accounts",
} as const;
