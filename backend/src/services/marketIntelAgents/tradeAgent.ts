/**
 * TradeAgent: UN Comtrade 기반 무역 데이터 (HS 코드별 수출/수입)
 * 파이프라인에서 세분화 분석의 수출·수입 top players 근거로 사용된다.
 */

import { fetchTradeData } from "../externalApis/unComtrade.js";
import type { TradeAgentResult } from "./types.js";

const DEFAULT_YEAR = String(new Date().getFullYear() - 1);

/** HS 코드가 4자리 또는 6자리 숫자면 사용, 아니면 TOTAL(전품목) */
function normalizeHsCode(hsCode: string | undefined): string {
  const s = String(hsCode ?? "").trim();
  return /^\d{4}(\d{2})?$/.test(s) ? s : "TOTAL";
}

/**
 * 국가·연도·HS코드 기준 수출/수입 데이터 조회
 */
export async function runTradeAgent(params: {
  countryCode: string;
  year?: string;
  hsCode?: string;
}): Promise<TradeAgentResult> {
  const country = (params.countryCode || "").trim().toUpperCase().slice(0, 2);
  const year = params.year || DEFAULT_YEAR;
  const cc = normalizeHsCode(params.hsCode);

  if (!country) {
    return { exportData: [], importData: [], year, countryCode: "", hsCode: cc };
  }

  const [exportData, importData] = await Promise.all([
    fetchTradeData({ ps: year, countryCode: country, rg: 2, maxRecords: 20, cc }),
    fetchTradeData({ ps: year, countryCode: country, rg: 1, maxRecords: 20, cc }),
  ]);

  return {
    exportData,
    importData,
    year,
    countryCode: country,
    hsCode: cc,
  };
}
