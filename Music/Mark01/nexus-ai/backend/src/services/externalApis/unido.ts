/**
 * UNIDO Statistics Portal API (무료)
 * https://stat.unido.org/unido-statistics-portal-api
 * GET 메타데이터, POST getData / getDataWithoutActivities
 */

const BASE = "https://stat.unido.org/api";

export interface UnidoDataPoint {
  period: string;
  value: number | null;
  country?: string;
  variable?: string;
}

/** 제조업/산업 통계 (CIP 등 활동 없는 데이터셋). datasetId 예: CIP */
export async function fetchUnidoData(
  datasetId: string,
  options: { countryCode?: string; variableCodes?: string[]; limit?: number } = {}
): Promise<UnidoDataPoint[]> {
  const limit = Math.min(50, options.limit ?? 10);
  try {
    const body: Record<string, unknown> = {
      datasetId,
      countryCode: options.countryCode ?? "156", // 156=China, 410=Korea
      variableCodes: options.variableCodes ?? [],
      periods: ["2020", "2021", "2022"].slice(0, Math.ceil(limit / 2)),
    };
    const res = await fetch(`${BASE}/getDataWithoutActivities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const rows = json?.data ?? json?.observations ?? [];
    if (!Array.isArray(rows)) return [];
    return rows.slice(0, limit).map((r: Record<string, unknown>) => ({
      period: String(r.period ?? r.year ?? ""),
      value: typeof r.value === "number" ? r.value : null,
      country: r.countryCode != null ? String(r.countryCode) : undefined,
      variable: r.variableCode != null ? String(r.variableCode) : undefined,
    }));
  } catch {
    return [];
  }
}
