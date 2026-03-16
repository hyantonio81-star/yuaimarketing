/**
 * NewsAgent: 국가별 뉴스 요약 (NewsData.io → Mediastack → RSS 폴백)
 * 파이프라인에서 리포트의 뉴스 섹션을 채운다.
 */

import { getMarketNewsSummaryAsync } from "../marketIntelService.js";
import type { ReportLanguage } from "./types.js";

/**
 * 국가·언어 기준 시장 뉴스 요약 조회
 */
export async function runNewsAgent(params: {
  countryCode: string;
  lang?: ReportLanguage;
}): Promise<Awaited<ReturnType<typeof getMarketNewsSummaryAsync>>> {
  const countryCode = (params.countryCode || "US").trim();
  const lang = params.lang ?? "ko";
  return getMarketNewsSummaryAsync(countryCode, lang);
}
