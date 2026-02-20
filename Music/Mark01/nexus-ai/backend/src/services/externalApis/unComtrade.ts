/**
 * UN Comtrade API (무료, 토큰 없이 1 req/s, 100 req/hour 제한)
 * https://comtrade.un.org/data/doc/api/
 * type=C(commodity), freq=A(annual), px=HS, ps=year, r=reporter, p=partner, rg=1(import)|2(export), cc=HS code
 */

/** Legacy API (무료, 1 req/s 제한). 문서: https://comtrade.un.org/data/doc/api/ */
const BASE = "https://comtrade.un.org/api/get";

/** Reporter/Partner: ISO3 (643=Russia, 840=USA, 410=Korea). max 25000 without token */
export interface ComtradeQueryParams {
  type?: "C" | "S"; // C=commodity, S=service
  freq?: "A" | "M"; // A=annual, M=monthly
  px?: "HS" | "SITC";
  ps: string; // period: 2022 or 202201
  r?: string;  // reporter ISO3 (또는 countryCode로 대체)
  p?: string; // partner (0=all)
  rg?: 1 | 2; // 1=import, 2=export
  cc?: string; // commodity code (TOTAL or HS 4/6 digit)
  maxRecords?: number;
}

export interface ComtradeDataRow {
  type: string;
  freqCode: string;
  refYear: string;
  period: string;
  refMonth: string;
  periodCode: string;
  reporterCode: number;
  reporterDesc: string;
  flowCode: string;
  flowDesc: string;
  partnerCode: number;
  partnerDesc: string;
  partner2Code: number;
  partner2Desc: string;
  customsCode: string;
  customsDesc: string;
  customsProcCode: string;
  customsProcDesc: string;
  aggrLevel: number;
  customsCodeDesc: string;
  cmdCode: string;
  cmdDesc: string;
  qtyUnitCode: number;
  qtyUnitAbbr: string;
  qty: number;
  isQtyEstimated: boolean;
  altQtyUnitCode: number;
  altQtyUnitAbbr: string;
  altQty: number;
  isAltQtyEstimated: boolean;
  netWgt: number;
  isNetWgtEstimated: boolean;
  cifvalue: number;
  fobvalue: number;
  primaryValue: number;
  legacyEstimationFlag: string;
}

export interface ComtradeResponse {
  data?: ComtradeDataRow[];
  count?: number;
}

const COUNTRY_ISO2_TO_ISO3: Record<string, string> = {
  KR: "410", US: "840", JP: "392", CN: "156", DE: "276", GB: "826", FR: "724",
  MX: "484", BR: "076", IN: "356", VN: "704", DO: "214", PA: "591",
};

function toReporterCode(countryCode: string): string {
  const upper = (countryCode || "").toUpperCase().slice(0, 2);
  return COUNTRY_ISO2_TO_ISO3[upper] ?? "0";
}

/** 무역 통계 조회 (수출/수입). 국가코드 2자리 사용 가능 */
export async function fetchTradeData(params: ComtradeQueryParams & { countryCode?: string }): Promise<ComtradeDataRow[]> {
  const r = params.r || (params.countryCode ? toReporterCode(params.countryCode) : "0");
  if (r === "0") return [];
  const url = new URL(BASE);
  url.searchParams.set("type", params.type ?? "C");
  url.searchParams.set("freq", params.freq ?? "A");
  url.searchParams.set("px", params.px ?? "HS");
  url.searchParams.set("ps", params.ps);
  url.searchParams.set("r", r);
  url.searchParams.set("p", params.p ?? "0");
  url.searchParams.set("rg", String(params.rg ?? 2));
  url.searchParams.set("cc", params.cc ?? "TOTAL");
  url.searchParams.set("maxRecords", String(Math.min(500, params.maxRecords ?? 50)));
  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const json = (await res.json()) as ComtradeResponse;
    const data = json?.data;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
