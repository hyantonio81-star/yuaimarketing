/** 데이터 소스 유형 */
export type DataSourceType = "free_api" | "paid_api" | "site" | "rss";

/** 가격대 */
export type DataSourcePriceTier = "free" | "low" | "mid";

/** 소스 카테고리 (소셜·리뷰 / 무역·산업 / 제조·상공회의소 / 수출지원·공고 / 경제·지표 / 뉴스 / B2B·B2C) */
export type DataSourceCategory = "social_reviews" | "trade_industry" | "manufacturing" | "export_promotion" | "economic" | "news" | "b2b_b2c";

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
}

export interface AnalysisTech {
  name: string;
  description: string;
}

export interface ResultOutput {
  id: string;
  title: string;
  period: string;
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

/** 세분화 분석 결과 (시장 장악 + 관련 업체 리스트 + 근거 데이터소스) */
export interface SegmentedAnalysisResult {
  request: GranularAnalysisRequest;
  market_dominance: MarketDominancePoint[];
  related_companies: RecommendedCompany[];
  /** 결과 산출에 사용된 데이터 소스 (무역통계·경제지표·업체 DB 등) */
  data_sources_used?: string[];
}

/** 리포트 등급 (상세도·분량) */
export type ReportTier = "medium" | "high" | "highest";

/** 시장 리포트 출력 옵션 */
export interface MarketReportOutputOptions {
  format: "pdf" | "excel" | "json";
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

/** Data Sources: id·카테고리·유형·가격대·용도·링크 (무료/저가 API·업체 간추림) */
const SOURCES: DataSource[] = [
  // 소셜·리뷰·소셜 네트워크
  { id: "reddit_api", name: "Reddit API", description: "실시간 소비자 대화", category: "social_reviews", type: "free_api", price_tier: "free", purpose: "소비자 감정·테마", b2b_b2c: "b2c", url: "https://www.reddit.com/dev/api" },
  { id: "twitter_api", name: "Twitter/X API", description: "브랜드 멘션·트렌드", category: "social_reviews", type: "paid_api", price_tier: "low", purpose: "브랜드·이슈 모니터링", b2b_b2c: "both", url: "https://developer.twitter.com" },
  { id: "youtube_api", name: "YouTube Data API", description: "영상·댓글 반응", category: "social_reviews", type: "free_api", price_tier: "free", purpose: "영상 반응·트렌드", b2b_b2c: "b2c", url: "https://developers.google.com/youtube/v3" },
  { id: "facebook_api", name: "Facebook (Meta) Graph API", description: "페이지·공개 메타데이터·검색", category: "social_reviews", type: "paid_api", price_tier: "free", purpose: "브랜드 페이지·팔로워·소셜 트렌드", b2b_b2c: "both", url: "https://developers.facebook.com/docs/graph-api" },
  { id: "instagram_api", name: "Instagram Graph API", description: "비즈니스 계정·인사이트·미디어", category: "social_reviews", type: "paid_api", price_tier: "low", purpose: "인플루언서·소셜 커머스", b2b_b2c: "both", url: "https://developers.facebook.com/docs/instagram-api" },
  { id: "tiktok_business_api", name: "TikTok for Business API", description: "광고·캠페인·인사이트·상품", category: "social_reviews", type: "paid_api", price_tier: "low", purpose: "소셜 커머스·트렌드", b2b_b2c: "both", url: "https://business-api.tiktok.com" },
  { id: "social_commerce", name: "소셜 커머스", description: "Facebook Shop, Instagram Shopping, TikTok Shop·라이브커머스", category: "social_reviews", type: "site", price_tier: "free", purpose: "소셜 판매·UGC·리뷰", b2b_b2c: "b2c" },
  { id: "social_group_buying", name: "소셜 공동구매", description: "YouTube·Instagram·Facebook·TikTok·Pinterest·X·카카오·네이버 밴드 등 소셜 채널 공동구매·라이브·인플루언서 제휴", category: "social_reviews", type: "site", price_tier: "free", purpose: "공동구매·라이브커머스·제휴 판매", b2b_b2c: "b2c" },
  { id: "amazon_reviews", name: "Amazon Product/Reviews", description: "제품 리뷰·평점", category: "social_reviews", type: "paid_api", price_tier: "low", purpose: "제품 니즈·불만", b2b_b2c: "b2c" },
  { id: "app_store", name: "App Store / Play Store", description: "앱 리뷰·다운로드", category: "social_reviews", type: "site", price_tier: "free", purpose: "앱·서비스 피드백", b2b_b2c: "b2c" },
  { id: "quora", name: "Quora", description: "Q&A·니즈 패턴", category: "social_reviews", type: "site", price_tier: "free", purpose: "질문·관심 주제", b2b_b2c: "both" },
  // 무역·산업 (무료/저가 API)
  { id: "un_comtrade", name: "UN Comtrade", description: "HS·국가별 수출입", category: "trade_industry", type: "free_api", price_tier: "free", purpose: "무역 통계", b2b_b2c: "b2b", url: "https://comtradeplus.un.org" },
  { id: "wto_tariff", name: "WTO Tariff Download", description: "관세·규제 데이터", category: "trade_industry", type: "free_api", price_tier: "free", purpose: "관세·시장 접근", b2b_b2c: "b2b", url: "https://www.wto.org" },
  { id: "oecd_stat", name: "OECD Stat", description: "무역·산업 지표", category: "trade_industry", type: "free_api", price_tier: "free", purpose: "경제·무역 지표", b2b_b2c: "b2b", url: "https://stats.oecd.org" },
  { id: "world_bank", name: "World Bank Open Data", description: "무역·경제 데이터", category: "trade_industry", type: "free_api", price_tier: "free", purpose: "국가별 지표", b2b_b2c: "b2b", url: "https://data.worldbank.org" },
  // 제조·상공회의소
  { id: "unido", name: "UNIDO", description: "산업·제조 통계·생산지수", category: "manufacturing", type: "free_api", price_tier: "free", purpose: "제조업 생산·산업구조", b2b_b2c: "b2b", url: "https://stat.unido.org" },
  { id: "mapi", name: "MAPI (미 제조협회)", description: "제조업 지표·설비가동률", category: "manufacturing", type: "site", price_tier: "free", purpose: "제조 동향", b2b_b2c: "b2b", url: "https://www.mapi.net" },
  { id: "chambers", name: "각국 상공회의소", description: "KCCI·US Chamber·CAMEXA·FIESP 등", category: "manufacturing", type: "site", price_tier: "free", purpose: "회원사·산업별 보고서", b2b_b2c: "b2b" },
  { id: "invest_agencies", name: "각국 투자유치청", description: "Invest in XX, 산업단지 DB", category: "manufacturing", type: "site", price_tier: "free", purpose: "입지·제조업체 리스트", b2b_b2c: "b2b" },
  // 수출지원·공고 (각국 정부조달·수출진흥기관)
  { id: "compra_gobierno", name: "각국 COMPRA GOBIERNO", description: "정부조달·공공입찰 포털 (도미니카 Compra Nacional, 멕시코 CompraNet 등)", category: "export_promotion", type: "site", price_tier: "free", purpose: "공공입찰 공고", b2b_b2c: "b2b", url: "https://www.compranacional.gob.do" },
  { id: "dgcp_do", name: "DGCP (도미니카)", description: "Dirección General de Contrataciones Públicas·정부조달 오픈데이터 API", category: "export_promotion", type: "free_api", price_tier: "free", purpose: "입찰·계약·공급업체 데이터", b2b_b2c: "b2b", url: "https://www.dgcp.gob.do/datos-abiertos/api" },
  { id: "prodominicana", name: "PRODOMINICANA", description: "도미니카공화국 수출·투자진흥청", category: "export_promotion", type: "site", price_tier: "free", purpose: "수출·투자 인센티브·공고", b2b_b2c: "b2b", url: "https://www.prodominicana.gob.do" },
  { id: "proindustria_do", name: "PROINDUSTRIA (도미니카)", description: "Centro de Desarrollo Industrial y Competitividad·제조·산업 경쟁력", category: "export_promotion", type: "site", price_tier: "free", purpose: "산업 정책·자유구역·공고", b2b_b2c: "b2b", url: "https://proindustria.gob.do" },
  { id: "cnzfe_do", name: "CNZFE (도미니카)", description: "Consejo Nacional de Zonas Francas de Exportación·수출자유지역", category: "export_promotion", type: "site", price_tier: "free", purpose: "자유지역·수출 기업 정보", b2b_b2c: "b2b", url: "https://www.cnzfe.gob.do" },
  { id: "dga_do", name: "DGA (도미니카)", description: "Dirección General de Aduanas·관세청 포털", category: "export_promotion", type: "site", price_tier: "free", purpose: "관세·통관·수출입 절차", b2b_b2c: "b2b", url: "https://www.aduanas.gob.do" },
  { id: "export_promoter", name: "수출 PROMOTOR", description: "수출진흥·바이어 매칭 플랫폼", category: "export_promotion", type: "site", price_tier: "free", purpose: "수출 기회·공고", b2b_b2c: "b2b" },
  { id: "kotra", name: "KOTRA", description: "대한무역투자진흥공사·무역정보·수출지원", category: "export_promotion", type: "site", price_tier: "free", purpose: "시장정보·바이어·전시회", b2b_b2c: "b2b", url: "https://www.kotra.or.kr" },
  { id: "pronicaragua", name: "PRONICARAGUA", description: "니카라과 투자·수출진흥청", category: "export_promotion", type: "site", price_tier: "free", purpose: "투자·수출 지원·공고", b2b_b2c: "b2b", url: "https://www.pronicaragua.org" },
  { id: "fieo_india", name: "FIEO (인도)", description: "Federation of Indian Export Organisations·Indian Business Portal B2B", category: "export_promotion", type: "site", price_tier: "free", purpose: "인도 수출기업·바이어 매칭", b2b_b2c: "b2b", url: "https://www.fieo.org" },
  { id: "dgft_india", name: "DGFT (인도)", description: "Directorate General of Foreign Trade·관세·수출 인증", category: "export_promotion", type: "site", price_tier: "free", purpose: "수출 규정·eBRC·공고", b2b_b2c: "b2b", url: "https://www.dgft.gov.in" },
  { id: "indiamart", name: "IndiaMART", description: "인도 B2B 마켓플레이스·제조·공급업체", category: "export_promotion", type: "site", price_tier: "free", purpose: "인도 업체·리드·공급망", b2b_b2c: "b2b", url: "https://www.indiamart.com" },
  { id: "epc_india", name: "EPC India", description: "인도 수출진흥위원회(산업별 EPC)·공고·전시회", category: "export_promotion", type: "site", price_tier: "free", purpose: "산업별 수출·전시회 정보", b2b_b2c: "b2b", url: "https://www.epc.gov.in" },
  { id: "vietrade", name: "Vietrade (베트남)", description: "Vietnam Trade Promotion Agency·무역진흥", category: "export_promotion", type: "site", price_tier: "free", purpose: "베트남 수출·바이어·전시회", b2b_b2c: "b2b", url: "https://vietrade.com" },
  { id: "vietnam_export_portal", name: "Vietnam Export Portal", description: "베트남 수출 포털·기업 문의", category: "export_promotion", type: "site", price_tier: "free", purpose: "베트남 기업·무역 문의", b2b_b2c: "b2b", url: "https://www.vietnamexport.info" },
  { id: "tei_indonesia", name: "Trade Expo Indonesia", description: "인도네시아 무역전·TEI·수출기업·바이어", category: "export_promotion", type: "site", price_tier: "free", purpose: "인도네시아 수출·전시회", b2b_b2c: "b2b", url: "https://www.tradexpoindonesia.com" },
  { id: "indonesia_trade", name: "Indonesia Ministry of Trade", description: "인도네시아 무역부·수출입·정책", category: "export_promotion", type: "site", price_tier: "free", purpose: "무역 정책·공고", b2b_b2c: "b2b", url: "https://www.kemendag.go.id" },
  { id: "apexbrasil", name: "ApexBrasil", description: "브라질 수출투자진흥원", category: "export_promotion", type: "site", price_tier: "free", purpose: "브라질 수출·투자·전시회", b2b_b2c: "b2b", url: "https://www.apexbrasil.com.br" },
  { id: "trademark_southafrica", name: "Trade & Investment South Africa", description: "남아공 무역투자청·TISA", category: "export_promotion", type: "site", price_tier: "free", purpose: "남아공 수출·투자 공고", b2b_b2c: "b2b", url: "https://www.thedti.gov.za" },
  { id: "bangladesh_epb", name: "EPB Bangladesh", description: "Bangladesh Export Promotion Bureau", category: "export_promotion", type: "site", price_tier: "free", purpose: "방글라데시 수출·공고", b2b_b2c: "b2b", url: "https://www.epb.gov.bd" },
  { id: "pakistan_tdap", name: "TDAP Pakistan", description: "Trade Development Authority of Pakistan", category: "export_promotion", type: "site", price_tier: "free", purpose: "파키스탄 수출·전시회", b2b_b2c: "b2b", url: "https://www.tdap.gov.pk" },
  { id: "other_export_agencies", name: "기타 수출지원 공고소", description: "CEPEX, PROCOMER, ProColombia, ProMéxico 등 각국 수출진흥기관", category: "export_promotion", type: "site", price_tier: "free", purpose: "입찰·수출 공고 통합", b2b_b2c: "b2b" },
  // 경제·지표
  { id: "imf_data", name: "IMF Data", description: "경제·금융 지표", category: "economic", type: "free_api", price_tier: "free", purpose: "GDP·환율·부채", b2b_b2c: "b2b", url: "https://www.imf.org/en/Data" },
  { id: "fred", name: "FRED (Federal Reserve)", description: "미국·글로벌 시계열", category: "economic", type: "free_api", price_tier: "free", purpose: "금리·물가·고용", b2b_b2c: "b2b", url: "https://fred.stlouisfed.org" },
  { id: "google_trends", name: "Google Trends", description: "검색 트렌드", category: "economic", type: "free_api", price_tier: "free", purpose: "키워드·관심도", b2b_b2c: "both" },
  { id: "serp_api", name: "SerpApi", description: "검색·트렌드 스크래핑", category: "economic", type: "paid_api", price_tier: "low", purpose: "검색량·순위", b2b_b2c: "both", url: "https://serpapi.com" },
  // 뉴스·미디어
  { id: "news_api", name: "NewsAPI", description: "전세계 뉴스 헤드라인·요약", category: "news", type: "paid_api", price_tier: "low", purpose: "뉴스 요약·키워드", b2b_b2c: "both", url: "https://newsapi.org" },
  { id: "gnews_api", name: "GNews API", description: "뉴스 검색·요약", category: "news", type: "paid_api", price_tier: "low", purpose: "시장·산업 뉴스", b2b_b2c: "both", url: "https://gnews.io" },
  { id: "reuters_rss", name: "Reuters / BBC Business", description: "주요 매체 경제·산업", category: "news", type: "rss", price_tier: "free", purpose: "B2B·시장 뉴스", b2b_b2c: "b2b" },
  { id: "bloomberg", name: "Bloomberg / regional", description: "지역 경제·무역 뉴스", category: "news", type: "site", price_tier: "mid", purpose: "시장 국가 뉴스", b2b_b2c: "b2b" },
  // B2B·B2C 채널
  { id: "opencorporates", name: "OpenCorporates", description: "기업 등록·프로필", category: "b2b_b2c", type: "free_api", price_tier: "free", purpose: "B2B 업체 정보", b2b_b2c: "b2b", url: "https://opencorporates.com" },
  { id: "linkedin_api", name: "LinkedIn (API 제한)", description: "B2B 연락처·회사", category: "b2b_b2c", type: "paid_api", price_tier: "mid", purpose: "바이어·담당자", b2b_b2c: "b2b" },
  { id: "apollo_clearbit", name: "Apollo / Clearbit", description: "B2B 리드·회사 데이터", category: "b2b_b2c", type: "paid_api", price_tier: "low", purpose: "연락처·회사 프로필", b2b_b2c: "b2b" },
];

export const DATA_SOURCE_CATEGORIES: { id: DataSourceCategory; label_ko: string; label_en: string; label_es: string }[] = [
  { id: "social_reviews", label_ko: "소셜·리뷰", label_en: "Social & reviews", label_es: "Social y reseñas" },
  { id: "trade_industry", label_ko: "무역·산업", label_en: "Trade & industry", label_es: "Comercio e industria" },
  { id: "manufacturing", label_ko: "제조·상공회의소", label_en: "Manufacturing & chambers", label_es: "Manufactura y cámaras" },
  { id: "export_promotion", label_ko: "수출지원·공고", label_en: "Export promotion & notices", label_es: "Fomento a exportación y avisos" },
  { id: "economic", label_ko: "경제·지표", label_en: "Economic indicators", label_es: "Indicadores económicos" },
  { id: "news", label_ko: "뉴스·미디어", label_en: "News & media", label_es: "Noticias y medios" },
  { id: "b2b_b2c", label_ko: "B2B·B2C 채널", label_en: "B2B/B2C channels", label_es: "Canales B2B/B2C" },
];

const ANALYSIS: AnalysisTech[] = [
  { name: "GPT-4", description: "감정 분석, 테마 추출" },
  { name: "BERT", description: "토픽 모델링" },
  { name: "Custom NLP", description: "니즈 패턴 인식" },
];

const RESULTS: ResultOutput[] = [
  { id: "needs", title: "소비자 니즈 Top 10", period: "주간" },
  { id: "complaints", title: "불만 포인트 분석", period: "이슈별 집계" },
  { id: "intent", title: "구매 의도 신호 감지", period: "실시간" },
];

/** 시장조사 툴 — 강세 흐름용 */
const TOOLS: MarketResearchTool[] = [
  { id: "social", name: "소셜·커뮤니티", description: "Reddit, X(Twitter), YouTube 댓글·멘션 수집", category: "social" },
  { id: "reviews", name: "리뷰·평점", description: "Amazon, 앱스토어, G2, Capterra 제품·서비스 리뷰", category: "reviews" },
  { id: "search", name: "검색·트렌드", description: "Google Trends, 키워드 검색량, 롱테일 질문", category: "search" },
  { id: "trade", name: "무역·관세", description: "HS코드별 수출입 통계, 관세·규제 데이터", category: "trade" },
  { id: "official", name: "공식·통계", description: "국가통계청, 산업부, 유엔 무역 DB", category: "official" },
];

/** 시장조사 서비스 — 수집 → 분석 → 인사이트 */
const SERVICES: MarketResearchService[] = [
  { id: "collect", name: "데이터 수집", description: "지정한 국가·업계·아이템 기준 소스별 수집", step: 1 },
  { id: "analyze", name: "분석·가공", description: "NLP·감정분석, 토픽 모델링, 시계열 트렌드", step: 2 },
  { id: "insight", name: "인사이트·리포트", description: "니즈·불만·구매의도 요약, 시장 리포트 생성", step: 3 },
];

/** 리포트 포함 섹션 (언어별 라벨) */
const REPORT_SECTION_LABELS: Record<ReportLanguage, { id: string; label: string }[]> = {
  ko: [
    { id: "executive_summary", label: "요약 (Executive Summary)" },
    { id: "market_size", label: "시장 규모·성장률" },
    { id: "consumer_needs", label: "소비자 니즈 Top 10" },
    { id: "pain_points", label: "불만·이슈 분석" },
    { id: "purchase_intent", label: "구매 의도 신호" },
    { id: "competition", label: "경쟁·가격대" },
    { id: "trends", label: "트렌드·키워드" },
    { id: "recommendations", label: "데이터 기반 제안" },
    { id: "related_companies", label: "관련 업체 리스트 (연락처·출처 포함)" },
  ],
  en: [
    { id: "executive_summary", label: "Executive Summary" },
    { id: "market_size", label: "Market size & growth" },
    { id: "consumer_needs", label: "Consumer needs Top 10" },
    { id: "pain_points", label: "Pain points & issues" },
    { id: "purchase_intent", label: "Purchase intent signals" },
    { id: "competition", label: "Competition & pricing" },
    { id: "trends", label: "Trends & keywords" },
    { id: "recommendations", label: "Data-driven recommendations" },
    { id: "related_companies", label: "Related companies list (with contact & source)" },
  ],
  es: [
    { id: "executive_summary", label: "Resumen ejecutivo" },
    { id: "market_size", label: "Tamaño y crecimiento del mercado" },
    { id: "consumer_needs", label: "Necesidades del consumidor Top 10" },
    { id: "pain_points", label: "Puntos de dolor y problemas" },
    { id: "purchase_intent", label: "Señales de intención de compra" },
    { id: "competition", label: "Competencia y precios" },
    { id: "trends", label: "Tendencias y palabras clave" },
    { id: "recommendations", label: "Recomendaciones basadas en datos" },
    { id: "related_companies", label: "Lista de empresas relacionadas (contacto y fuente)" },
  ],
};

export const REPORT_SECTION_OPTIONS = REPORT_SECTION_LABELS.ko;

export function getReportSectionOptions(lang: ReportLanguage = "ko"): { id: string; label: string }[] {
  return REPORT_SECTION_LABELS[lang] ?? REPORT_SECTION_LABELS.ko;
}

const defaultReportOptions: MarketReportOutputOptions = {
  format: "pdf",
  scope: "full",
  schedule: "weekly",
  sections: REPORT_SECTION_OPTIONS.map((s) => s.id),
  language: "ko",
  report_tier: "medium",
  target_page_count: 20,
  layout_template: "standard",
};

const reportOptionsStore = new Map<string, MarketReportOutputOptions>();
const granularRequestStore = new Map<string, GranularAnalysisRequest>();

const RESEARCH_TYPE_LABELS: Record<ResearchType, { ko: string; en: string; es: string }> = {
  import: { ko: "수입", en: "Import", es: "Importación" },
  export: { ko: "수출", en: "Export", es: "Exportación" },
  distribution: { ko: "유통", en: "Distribution", es: "Distribución" },
  consumption: { ko: "소비", en: "Consumption", es: "Consumo" },
  manufacturing: { ko: "제조", en: "Manufacturing", es: "Manufactura" },
};

const RESEARCH_TYPES_ORDER: ResearchType[] = ["import", "export", "distribution", "consumption", "manufacturing"];

export function getResearchTypeOptions(lang: ReportLanguage = "ko"): { value: ResearchType; label: string }[] {
  const key = lang === "es" ? "es" : lang === "en" ? "en" : "ko";
  return RESEARCH_TYPES_ORDER.map((v) => ({ value: v, label: RESEARCH_TYPE_LABELS[v][key] }));
}

export function getGranularAnalysisRequest(orgId: string, countryCode: string): GranularAnalysisRequest | null {
  const key = `${orgId}:${countryCode}`;
  return granularRequestStore.get(key) ?? null;
}

const VALID_RESEARCH_TYPES: ResearchType[] = ["import", "export", "distribution", "consumption", "manufacturing"];

function sanitizeResearchTypes(types: unknown): ResearchType[] {
  if (!Array.isArray(types)) return [];
  return types.filter((t): t is ResearchType => typeof t === "string" && VALID_RESEARCH_TYPES.includes(t as ResearchType));
}

export function setGranularAnalysisRequest(
  orgId: string,
  countryCode: string,
  request: Partial<GranularAnalysisRequest> | null
): GranularAnalysisRequest | null {
  const key = `${orgId}:${countryCode}`;
  if (!request) {
    granularRequestStore.delete(key);
    return null;
  }
  const current = granularRequestStore.get(key);
  const rawTypes = request.research_types ?? current?.research_types ?? [];
  const research_types = sanitizeResearchTypes(rawTypes);
  const next: GranularAnalysisRequest = {
    country_code: String(request.country_code ?? current?.country_code ?? "").slice(0, 10),
    item: String(request.item ?? current?.item ?? "").slice(0, 500),
    hs_code: String(request.hs_code ?? current?.hs_code ?? "").slice(0, 50),
    research_types,
  };
  granularRequestStore.set(key, next);
  return next;
}

function getMetricLabelForResearchType(t: ResearchType, lang: ReportLanguage): string {
  if (t === "manufacturing") {
    return lang === "ko" ? "생산 비중·주요 제조업체" : lang === "es" ? "Cuota de producción · fabricantes clave" : "Production share · key manufacturers";
  }
  return lang === "ko" ? "점유율(거래액 기준)" : lang === "es" ? "Cuota (por valor)" : "Share (by value)";
}

/** 조사유형 코드 → 현재 언어 라벨 (API·프론트 표시용) */
export function getResearchTypeLabel(researchType: ResearchType, lang: ReportLanguage = "ko"): string {
  const key = lang === "es" ? "es" : lang === "en" ? "en" : "ko";
  return RESEARCH_TYPE_LABELS[researchType]?.[key] ?? researchType;
}

const DEFAULT_DATA_SOURCES = ["UN Comtrade (무역통계)", "World Bank (경제지표)", "OpenCorporates (기업 DB)"];

/** 세분화 분석 결과 (스텁 + 무료 API 연동: UN Comtrade, World Bank) — top_players 5개, related_companies 5개 */
export function getSegmentedAnalysisResult(
  request: GranularAnalysisRequest,
  lang: ReportLanguage = "ko"
): SegmentedAnalysisResult {
  const types = request.research_types.length ? request.research_types : (["import", "export"] as ResearchType[]);
  const asOf = new Date().toISOString().slice(0, 10);
  const itemLabel = request.item || "—";
  const keyPlayer = lang === "ko" ? "주요 업체" : lang === "es" ? "principales" : "key player";
  const market_dominance: MarketDominancePoint[] = types.map((t) => ({
    research_type: t,
    research_type_label: getResearchTypeLabel(t, lang),
    metric: getMetricLabelForResearchType(t, lang),
    top_players: [
      { name: "Sample Corp A", share_or_value: "22%", description: `${itemLabel} ${keyPlayer}` },
      { name: "Sample Corp B", share_or_value: "18%", description: "" },
      { name: "Sample Corp C", share_or_value: "14%", description: "" },
      { name: "Sample Corp D", share_or_value: "11%", description: "" },
      { name: "Sample Corp E", share_or_value: "9%", description: "" },
    ],
  }));
  const countryCode = request.country_code || "US";
  const productsOrHs = request.hs_code || request.item || "—";
  const related_companies: RecommendedCompany[] = [
    {
      company_name: "Global Trade Inc.",
      country_code: countryCode,
      products_or_hs: productsOrHs,
      contact: { email: "contact@example.com", source: "Public directory", as_of: asOf },
      reason: lang === "ko" ? "동일 HS 수입 상위" : lang === "es" ? "Top importador mismo HS" : "Same HS top importer",
    },
    {
      company_name: "Regional Distributor Ltd.",
      country_code: countryCode,
      products_or_hs: productsOrHs,
      contact: { phone: "+1-555-0100", source: "Public directory", as_of: asOf },
      reason: lang === "ko" ? "유사 품목 유통" : lang === "es" ? "Distribución producto similar" : "Similar product distribution",
    },
    {
      company_name: "Export Partners Co.",
      country_code: countryCode,
      products_or_hs: productsOrHs,
      contact: { source: "OpenCorporates / 무역통계베이스", as_of: asOf },
      reason: lang === "ko" ? "동일 HS 수출 상위" : lang === "es" ? "Top exportador mismo HS" : "Same HS top exporter",
    },
    {
      company_name: "Industrial Supply Corp.",
      country_code: countryCode,
      products_or_hs: productsOrHs,
      contact: { source: "OpenCorporates / 무역통계베이스", as_of: asOf },
      reason: lang === "ko" ? "유통·도매 업체" : lang === "es" ? "Distribución · mayorista" : "Distribution · wholesale",
    },
    {
      company_name: "Trade & Logistics Ltd.",
      country_code: countryCode,
      products_or_hs: productsOrHs,
      contact: { source: "OpenCorporates / 무역통계베이스", as_of: asOf },
      reason: lang === "ko" ? "수입·물류 관련 업체" : lang === "es" ? "Importación · logística" : "Import · logistics",
    },
  ];
  return { request, market_dominance, related_companies, data_sources_used: [...DEFAULT_DATA_SOURCES] };
}

/** Comtrade 파트너국 상위 N건 → top_players 형식 (무역통계 근거) */
function comtradeRowsToTopPlayers(
  rows: { partnerDesc?: string; primaryValue?: number; cifvalue?: number }[],
  year: string,
  lang: ReportLanguage,
  researchType: "import" | "export"
): { name: string; share_or_value: string; description?: string }[] {
  const total = rows.reduce((s, r) => s + (r.primaryValue ?? r.cifvalue ?? 0), 0);
  const sorted = [...rows]
    .filter((r) => (r.partnerDesc ?? "").trim() && (r.partnerDesc ?? "").trim() !== "World")
    .sort((a, b) => (b.primaryValue ?? b.cifvalue ?? 0) - (a.primaryValue ?? a.cifvalue ?? 0))
    .slice(0, 5);
  const flowLabel = researchType === "export" ? (lang === "ko" ? "수출" : lang === "es" ? "exportación" : "export") : (lang === "ko" ? "수입" : lang === "es" ? "importación" : "import");
  const sourceLabel = "UN Comtrade (무역통계)";
  return sorted.map((r) => {
    const val = r.primaryValue ?? r.cifvalue ?? 0;
    const pct = total > 0 ? ((val / total) * 100).toFixed(1) + "%" : "—";
    return {
      name: (r.partnerDesc ?? "—").trim(),
      share_or_value: pct,
      description: `${year} ${flowLabel} · ${sourceLabel}`,
    };
  });
}

/** 세분화 분석 결과 (실데이터 보강: UN Comtrade 파트너국·무역액, World Bank, OpenCorporates 업체명) — 관련 업체 5개, 근거 소스 표시 */
export async function getSegmentedAnalysisResultAsync(
  request: GranularAnalysisRequest,
  lang: ReportLanguage = "ko"
): Promise<SegmentedAnalysisResult> {
  const base = getSegmentedAnalysisResult(request, lang);
  const country = (request.country_code || "").trim().toUpperCase().slice(0, 2);
  const sourcesUsed: string[] = [];

  if (!country) {
    return { ...base, data_sources_used: base.data_sources_used ?? DEFAULT_DATA_SOURCES };
  }

  try {
    const [{ fetchTradeData }, { fetchCountryIndicator, WORLD_BANK_INDICATORS }, { searchCompanies }] = await Promise.all([
      import("./externalApis/unComtrade.js"),
      import("./externalApis/worldBank.js"),
      import("./externalApis/opencorporates.js"),
    ]);
    const year = String(new Date().getFullYear() - 1);
    const [exportData, importData, gdpData, ocCompanies] = await Promise.all([
      fetchTradeData({ ps: year, countryCode: country, rg: 2, maxRecords: 20 }),
      fetchTradeData({ ps: year, countryCode: country, rg: 1, maxRecords: 20 }),
      fetchCountryIndicator(country === "KR" ? "KOR" : country, WORLD_BANK_INDICATORS.GDP, 1),
      searchCompanies(request.item?.trim() || "trading", { jurisdictionCode: country.toLowerCase(), perPage: 5 }),
    ]);

    const asOf = new Date().toISOString().slice(0, 10);
    const countryCode = request.country_code || country;
    const productsOrHs = request.hs_code || request.item || "—";

    // 시장 장악: 수입/수출은 Comtrade 파트너국(무역통계) 기준 상위 5개로 교체
    let newDominance = base.market_dominance.map((d) => {
      if (d.research_type === "export" && exportData.length > 0) {
        sourcesUsed.push("UN Comtrade (무역통계)");
        const players = comtradeRowsToTopPlayers(exportData, year, lang, "export");
        if (players.length >= 5) return { ...d, top_players: players };
        return { ...d, top_players: [...players, ...d.top_players.slice(players.length)].slice(0, 5) };
      }
      if (d.research_type === "import" && importData.length > 0) {
        if (!sourcesUsed.includes("UN Comtrade (무역통계)")) sourcesUsed.push("UN Comtrade (무역통계)");
        const players = comtradeRowsToTopPlayers(importData, year, lang, "import");
        if (players.length >= 5) return { ...d, top_players: players };
        return { ...d, top_players: [...players, ...d.top_players.slice(players.length)].slice(0, 5) };
      }
      return d;
    });

    // GDP(World Bank) 보강
    const gdpVal = gdpData[0]?.value;
    if (gdpVal != null) {
      sourcesUsed.push("World Bank (경제지표)");
      const gdpLabel = lang === "ko" ? "GDP (World Bank)" : lang === "es" ? "PIB (Banco Mundial)" : "GDP (World Bank)";
      newDominance = newDominance.map((d) => {
        if (d.research_type === "export" || d.research_type === "import") {
          const first = d.top_players[0];
          if (first && !first.description?.includes("World Bank"))
            return { ...d, top_players: [{ ...first, description: `${first.description ?? ""} · ${gdpLabel}: $${(gdpVal / 1e9).toFixed(2)}B` }, ...d.top_players.slice(1)] };
          return d;
        }
        return d;
      });
    }

    // 관련 업체 5개: OpenCorporates 실데이터로 채우고, 부족분은 기존 플레이스홀더 유지 (무역통계베이스·업체명 근거)
    const ocSource = lang === "ko" ? "OpenCorporates / 무역통계베이스" : "OpenCorporates";
    if (ocCompanies.length > 0) {
      sourcesUsed.push("OpenCorporates (기업 DB)");
    }
    const related_companies: RecommendedCompany[] = ocCompanies.slice(0, 5).map((c, i) => ({
      company_name: c.name || `Company ${i + 1}`,
      country_code: countryCode,
      products_or_hs: productsOrHs,
      contact: { source: ocSource, as_of: asOf },
      reason: lang === "ko" ? "무역·기업 DB 기반 추천" : lang === "es" ? "Recomendado por base de datos comercial" : "Recommended from trade/company DB",
    }));
    while (related_companies.length < 5) {
      const fallback = base.related_companies[related_companies.length];
      if (fallback) related_companies.push(fallback);
      else break;
    }

    const data_sources_used = [...new Set([...sourcesUsed, ...(base.data_sources_used ?? DEFAULT_DATA_SOURCES)])];
    return {
      ...base,
      market_dominance: newDominance,
      related_companies,
      data_sources_used,
    };
  } catch {
    return { ...base, data_sources_used: base.data_sources_used ?? DEFAULT_DATA_SOURCES };
  }
}

export function getSources(): DataSource[] {
  return SOURCES;
}

export function getSourceCategories(lang: ReportLanguage = "ko"): { id: DataSourceCategory; label: string }[] {
  const key = lang === "es" ? "label_es" : lang === "en" ? "label_en" : "label_ko";
  return DATA_SOURCE_CATEGORIES.map((c) => ({ id: c.id, label: c[key] }));
}

/** 시장 국가별 뉴스 요약. 무료 RSS(Reuters, BBC) 연동 + 스텁 폴백 */
export interface NewsSummaryItem {
  title: string;
  summary: string;
  source: string;
  url?: string;
  b2b_b2c: "b2b" | "b2c" | "both";
  date?: string;
}

const NEWS_SUMMARY_STUB: Record<ReportLanguage, NewsSummaryItem[]> = {
  ko: [
    { title: "시장 동향 요약", summary: "주요 매체·B2B/B2C 관련 뉴스 (RSS 연동: Reuters, BBC). 아래 실시간 헤드라인과 함께 표시됩니다.", source: "YuantO Ai", b2b_b2c: "both", date: "" },
    { title: "산업·무역 뉴스", summary: "무역·규제·산업 동향 헤드라인.", source: "Reuters / BBC", b2b_b2c: "b2b", date: "" },
  ],
  en: [
    { title: "Market news summary", summary: "Headlines from major media (RSS: Reuters, BBC). Live items shown below.", source: "YuantO Ai", b2b_b2c: "both", date: "" },
    { title: "Industry & trade news", summary: "Trade, regulation and industry headlines.", source: "Reuters / BBC", b2b_b2c: "b2b", date: "" },
  ],
  es: [
    { title: "Resumen de noticias del mercado", summary: "Titulares de medios principales (RSS: Reuters, BBC).", source: "YuantO Ai", b2b_b2c: "both", date: "" },
    { title: "Noticias industria y comercio", summary: "Titulares de comercio, regulación e industria.", source: "Reuters / BBC", b2b_b2c: "b2b", date: "" },
  ],
};

let rssNewsCache: NewsSummaryItem[] = [];
let rssNewsCacheTime = 0;
const RSS_CACHE_MS = 1000 * 60 * 15; // 15 min

async function getRssNewsCached(): Promise<NewsSummaryItem[]> {
  const now = Date.now();
  if (now - rssNewsCacheTime < RSS_CACHE_MS && rssNewsCache.length > 0) return rssNewsCache;
  try {
    const { fetchRssNewsItems } = await import("./externalApis/rssNews.js");
    const items = await fetchRssNewsItems(5);
    rssNewsCache = items;
    rssNewsCacheTime = now;
    return items;
  } catch {
    return rssNewsCache.length > 0 ? rssNewsCache : [];
  }
}

export async function getMarketNewsSummaryAsync(countryCode: string, lang: ReportLanguage = "ko"): Promise<NewsSummaryItem[]> {
  const stub = NEWS_SUMMARY_STUB[lang] ?? NEWS_SUMMARY_STUB.ko;
  const date = new Date().toISOString().slice(0, 10);
  const stubWithDate = stub.map((item) => ({ ...item, date: item.date || date }));
  const live = await getRssNewsCached();
  const liveWithDate = live.map((item) => ({ ...item, date: item.date || date }));
  return [...stubWithDate.slice(0, 1), ...liveWithDate.slice(0, 12), ...stubWithDate.slice(1)];
}

export function getMarketNewsSummary(countryCode: string, lang: ReportLanguage = "ko"): NewsSummaryItem[] {
  const list = NEWS_SUMMARY_STUB[lang] ?? NEWS_SUMMARY_STUB.ko;
  const date = new Date().toISOString().slice(0, 10);
  return list.map((item) => ({ ...item, date: item.date || date }));
}

export function getAnalysisTech(): AnalysisTech[] {
  return ANALYSIS;
}

export function getResultOutputs(): ResultOutput[] {
  return RESULTS;
}

export function getMarketResearchTools(): MarketResearchTool[] {
  return TOOLS;
}

export function getMarketResearchServices(): MarketResearchService[] {
  return SERVICES;
}

export function getReportOutputOptions(lang?: ReportLanguage): { id: string; label: string }[] {
  return getReportSectionOptions(lang ?? "ko");
}

export function getDefaultReportOptions(): MarketReportOutputOptions {
  return { ...defaultReportOptions };
}

export function getMarketReportOptions(orgId: string, countryCode: string): MarketReportOutputOptions {
  const key = `${orgId}:${countryCode}`;
  const stored = reportOptionsStore.get(key);
  return stored ? { ...defaultReportOptions, ...stored } : { ...defaultReportOptions };
}

const VALID_REPORT_TIERS: ReportTier[] = ["medium", "high", "highest"];
const TARGET_PAGE_MIN = 5;
const TARGET_PAGE_MAX = 200;

export function setMarketReportOptions(
  orgId: string,
  countryCode: string,
  options: Partial<MarketReportOutputOptions>
): MarketReportOutputOptions {
  const key = `${orgId}:${countryCode}`;
  const current = reportOptionsStore.get(key) ?? { ...defaultReportOptions };
  const rawTier = options.report_tier ?? current.report_tier ?? "medium";
  const report_tier: ReportTier = VALID_REPORT_TIERS.includes(rawTier as ReportTier) ? (rawTier as ReportTier) : "medium";
  const rawPages = options.target_page_count ?? current.target_page_count ?? 20;
  const target_page_count = Math.max(TARGET_PAGE_MIN, Math.min(TARGET_PAGE_MAX, Number(rawPages) || 20));
  const next: MarketReportOutputOptions = {
    format: options.format ?? current.format,
    scope: options.scope ?? current.scope,
    schedule: options.schedule ?? current.schedule,
    sections: Array.isArray(options.sections) ? options.sections : current.sections,
    language: options.language ?? current.language ?? "ko",
    report_tier,
    target_page_count,
    layout_template: options.layout_template ?? current.layout_template ?? "standard",
  };
  reportOptionsStore.set(key, next);
  return next;
}

/** 사용자(조직)별 활성화한 유료 API 소스 ID 목록. 선택한 유료 소스만 사용(추가 비용은 사용자 선택에 따름) */
const enabledPaidSourceStore = new Map<string, string[]>();

export function getEnabledPaidSources(orgId: string): string[] {
  return enabledPaidSourceStore.get(orgId) ?? [];
}

export function setEnabledPaidSources(orgId: string, sourceIds: string[]): string[] {
  const ids = Array.isArray(sourceIds) ? sourceIds.filter((id) => typeof id === "string") : [];
  enabledPaidSourceStore.set(orgId, ids);
  return ids;
}

/** 리포트 등급 옵션 (중/고/최고) */
const REPORT_TIER_LABELS: Record<ReportTier, { ko: string; en: string; es: string }> = {
  medium: { ko: "중", en: "Medium", es: "Medio" },
  high: { ko: "고", en: "High", es: "Alto" },
  highest: { ko: "최고", en: "Highest", es: "Máximo" },
};

export function getReportTierOptions(lang: ReportLanguage = "ko"): { value: ReportTier; label: string }[] {
  const key = lang === "es" ? "es" : lang === "en" ? "en" : "ko";
  return (["medium", "high", "highest"] as ReportTier[]).map((v) => ({ value: v, label: REPORT_TIER_LABELS[v][key] }));
}

/** 시장 리포트 생성 (플레이스홀더: 실제 PDF/Excel 생성 파이프라인 연동 시 교체) */
export interface MarketReportJob {
  job_id: string;
  status: "pending" | "completed" | "failed";
  message: string;
  download_url?: string | null;
  format?: string;
}

export function generateMarketReport(orgId: string, countryCode: string): MarketReportJob {
  const options = getMarketReportOptions(orgId, countryCode);
  const job_id = `mr_${orgId}_${countryCode}_${Date.now()}`;
  return {
    job_id,
    status: "completed",
    message: "Report generation pipeline is not yet connected. Your options have been saved; when the pipeline is ready, reports will be generated with the selected format, tier, and page count.",
    download_url: null,
    format: options.format,
  };
}
