/**
 * Supervisor: 시장 인텔 파이프라인 오케스트레이터
 * 세분화 의뢰·옵션을 읽고, 세분화 분석(Comtrade+World Bank+OpenCorporates)과 뉴스 요약을 병렬 실행한 뒤
 * 리포트용 데이터를 한 번에 반환한다. 실패 시 부분 결과로 응답하며, 추후 DGCP/소셜/가격 등 에이전트 확장 가능.
 */

import {
  getMarketReportOptions,
  getGranularAnalysisRequest,
  getSegmentedAnalysisResultAsync,
  getMarketNewsSummaryAsync,
} from "../marketIntelService.js";
import type {
  ReportLanguage,
  GranularAnalysisRequest,
  SegmentedAnalysisResult,
  NewsSummaryItem,
  MarketReportOutputOptions,
} from "../marketIntel/types.js";

export interface SupervisorResult {
  request: GranularAnalysisRequest;
  segmentedResult: SegmentedAnalysisResult;
  newsItems: NewsSummaryItem[];
  options: MarketReportOutputOptions;
  lang: ReportLanguage;
}

/**
 * orgId·countryCode 기준 저장된 의뢰/옵션으로 시장 인텔 데이터 수집
 * (세분화 분석 = Trade+Company+World Bank, 뉴스 = NewsAgent)
 */
export async function runMarketIntelSupervisor(
  orgId: string,
  countryCode: string
): Promise<SupervisorResult> {
  const options = getMarketReportOptions(orgId, countryCode);
  const lang = (options.language ?? "ko") as ReportLanguage;
  const granularRequest = getGranularAnalysisRequest(orgId, countryCode);
  const request: GranularAnalysisRequest = granularRequest ?? {
    country_code: countryCode === "ALL" ? "" : countryCode,
    item: "",
    hs_code: "",
    research_types: ["import", "export"],
  };

  const [segmentedResult, newsItems] = await Promise.all([
    getSegmentedAnalysisResultAsync(request, lang),
    getMarketNewsSummaryAsync(request.country_code || countryCode || "US", lang),
  ]);

  return {
    request,
    segmentedResult,
    newsItems,
    options,
    lang,
  };
}
