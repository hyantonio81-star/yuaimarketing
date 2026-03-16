/**
 * 시장 인텔 에이전트 팀 공통 타입
 * 각 에이전트는 단일 책임(무역/기업/뉴스 등)을 수행하고 결과를 반환한다.
 */

import type { ComtradeDataRow } from "../externalApis/unComtrade.js";
import type { OpenCorporatesCompany } from "../externalApis/opencorporates.js";
import type { ReportLanguage } from "../marketIntelService.js";

export type { ReportLanguage };

/** TradeAgent 출력: Comtrade 수출/수입 행 */
export interface TradeAgentResult {
  exportData: ComtradeDataRow[];
  importData: ComtradeDataRow[];
  year: string;
  countryCode: string;
  hsCode: string;
}

/** CompanyAgent 출력: OpenCorporates 검색 결과 */
export interface CompanyAgentResult {
  companies: OpenCorporatesCompany[];
  query: string;
  jurisdictionCode: string;
}

/** NewsAgent 출력은 marketIntelService.NewsSummaryItem[] 와 동일 (supervisor에서 사용) */
