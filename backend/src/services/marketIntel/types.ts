/** 데이터 소스 유형 */
export type DataSourceType = "free_api" | "paid_api" | "site" | "rss";

/** 가격대 */
export type DataSourcePriceTier = "free" | "low" | "mid";

/** 소스 카테고리 (소셜·리뷰 / 무역·산업 / 제조·상공회의소 / 수출지원·공고 / 경제·지표 / 뉴스 / B2B·B2C / LATAM B2B / 연락처·디렉토리) */
export type DataSourceCategory = "social_reviews" | "trade_industry" | "manufacturing" | "export_promotion" | "economic" | "news" | "b2b_b2c" | "latam_b2b" | "directory_contact";

export interface DataSource {
  id: string;
  name: string;
  description: string;
  category?: DataSourceCategory;
  type?: DataSourceType;
  price_tier?: DataSourcePriceTier;
  purpose?: string;
  url?: string;
  b2b_b2c?: "b2b" | "b2c" | "both";
  /** 백엔드 API 연동 여부 (연동 시 true) */
  connected?: boolean;
}

export interface AnalysisTech {
  name: string;
  description: string;
}

/** 결과물 유형: placeholder=메타만(파이프라인 예정), segmented/news_summary/report=실제 아웃풋 */
export type ResultOutputType = "placeholder" | "segmented" | "news_summary" | "report";

export interface ResultOutput {
  id: string;
  title: string;
  period: string;
  /** 실제 연동 아웃풋 여부 (segmented/news_summary/report 시 프론트에서 보기 링크 표시) */
  output_type?: ResultOutputType;
  /** 결과물 섹션 앵커 또는 액션 (예: #market-intel-segmented) */
  action_path?: string;
}

/** 시장조사 툴 (데이터 수집·접근 도구) */
export interface MarketResearchTool {
  id: string;
  name: string;
  description: string;
  category: "social" | "reviews" | "search" | "trade" | "official";
}

/** 시장조사 서비스 (수집 → 분석 → 인사이트 흐름) */
export interface MarketResearchService {
  id: string;
  name: string;
  description: string;
  step: 1 | 2 | 3; // 1=수집, 2=분석, 3=인사이트
}

export type ReportLanguage = "ko" | "en" | "es";

/** 세분화 분석 조사유형 */
export type ResearchType = "import" | "export" | "distribution" | "consumption" | "manufacturing";

/** 세분화 분석의뢰 요청 (국가·아이템·HS·조사유형) */
export interface GranularAnalysisRequest {
  country_code: string;
  item: string;
  hs_code: string;
  research_types: ResearchType[];
}

/** 시장 장악 포인트 (조사유형별 상위 업체·지표) */
export interface MarketDominancePoint {
  research_type: ResearchType;
  /** API 응답용: 현재 언어의 조사유형 라벨 */
  research_type_label?: string;
  metric: string;
  top_players: { name: string; share_or_value: string; description?: string }[];
}

/** 관련 업체 추천 (연락처 출처·수집일 명시) */
export interface RecommendedCompany {
  company_name: string;
  country_code: string;
  products_or_hs: string;
  contact?: { email?: string; phone?: string; source: string; as_of: string };
  reason: string;
}

/** 1~3위 업체 상세 (1업체 1페이지 요약용) */
export interface TopCompanyDetail {
  rank: number;
  company_name: string;
  country_code: string;
  products_or_hs: string;
  /** 업체 유형 (제조·도매·수입·유통 등) */
  company_type?: string;
  contact?: { source: string; as_of: string; url?: string; company_number?: string; incorporation_date?: string };
  /** 해당 국가의 수입/수출 규모 문구 (Comtrade 기반) */
  trade_note?: string;
  /** 고객 거주지(대상국)에서의 제품·시장 점유/선호 문구 */
  product_preference_region?: string;
  reason: string;
}

/** 데이터소스 API 보강 결과 (DGCP·IMF·OECD·UNIDO 등) */
export interface SupplementaryResearchData {
  dgcp?: { releases: unknown[]; total?: number };
  imf?: unknown[];
  oecd?: unknown[];
  unido?: unknown[];
}

/** 세분화 분석 결과 (시장 장악 + 관련 업체 리스트 + 근거 데이터소스 + 선택 소스 보강) */
export interface SegmentedAnalysisResult {
  request: GranularAnalysisRequest;
  market_dominance: MarketDominancePoint[];
  related_companies: RecommendedCompany[];
  /** 결과 산출에 사용된 데이터 소스 (무역통계·경제지표·업체 DB 등) */
  data_sources_used?: string[];
  /** 데이터소스 API에서 검색·수집한 보강 데이터 (DGCP·IMF·OECD·UNIDO) */
  supplementary_data?: SupplementaryResearchData;
}

/** 리포트 등급 (상세도·분량) */
export type ReportTier = "medium" | "high" | "highest";

/** 시장 리포트 출력 옵션 */
export interface MarketReportOutputOptions {
  format: "pdf" | "word" | "docx" | "excel" | "json";
  scope: "country" | "industry" | "item" | "full";
  schedule: "once" | "weekly" | "monthly";
  sections: string[];
  /** 리포트 생성 시 사용할 언어 (리포트 본문·헤더 등) */
  language?: ReportLanguage;
  /** 등급: 중/고/최고 (상세도·표/차트 수) */
  report_tier?: ReportTier;
  /** 희망 페이지 수 (리포트 분량) */
  target_page_count?: number;
  /** 레이아웃 템플릿 (표준 등) */
  layout_template?: string;
}

/** 시장 국가별 뉴스 요약 */
export interface NewsSummaryItem {
  title: string;
  summary: string;
  source: string;
  url?: string;
  b2b_b2c: "b2b" | "b2c" | "both";
  date?: string;
}

/** 의뢰 진행: 세분화 의뢰 저장 → 시장조사 + 국가 뉴스를 한 번에 반환 */
export interface RunResearchResult {
  request: GranularAnalysisRequest;
  segmented_result: SegmentedAnalysisResult;
  news_items: NewsSummaryItem[];
}
