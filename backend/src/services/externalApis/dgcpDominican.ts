/**
 * DGCP (도미니카공화국 정부조달) — Dirección General de Contrataciones Públicas
 * 오픈데이터 API: https://www.dgcp.gob.do/datos-abiertos/api/
 * OCDS(Open Contracting Data Standard) 호환. 환경변수 DGCP_API_BASE 로 base URL 변경 가능.
 */

const DEFAULT_BASE = "https://www.dgcp.gob.do/datos-abiertos/api";

function getBaseUrl(): string {
  const base = (process.env.DGCP_API_BASE ?? DEFAULT_BASE).trim();
  return base || DEFAULT_BASE;
}

export interface DgcpReleaseItem {
  ocid?: string;
  id?: string;
  date?: string;
  tag?: string[];
  initiationType?: string;
  parties?: Array<{ id?: string; name?: string; roles?: string[] }>;
  tender?: { id?: string; title?: string; status?: string; value?: { amount?: number; currency?: string }; items?: unknown[] };
  awards?: Array<{ id?: string; status?: string; value?: { amount?: number }; suppliers?: Array<{ name?: string }> }>;
}

export interface DgcpSearchResult {
  releases: DgcpReleaseItem[];
  total?: number;
  nextOffset?: number;
}

/**
 * 정부조달 데이터 검색 (프로세스·입찰·계약).
 * limit, offset(또는 cursor) 및 선택적 날짜/키워드 지원.
 * API 미공개 시 빈 배열 반환.
 */
export async function fetchDgcpReleases(options: {
  limit?: number;
  offset?: number;
  updatedFrom?: string;
  updatedTo?: string;
  q?: string;
} = {}): Promise<DgcpSearchResult> {
  const base = getBaseUrl();
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const offset = Math.max(0, options.offset ?? 0);
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  if (options.updatedFrom) params.set("updatedFrom", options.updatedFrom);
  if (options.updatedTo) params.set("updatedTo", options.updatedTo);
  if (options.q) params.set("q", options.q.slice(0, 200));
  const url = `${base.replace(/\/$/, "")}/releases?${params.toString()}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { releases: [] };
    const json = await res.json();
    if (Array.isArray(json)) return { releases: json.slice(0, limit), total: json.length };
    const releases = json?.releases ?? json?.data ?? [];
    const arr = Array.isArray(releases) ? releases : [];
    return {
      releases: arr.map(normalizeRelease),
      total: json?.total ?? json?.count ?? arr.length,
      nextOffset: arr.length === limit ? offset + limit : undefined,
    };
  } catch {
    return { releases: [] };
  }
}

function normalizeRelease(r: unknown): DgcpReleaseItem {
  const o = (r as Record<string, unknown>) ?? {};
  return {
    ocid: o.ocid as string | undefined,
    id: (o.id ?? o.releaseID) as string | undefined,
    date: (o.date ?? o.releaseDate) as string | undefined,
    tag: Array.isArray(o.tag) ? (o.tag as string[]) : undefined,
    initiationType: o.initiationType as string | undefined,
    parties: o.parties as DgcpReleaseItem["parties"],
    tender: o.tender as DgcpReleaseItem["tender"],
    awards: o.awards as DgcpReleaseItem["awards"],
  };
}
