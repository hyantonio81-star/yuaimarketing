/**
 * CompanyAgent: OpenCorporates 기반 기업 검색
 * 파이프라인에서 세분화 분석의 관련 업체(related_companies) 추천에 사용된다.
 */

import { searchCompanies } from "../externalApis/opencorporates.js";
import type { CompanyAgentResult } from "./types.js";

/**
 * 키워드·국가 기준 기업 검색 (OpenCorporates)
 */
export async function runCompanyAgent(params: {
  query: string;
  jurisdictionCode: string;
  perPage?: number;
}): Promise<CompanyAgentResult> {
  const query = (params.query || "trading").trim().slice(0, 200);
  const jurisdictionCode = (params.jurisdictionCode || "").trim().toLowerCase();
  const perPage = Math.min(30, params.perPage ?? 5);

  const companies = await searchCompanies(query, { jurisdictionCode, perPage });

  return {
    companies,
    query,
    jurisdictionCode: jurisdictionCode || "",
  };
}
