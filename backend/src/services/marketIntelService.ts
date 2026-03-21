import {
  clearGranularRequest,
  getEnabledPaidSourcesForOrg,
  getGranularRequest,
  getReportOptions,
  setEnabledPaidSourcesForOrg,
  setGranularRequest,
  setReportOptions,
} from "./marketIntel/store.js";
import type {
  AnalysisTech,
  DataSource,
  DataSourceCategory,
  GranularAnalysisRequest,
  MarketDominancePoint,
  MarketReportOutputOptions,
  MarketResearchService,
  MarketResearchTool,
  NewsSummaryItem,
  RecommendedCompany,
  ReportLanguage,
  ReportTier,
  ResearchType,
  ResultOutput,
  RunResearchResult,
  SegmentedAnalysisResult,
  SupplementaryResearchData,
  TopCompanyDetail,
} from "./marketIntel/types.js";
export type {
  AnalysisTech,
  DataSource,
  DataSourceCategory,
  DataSourcePriceTier,
  DataSourceType,
  GranularAnalysisRequest,
  MarketDominancePoint,
  MarketReportOutputOptions,
  MarketResearchService,
  MarketResearchTool,
  NewsSummaryItem,
  RecommendedCompany,
  ReportLanguage,
  ReportTier,
  ResearchType,
  ResultOutput,
  ResultOutputType,
  RunResearchResult,
  SegmentedAnalysisResult,
  SupplementaryResearchData,
  TopCompanyDetail,
} from "./marketIntel/types.js";

/** Data Sources: id·카테고리·유형·가격대·용도·링크 (무료/저가 API·업체 간추림) */
const SOURCES: DataSource[] = [
  // 소셜·리뷰·소셜 네트워크
  { id: "reddit_api", name: "Reddit API", description: "실시간 소비자 대화", category: "social_reviews", type: "free_api", price_tier: "free", purpose: "소비자 감정·테마", b2b_b2c: "b2c", url: "https://www.reddit.com/dev/api" },
  { id: "twitter_api", name: "Twitter/X API", description: "브랜드 멘션·트렌드", category: "social_reviews", type: "paid_api", price_tier: "low", purpose: "브랜드·이슈 모니터링", b2b_b2c: "both", url: "https://developer.twitter.com" },
  { id: "youtube_api", name: "YouTube Data API", description: "영상·댓글 반응", category: "social_reviews", type: "free_api", price_tier: "free", purpose: "영상 반응·트렌드", b2b_b2c: "b2c", url: "https://developers.google.com/youtube/v3", connected: true },
  { id: "facebook_api", name: "Facebook (Meta) Graph API", description: "페이지·공개 메타데이터·검색", category: "social_reviews", type: "paid_api", price_tier: "free", purpose: "브랜드 페이지·팔로워·소셜 트렌드", b2b_b2c: "both", url: "https://developers.facebook.com/docs/graph-api", connected: true },
  { id: "instagram_api", name: "Instagram Graph API", description: "비즈니스 계정·인사이트·미디어", category: "social_reviews", type: "paid_api", price_tier: "low", purpose: "인플루언서·소셜 커머스", b2b_b2c: "both", url: "https://developers.facebook.com/docs/instagram-api" },
  { id: "tiktok_business_api", name: "TikTok for Business API", description: "광고·캠페인·인사이트·상품", category: "social_reviews", type: "paid_api", price_tier: "low", purpose: "소셜 커머스·트렌드", b2b_b2c: "both", url: "https://business-api.tiktok.com" },
  { id: "social_commerce", name: "소셜 커머스", description: "Facebook Shop, Instagram Shopping, TikTok Shop·라이브커머스", category: "social_reviews", type: "site", price_tier: "free", purpose: "소셜 판매·UGC·리뷰", b2b_b2c: "b2c" },
  { id: "social_group_buying", name: "소셜 공동구매", description: "YouTube·Instagram·Facebook·TikTok·Pinterest·X·카카오·네이버 밴드 등 소셜 채널 공동구매·라이브·인플루언서 제휴", category: "social_reviews", type: "site", price_tier: "free", purpose: "공동구매·라이브커머스·제휴 판매", b2b_b2c: "b2c" },
  { id: "amazon_reviews", name: "Amazon Product/Reviews", description: "제품 리뷰·평점", category: "social_reviews", type: "paid_api", price_tier: "low", purpose: "제품 니즈·불만", b2b_b2c: "b2c" },
  { id: "app_store", name: "App Store / Play Store", description: "앱 리뷰·다운로드", category: "social_reviews", type: "site", price_tier: "free", purpose: "앱·서비스 피드백", b2b_b2c: "b2c" },
  { id: "quora", name: "Quora", description: "Q&A·니즈 패턴", category: "social_reviews", type: "site", price_tier: "free", purpose: "질문·관심 주제", b2b_b2c: "both" },
  // 무역·산업 (무료/저가 API)
  { id: "un_comtrade", name: "UN Comtrade", description: "HS·국가별 수출입", category: "trade_industry", type: "free_api", price_tier: "free", purpose: "무역 통계", b2b_b2c: "b2b", url: "https://comtradeplus.un.org", connected: true },
  { id: "wto_tariff", name: "WTO Tariff Download", description: "관세·규제 데이터", category: "trade_industry", type: "free_api", price_tier: "free", purpose: "관세·시장 접근", b2b_b2c: "b2b", url: "https://www.wto.org" },
  { id: "oecd_stat", name: "OECD Stat", description: "무역·산업 지표", category: "trade_industry", type: "free_api", price_tier: "free", purpose: "경제·무역 지표", b2b_b2c: "b2b", url: "https://stats.oecd.org", connected: true },
  { id: "world_bank", name: "World Bank Open Data", description: "무역·경제 데이터", category: "trade_industry", type: "free_api", price_tier: "free", purpose: "국가별 지표", b2b_b2c: "b2b", url: "https://data.worldbank.org", connected: true },
  // 제조·상공회의소
  { id: "unido", name: "UNIDO", description: "산업·제조 통계·생산지수", category: "manufacturing", type: "free_api", price_tier: "free", purpose: "제조업 생산·산업구조", b2b_b2c: "b2b", url: "https://stat.unido.org", connected: true },
  { id: "mapi", name: "MAPI (미 제조협회)", description: "제조업 지표·설비가동률", category: "manufacturing", type: "site", price_tier: "free", purpose: "제조 동향", b2b_b2c: "b2b", url: "https://www.mapi.net" },
  { id: "chambers", name: "각국 상공회의소", description: "KCCI·US Chamber·CAMEXA·FIESP 등", category: "manufacturing", type: "site", price_tier: "free", purpose: "회원사·산업별 보고서", b2b_b2c: "b2b" },
  { id: "invest_agencies", name: "각국 투자유치청", description: "Invest in XX, 산업단지 DB", category: "manufacturing", type: "site", price_tier: "free", purpose: "입지·제조업체 리스트", b2b_b2c: "b2b" },
  // 수출지원·공고 (각국 정부조달·수출진흥기관)
  { id: "compra_gobierno", name: "각국 COMPRA GOBIERNO", description: "정부조달·공공입찰 포털 (도미니카 Compra Nacional, 멕시코 CompraNet 등)", category: "export_promotion", type: "site", price_tier: "free", purpose: "공공입찰 공고", b2b_b2c: "b2b", url: "https://www.compranacional.gob.do" },
  { id: "dgcp_do", name: "DGCP (도미니카)", description: "Dirección General de Contrataciones Públicas·정부조달 오픈데이터 API", category: "export_promotion", type: "free_api", price_tier: "free", purpose: "입찰·계약·공급업체 데이터", b2b_b2c: "b2b", url: "https://www.dgcp.gob.do/datos-abiertos/api", connected: true },
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
  { id: "imf_data", name: "IMF Data", description: "경제·금융 지표", category: "economic", type: "free_api", price_tier: "free", purpose: "GDP·환율·부채", b2b_b2c: "b2b", url: "https://www.imf.org/en/Data", connected: true },
  { id: "fred", name: "FRED (Federal Reserve)", description: "미국·글로벌 시계열", category: "economic", type: "free_api", price_tier: "free", purpose: "금리·물가·고용", b2b_b2c: "b2b", url: "https://fred.stlouisfed.org", connected: true },
  { id: "google_trends", name: "Google Trends", description: "검색 트렌드", category: "economic", type: "free_api", price_tier: "free", purpose: "키워드·관심도", b2b_b2c: "both", connected: true },
  { id: "serp_api", name: "SerpApi", description: "검색·트렌드 스크래핑", category: "economic", type: "paid_api", price_tier: "low", purpose: "검색량·순위", b2b_b2c: "both", url: "https://serpapi.com", connected: true },
  // 뉴스·미디어
  { id: "newsdata_io", name: "NewsData.io", description: "중남미·전세계 200+국 뉴스, 7년 아카이브·감성 분석", category: "news", type: "paid_api", price_tier: "low", purpose: "국가별 시장 뉴스 (DO,MX,BR,CO,PE,CL,PA 등)", b2b_b2c: "both", url: "https://newsdata.io", connected: true },
  { id: "mediastack", name: "Mediastack", description: "7,500+ 소스 실시간 뉴스 JSON", category: "news", type: "paid_api", price_tier: "low", purpose: "중남미 주요국 실시간 헤드라인", b2b_b2c: "both", url: "https://mediastack.com", connected: true },
  { id: "news_api", name: "NewsAPI", description: "전세계 뉴스 헤드라인·요약", category: "news", type: "paid_api", price_tier: "low", purpose: "뉴스 요약·키워드", b2b_b2c: "both", url: "https://newsapi.org", connected: true },
  { id: "gnews_api", name: "GNews API", description: "뉴스 검색·요약", category: "news", type: "paid_api", price_tier: "low", purpose: "시장·산업 뉴스", b2b_b2c: "both", url: "https://gnews.io", connected: true },
  { id: "reuters_rss", name: "Reuters / BBC Business", description: "주요 매체 경제·산업", category: "news", type: "rss", price_tier: "free", purpose: "B2B·시장 뉴스", b2b_b2c: "b2b", connected: true },
  { id: "bloomberg", name: "Bloomberg / regional", description: "지역 경제·무역 뉴스", category: "news", type: "site", price_tier: "mid", purpose: "시장 국가 뉴스", b2b_b2c: "b2b" },
  // B2B·B2C 채널
  { id: "opencorporates", name: "OpenCorporates", description: "기업 등록·프로필", category: "b2b_b2c", type: "free_api", price_tier: "free", purpose: "B2B 업체 정보", b2b_b2c: "b2b", url: "https://opencorporates.com", connected: true },
  { id: "linkedin_api", name: "LinkedIn (API 제한)", description: "B2B 연락처·회사", category: "b2b_b2c", type: "paid_api", price_tier: "mid", purpose: "바이어·담당자", b2b_b2c: "b2b" },
  { id: "apollo_clearbit", name: "Apollo / Clearbit", description: "B2B 리드·회사 데이터", category: "b2b_b2c", type: "paid_api", price_tier: "low", purpose: "연락처·회사 프로필", b2b_b2c: "b2b" },
  // LATAM B2B 플랫폼·디렉토리
  { id: "connectamericas", name: "ConnectAmericas (IDB)", description: "미주개발은행 지원 중남미 최대 B2B·10만+ 기업·구매 공고", category: "latam_b2b", type: "site", price_tier: "free", purpose: "LATAM 기업·공고·신뢰도", b2b_b2c: "b2b", url: "https://connectamericas.com" },
  { id: "solostocks", name: "SoloStocks (LATAM)", description: "스페인어권 B2B 마켓플레이스·공업 부품·도매", category: "latam_b2b", type: "site", price_tier: "free", purpose: "MX/CO/CL 등 국가별 업체", b2b_b2c: "b2b", url: "https://www.solostocks.com" },
  { id: "quiminet", name: "QuimiNet", description: "중남미 산업용 B2B·화학·식품 원료·기계 부품", category: "latam_b2b", type: "site", price_tier: "free", purpose: "멕시코 중심 업체·리드", b2b_b2c: "b2b", url: "https://www.quiminet.com" },
  { id: "tradekey_latam", name: "TradeKey (Latin America)", description: "글로벌 B2B·중남미 전용 섹션·스페인어", category: "latam_b2b", type: "site", price_tier: "free", purpose: "LATAM 바이어·공급업체", b2b_b2c: "b2b", url: "https://www.tradekey.com" },
  { id: "conectnext", name: "ConectNext (LATAM)", description: "산업 기계·기술·고부가가치 솔루션 B2B 디렉토리", category: "latam_b2b", type: "site", price_tier: "free", purpose: "현지 산업체 네트워크", b2b_b2c: "b2b", url: "https://conectnext.com" },
  { id: "b2bmap_peru", name: "B2BMAP (Peru)", description: "페루 B2B·수만 공급업체·구매자", category: "latam_b2b", type: "site", price_tier: "free", purpose: "페루 업체·리드", b2b_b2c: "b2b", url: "https://www.b2bmap.com" },
  { id: "paginas_amarillas", name: "Páginas Amarillas (LATAM)", description: "아르헨티나 등 9개국 상업 노란 페이지", category: "directory_contact", type: "site", price_tier: "free", purpose: "현지 가동 업체·연락처", b2b_b2c: "b2b", url: "https://www.paginasamarillas.com" },
  { id: "telelistas_br", name: "Telelistas (Brasil)", description: "브라질 최대 온라인 전화번호부·지역·업종별", category: "directory_contact", type: "site", price_tier: "free", purpose: "BR 기업 번호 조회", b2b_b2c: "b2b", url: "https://www.telelistas.net" },
  { id: "seccion_amarilla_mx", name: "Sección Amarilla (México)", description: "멕시코 전역 기업 번호·주소", category: "directory_contact", type: "site", price_tier: "free", purpose: "MX 기업 DB", b2b_b2c: "b2b", url: "https://www.seccionamarilla.com.mx" },
  { id: "publicar_latam", name: "Publicar (LATAM)", description: "콜롬비아·칠레·페루 등 노란 페이지·통합 기업 DB", category: "directory_contact", type: "site", price_tier: "free", purpose: "CO/CL/PE 기업 검색", b2b_b2c: "b2b" },
  { id: "paginas_amarillas_rd", name: "Páginas Amarillas RD", description: "도미니카 기업·개인 번호·Claro/Altice 연계", category: "directory_contact", type: "site", price_tier: "free", purpose: "DO 현지 연락처", b2b_b2c: "b2b", url: "https://www.paginasamarillas.com.do" },
  // 도미니카 현지 B2B 핵심 기관
  { id: "aird_do", name: "AIRD (Rep. Dom.)", description: "Asociación de Industrias de la República Dominicana·제조·포장재 B2B", category: "export_promotion", type: "site", price_tier: "free", purpose: "DO 산업 협회 회원사", b2b_b2c: "b2b", url: "https://aird.org.do" },
  { id: "adoexpo_do", name: "ADOEXPO (Rep. Dom.)", description: "Asociación Dominicana de Exportadores·수출업체 협회", category: "export_promotion", type: "site", price_tier: "free", purpose: "DO 수출기업·물류 협력", b2b_b2c: "b2b", url: "https://adoexpo.org" },
  { id: "camara_santo_domingo", name: "Cámara de Comercio Santo Domingo", description: "산토도밍고 상공회의소·기업 디렉토리·유료/무료 DB", category: "export_promotion", type: "site", price_tier: "free", purpose: "DO 업데이트 빠른 기업 리스트", b2b_b2c: "b2b", url: "https://www.camarasantodomingo.do" },
  { id: "twilio_lookup", name: "Twilio Lookup", description: "전화번호 유효성·캐리어·B2B 공개 번호 검증", category: "directory_contact", type: "paid_api", price_tier: "low", purpose: "연락처 검증·WhatsApp 전 확인", b2b_b2c: "b2b", url: "https://www.twilio.com/lookup" },
];

export const DATA_SOURCE_CATEGORIES: { id: DataSourceCategory; label_ko: string; label_en: string; label_es: string }[] = [
  { id: "social_reviews", label_ko: "소셜·리뷰", label_en: "Social & reviews", label_es: "Social y reseñas" },
  { id: "trade_industry", label_ko: "무역·산업", label_en: "Trade & industry", label_es: "Comercio e industria" },
  { id: "manufacturing", label_ko: "제조·상공회의소", label_en: "Manufacturing & chambers", label_es: "Manufactura y cámaras" },
  { id: "export_promotion", label_ko: "수출지원·공고", label_en: "Export promotion & notices", label_es: "Fomento a exportación y avisos" },
  { id: "economic", label_ko: "경제·지표", label_en: "Economic indicators", label_es: "Indicadores económicos" },
  { id: "news", label_ko: "뉴스·미디어", label_en: "News & media", label_es: "Noticias y medios" },
  { id: "b2b_b2c", label_ko: "B2B·B2C 채널", label_en: "B2B/B2C channels", label_es: "Canales B2B/B2C" },
  { id: "latam_b2b", label_ko: "LATAM B2B", label_en: "LATAM B2B", label_es: "B2B LATAM" },
  { id: "directory_contact", label_ko: "연락처·디렉토리", label_en: "Directory & contact", label_es: "Directorio y contacto" },
];

const ANALYSIS: AnalysisTech[] = [
  { name: "GPT-4", description: "감정 분석, 테마 추출" },
  { name: "BERT", description: "토픽 모델링" },
  { name: "Custom NLP", description: "니즈 패턴 인식" },
];

const RESULTS: ResultOutput[] = [
  { id: "needs", title: "소비자 니즈 Top 10", period: "주간", output_type: "placeholder" },
  { id: "complaints", title: "불만 포인트 분석", period: "이슈별 집계", output_type: "placeholder" },
  { id: "intent", title: "구매 의도 신호 감지", period: "실시간", output_type: "placeholder" },
  { id: "segmented", title: "세분화 분석 결과", period: "조사 실행 후", output_type: "segmented", action_path: "#market-intel-segmented" },
  { id: "news_summary", title: "뉴스 요약", period: "국가별", output_type: "news_summary", action_path: "#market-intel-news" },
  { id: "report", title: "시장 리포트", period: "PDF/DOCX/Excel", output_type: "report", action_path: "#market-intel-report" },
];

/** 세분화 조사 시 호출하는 데이터소스 id (연동된 무료+선택 유료와 병합해 사용) */
export const SOURCE_IDS_FOR_SEGMENTED: string[] = ["un_comtrade", "world_bank", "opencorporates", "dgcp_do", "imf_data", "oecd_stat", "unido"];

/** 연동된(connected) 소스 id 목록 반환 */
export function getConnectedSourceIds(): string[] {
  return SOURCES.filter((s) => s.connected === true).map((s) => s.id);
}

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
  return getGranularRequest(orgId, countryCode);
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
  if (!request) {
    clearGranularRequest(orgId, countryCode);
    return null;
  }
  const current = getGranularRequest(orgId, countryCode);
  const rawTypes = request.research_types ?? current?.research_types ?? [];
  const research_types = sanitizeResearchTypes(rawTypes);
  const next: GranularAnalysisRequest = {
    country_code: String(request.country_code ?? current?.country_code ?? "").slice(0, 10),
    item: String(request.item ?? current?.item ?? "").slice(0, 500),
    hs_code: String(request.hs_code ?? current?.hs_code ?? "").slice(0, 50),
    research_types,
  };
  return setGranularRequest(orgId, countryCode, next);
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

/** 데이터소스 API 중 조사 시 호출 가능한 보강 소스 실행 (DGCP·IMF·OECD·UNIDO). enabledSourceIds 있으면 해당 id만 호출 */
async function runSupplementaryApis(
  request: GranularAnalysisRequest,
  options?: { enabledSourceIds?: Set<string> }
): Promise<{ data: SupplementaryResearchData; sourcesUsed: string[] }> {
  const country = (request.country_code || "").trim().toUpperCase().slice(0, 2);
  const sourcesUsed: string[] = [];
  const data: SupplementaryResearchData = {};
  const enabled = options?.enabledSourceIds;
  const runDgcp = !enabled || enabled.has("dgcp_do");
  const runImf = !enabled || enabled.has("imf_data");
  const runOecd = !enabled || enabled.has("oecd_stat");
  const runUnido = !enabled || enabled.has("unido");

  const [dgcpResult, imfResult, oecdResult, unidoResult] = await Promise.all([
    runDgcp && country === "DO"
      ? import("./externalApis/dgcpDominican.js").then((m) => m.fetchDgcpReleases({ limit: 10, q: request.item?.trim().slice(0, 100) })).then((r) => ({ releases: r.releases, total: r.total })).catch(() => null)
      : Promise.resolve(null),
    runImf ? import("./externalApis/imfData.js").then((m) => m.fetchWeoIndicator(country || "US", "NGDPD", 3)).catch(() => null) : Promise.resolve(null),
    runOecd ? import("./externalApis/oecd.js").then((m) => m.fetchOecdDataset("KEYINDICATORS", { country: country === "KR" ? "KOR" : country || "USA", limit: 5 })).catch(() => null) : Promise.resolve(null),
    runUnido ? import("./externalApis/unido.js").then((m) => m.fetchUnidoData("CIP", { countryCode: country || "156", limit: 5 })).catch(() => null) : Promise.resolve(null),
  ]);

  if (dgcpResult && dgcpResult.releases?.length) {
    data.dgcp = dgcpResult;
    sourcesUsed.push("DGCP (도미니카 정부조달)");
  }
  if (imfResult && Array.isArray(imfResult) && imfResult.length) {
    data.imf = imfResult;
    sourcesUsed.push("IMF Data");
  }
  if (oecdResult && Array.isArray(oecdResult) && oecdResult.length) {
    data.oecd = oecdResult;
    sourcesUsed.push("OECD Stat");
  }
  if (unidoResult && Array.isArray(unidoResult) && unidoResult.length) {
    data.unido = unidoResult;
    sourcesUsed.push("UNIDO");
  }
  return { data, sourcesUsed };
}

/** 세분화 분석 결과 (스텁 + 무료 API 연동) — top_players·related_companies 각 Top 10 */
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
      { name: "Sample Corp F", share_or_value: "7%", description: "" },
      { name: "Sample Corp G", share_or_value: "6%", description: "" },
      { name: "Sample Corp H", share_or_value: "5%", description: "" },
      { name: "Sample Corp I", share_or_value: "4%", description: "" },
      { name: "Sample Corp J", share_or_value: "4%", description: "" },
    ],
  }));
  const countryCode = request.country_code || "US";
  const productsOrHs = request.hs_code || request.item || "—";
  const related_companies: RecommendedCompany[] = [
    { company_name: "Global Trade Inc.", country_code: countryCode, products_or_hs: productsOrHs, contact: { email: "contact@example.com", source: "Public directory", as_of: asOf }, reason: lang === "ko" ? "동일 HS 수입 상위" : lang === "es" ? "Top importador mismo HS" : "Same HS top importer" },
    { company_name: "Regional Distributor Ltd.", country_code: countryCode, products_or_hs: productsOrHs, contact: { phone: "+1-555-0100", source: "Public directory", as_of: asOf }, reason: lang === "ko" ? "유사 품목 유통" : lang === "es" ? "Distribución producto similar" : "Similar product distribution" },
    { company_name: "Export Partners Co.", country_code: countryCode, products_or_hs: productsOrHs, contact: { source: "OpenCorporates / 무역통계베이스", as_of: asOf }, reason: lang === "ko" ? "동일 HS 수출 상위" : lang === "es" ? "Top exportador mismo HS" : "Same HS top exporter" },
    { company_name: "Industrial Supply Corp.", country_code: countryCode, products_or_hs: productsOrHs, contact: { source: "OpenCorporates / 무역통계베이스", as_of: asOf }, reason: lang === "ko" ? "유통·도매 업체" : lang === "es" ? "Distribución · mayorista" : "Distribution · wholesale" },
    { company_name: "Trade & Logistics Ltd.", country_code: countryCode, products_or_hs: productsOrHs, contact: { source: "OpenCorporates / 무역통계베이스", as_of: asOf }, reason: lang === "ko" ? "수입·물류 관련 업체" : lang === "es" ? "Importación · logística" : "Import · logistics" },
    { company_name: "Sample Corp F", country_code: countryCode, products_or_hs: productsOrHs, contact: { source: "OpenCorporates", as_of: asOf }, reason: lang === "ko" ? "무역·기업 DB 추천" : "Trade/company DB" },
    { company_name: "Sample Corp G", country_code: countryCode, products_or_hs: productsOrHs, contact: { source: "OpenCorporates", as_of: asOf }, reason: lang === "ko" ? "무역·기업 DB 추천" : "Trade/company DB" },
    { company_name: "Sample Corp H", country_code: countryCode, products_or_hs: productsOrHs, contact: { source: "OpenCorporates", as_of: asOf }, reason: lang === "ko" ? "무역·기업 DB 추천" : "Trade/company DB" },
    { company_name: "Sample Corp I", country_code: countryCode, products_or_hs: productsOrHs, contact: { source: "OpenCorporates", as_of: asOf }, reason: lang === "ko" ? "무역·기업 DB 추천" : "Trade/company DB" },
    { company_name: "Sample Corp J", country_code: countryCode, products_or_hs: productsOrHs, contact: { source: "OpenCorporates", as_of: asOf }, reason: lang === "ko" ? "무역·기업 DB 추천" : "Trade/company DB" },
  ];
  return { request, market_dominance, related_companies, data_sources_used: [...DEFAULT_DATA_SOURCES] };
}

const TOP_PLAYERS_COUNT = 10;

/** Comtrade 파트너국 상위 N건 → top_players 형식 (무역통계 근거). Top 10 반환 */
function comtradeRowsToTopPlayers(
  rows: { partnerDesc?: string; primaryValue?: number; cifvalue?: number }[],
  year: string,
  lang: ReportLanguage,
  researchType: "import" | "export"
): { name: string; share_or_value: string; description?: string; primaryValue?: number }[] {
  const total = rows.reduce((s, r) => s + (r.primaryValue ?? r.cifvalue ?? 0), 0);
  const sorted = [...rows]
    .filter((r) => (r.partnerDesc ?? "").trim() && (r.partnerDesc ?? "").trim() !== "World")
    .sort((a, b) => (b.primaryValue ?? b.cifvalue ?? 0) - (a.primaryValue ?? a.cifvalue ?? 0))
    .slice(0, TOP_PLAYERS_COUNT);
  const flowLabel = researchType === "export" ? (lang === "ko" ? "수출" : lang === "es" ? "exportación" : "export") : (lang === "ko" ? "수입" : lang === "es" ? "importación" : "import");
  const sourceLabel = "UN Comtrade (무역통계)";
  return sorted.map((r) => {
    const val = r.primaryValue ?? r.cifvalue ?? 0;
    const pct = total > 0 ? ((val / total) * 100).toFixed(1) + "%" : "—";
    return {
      name: (r.partnerDesc ?? "—").trim(),
      share_or_value: pct,
      description: `${year} ${flowLabel} · ${sourceLabel}`,
      primaryValue: r.primaryValue ?? r.cifvalue,
    };
  });
}

/** 세분화 분석 결과 (실데이터 보강: UN Comtrade 파트너국·무역액, World Bank, OpenCorporates 업체명). enabledSourceIds 있으면 해당 소스만 호출 */
export async function getSegmentedAnalysisResultAsync(
  request: GranularAnalysisRequest,
  lang: ReportLanguage = "ko",
  options?: { enabledSourceIds?: string[] }
): Promise<SegmentedAnalysisResult> {
  const base = getSegmentedAnalysisResult(request, lang);
  const country = (request.country_code || "").trim().toUpperCase().slice(0, 2);
  const sourcesUsed: string[] = [];
  const enabledSet = options?.enabledSourceIds?.length ? new Set(options.enabledSourceIds) : undefined;
  const useComtrade = !enabledSet || enabledSet.has("un_comtrade");
  const useWorldBank = !enabledSet || enabledSet.has("world_bank");
  const useOpenCorporates = !enabledSet || enabledSet.has("opencorporates");

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
    const hsCode = String(request.hs_code ?? "").trim();
    const cc = /^\d{4}(\d{2})?$/.test(hsCode) ? hsCode : "TOTAL";
    const [exportData, importData, gdpData, ocCompanies] = await Promise.all([
      useComtrade ? fetchTradeData({ ps: year, countryCode: country, rg: 2, maxRecords: 35, cc }) : [],
      useComtrade ? fetchTradeData({ ps: year, countryCode: country, rg: 1, maxRecords: 35, cc }) : [],
      useWorldBank ? fetchCountryIndicator(country === "KR" ? "KOR" : country, WORLD_BANK_INDICATORS.GDP, 1) : [],
      useOpenCorporates ? searchCompanies(request.item?.trim() || "trading", { jurisdictionCode: country.toLowerCase(), perPage: TOP_PLAYERS_COUNT }) : [],
    ]);

    const asOf = new Date().toISOString().slice(0, 10);
    const countryCode = request.country_code || country;
    const productsOrHs = request.hs_code || request.item || "—";

    // 시장 장악: 수입/수출은 Comtrade 파트너국(무역통계) 기준 상위 10개로 교체
    let newDominance = base.market_dominance.map((d) => {
      if (d.research_type === "export" && exportData.length > 0) {
        sourcesUsed.push("UN Comtrade (무역통계)");
        const players = comtradeRowsToTopPlayers(exportData, year, lang, "export");
        if (players.length >= TOP_PLAYERS_COUNT) return { ...d, top_players: players };
        return { ...d, top_players: [...players, ...d.top_players.slice(players.length)].slice(0, TOP_PLAYERS_COUNT) };
      }
      if (d.research_type === "import" && importData.length > 0) {
        if (!sourcesUsed.includes("UN Comtrade (무역통계)")) sourcesUsed.push("UN Comtrade (무역통계)");
        const players = comtradeRowsToTopPlayers(importData, year, lang, "import");
        if (players.length >= TOP_PLAYERS_COUNT) return { ...d, top_players: players };
        return { ...d, top_players: [...players, ...d.top_players.slice(players.length)].slice(0, TOP_PLAYERS_COUNT) };
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

    // 관련 업체 Top 10: OpenCorporates 실데이터로 채우고, 부족분은 기존 플레이스홀더 유지
    const ocSource = lang === "ko" ? "OpenCorporates / 무역통계베이스" : "OpenCorporates";
    if (ocCompanies.length > 0) {
      sourcesUsed.push("OpenCorporates (기업 DB)");
    }
    const related_companies: RecommendedCompany[] = ocCompanies.slice(0, TOP_PLAYERS_COUNT).map((c, i) => ({
      company_name: c.name || `Company ${i + 1}`,
      country_code: countryCode,
      products_or_hs: productsOrHs,
      contact: { source: ocSource, as_of: asOf },
      reason: lang === "ko" ? "무역·기업 DB 기반 추천" : lang === "es" ? "Recomendado por base de datos comercial" : "Recommended from trade/company DB",
    }));
    while (related_companies.length < TOP_PLAYERS_COUNT) {
      const fallback = base.related_companies[related_companies.length];
      if (fallback) related_companies.push(fallback);
      else break;
    }

    const supplementary = await runSupplementaryApis(request, enabledSet ? { enabledSourceIds: enabledSet } : undefined);
    const data_sources_used = [...new Set([...sourcesUsed, ...supplementary.sourcesUsed, ...(base.data_sources_used ?? DEFAULT_DATA_SOURCES)])];
    const hasSupplementary = supplementary.sourcesUsed.length > 0;
    return {
      ...base,
      market_dominance: newDominance,
      related_companies,
      data_sources_used,
      ...(hasSupplementary && { supplementary_data: supplementary.data }),
    };
  } catch {
    return { ...base, data_sources_used: base.data_sources_used ?? DEFAULT_DATA_SOURCES };
  }
}

export async function runMarketResearch(
  orgId: string,
  countryCode: string,
  request: GranularAnalysisRequest,
  lang: ReportLanguage = "ko"
): Promise<RunResearchResult> {
  setGranularAnalysisRequest(orgId, countryCode, request);
  const validLang = ["ko", "en", "es"].includes(lang) ? lang : "ko";
  const enabledPaid = getEnabledPaidSources(orgId);
  const enabledSourceIds = [...SOURCE_IDS_FOR_SEGMENTED, ...enabledPaid];
  const [segmented_result, news_items] = await Promise.all([
    getSegmentedAnalysisResultAsync(request, validLang, { enabledSourceIds }),
    getMarketNewsSummaryAsync(request.country_code || countryCode, validLang),
  ]);
  return { request, segmented_result, news_items };
}

/** 관련 업체 1~3위에 대해 OpenCorporates 등으로 상세 정보 수집 → 1업체 1페이지 요약용 */
export async function buildTopCompanyDetails(
  segmentedResult: SegmentedAnalysisResult,
  lang: ReportLanguage = "ko"
): Promise<TopCompanyDetail[]> {
  const companies = (segmentedResult.related_companies ?? []).slice(0, 3);
  if (companies.length === 0) return [];

  const { searchCompanies } = await import("./externalApis/opencorporates.js");
  const asOf = new Date().toISOString().slice(0, 10);
  const req = segmentedResult.request;
  const countryCode = (req.country_code || "").trim();
  const productsOrHs = req.hs_code || req.item || "—";
  const hsNote = /^\d{4}(\d{2})?$/.test(String(req.hs_code ?? "").trim())
    ? (lang === "ko" ? `HS ${req.hs_code} 기준` : lang === "es" ? `HS ${req.hs_code}` : `HS ${req.hs_code}`)
    : (lang === "ko" ? "전품목(TOTAL) 기준" : lang === "es" ? "Total productos" : "All products (TOTAL)");

  const out: TopCompanyDetail[] = [];
  for (let i = 0; i < companies.length; i++) {
    const c = companies[i];
    const rank = i + 1;
    let company_type: string | undefined;
    let contact: TopCompanyDetail["contact"] = {
      source: c.contact?.source ?? "OpenCorporates",
      as_of: c.contact?.as_of ?? asOf,
    };
    try {
      const jurisdiction = (c.country_code || countryCode).toLowerCase().slice(0, 2);
      const hits = await searchCompanies(c.company_name.trim().slice(0, 100), { jurisdictionCode: jurisdiction, perPage: 3 });
      const hit = hits.find((h) => h.name && (h.name.toLowerCase().includes(c.company_name.toLowerCase().slice(0, 20)) || c.company_name.toLowerCase().includes((h.name || "").toLowerCase().slice(0, 20)))) ?? hits[0];
      if (hit) {
        company_type = lang === "ko" ? "법인 (OpenCorporates)" : "Company (OpenCorporates)";
        contact = {
          source: "OpenCorporates",
          as_of: asOf,
          url: hit.opencorporates_url,
          company_number: hit.company_number,
          incorporation_date: hit.incorporation_date,
        };
      }
    } catch {
      // keep contact from c
      if (c.contact) contact = { ...contact, ...c.contact };
    }

    const trade_note = lang === "ko"
      ? `대상국(${countryCode}) 수입·수출 규모는 상단 시장 장악(수입/수출) 참조. ${hsNote}.`
      : lang === "es"
        ? `Import/export del país ${countryCode} ver sección dominancia. ${hsNote}.`
        : `Import/export for ${countryCode} see Market dominance. ${hsNote}.`;

    const product_preference_region = lang === "ko"
      ? `의뢰 품목: ${productsOrHs}. 해당 국가 시장 내 추천 업체(무역·기업 DB 기반).`
      : lang === "es"
        ? `Producto: ${productsOrHs}. Empresas recomendadas en el país (base datos comercio/empresas).`
        : `Item: ${productsOrHs}. Recommended companies in market (trade/company DB).`;

    out.push({
      rank,
      company_name: c.company_name,
      country_code: c.country_code || countryCode,
      products_or_hs: c.products_or_hs || productsOrHs,
      company_type,
      contact,
      trade_note,
      product_preference_region,
      reason: c.reason,
    });
  }
  return out;
}

export function getSources(): DataSource[] {
  return SOURCES;
}

export function getSourceCategories(lang: ReportLanguage = "ko"): { id: DataSourceCategory; label: string }[] {
  const key = lang === "es" ? "label_es" : lang === "en" ? "label_en" : "label_ko";
  return DATA_SOURCE_CATEGORIES.map((c) => ({ id: c.id, label: c[key] }));
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

/** 국가별 뉴스 캐시 (NewsData.io / Mediastack 결과) */
const countryNewsCache = new Map<string, { items: NewsSummaryItem[]; time: number }>();

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

/** 로컬 시장 데이터(정부조달 등) → 뉴스 형식. 국가별 데이터소스에서 다운로드 후 요약에 사용 */
async function getLocalMarketNewsItems(countryCode: string): Promise<NewsSummaryItem[]> {
  const key = (countryCode || "").trim().toUpperCase().slice(0, 2);
  if (!key) return [];
  try {
    if (key === "DO") {
      const { fetchDgcpReleases } = await import("./externalApis/dgcpDominican.js");
      const { releases } = await fetchDgcpReleases({ limit: 10, offset: 0 });
      const date = new Date().toISOString().slice(0, 10);
      return releases.slice(0, 10).map((r) => {
        const title = r.tender?.title ?? r.ocid ?? "DGCP 입찰";
        const summary = [r.tender?.status, r.date, (r.tag ?? []).join(", ")].filter(Boolean).join(" · ") || "도미니카 정부조달 공고";
        return {
          title,
          summary,
          source: "DGCP (도미니카 정부조달)",
          b2b_b2c: "b2b" as const,
          date: (r.date ?? date).toString().slice(0, 10),
        };
      });
    }
  } catch {
    // ignore
  }
  return [];
}

/** 국가별 뉴스 수집. 로컬 시장(DGCP 등) + NewsData.io → Mediastack → RSS */
async function getCountryNewsCached(countryCode: string, categoryFilter?: string): Promise<NewsSummaryItem[]> {
  const key = `${(countryCode || "ALL").trim().toUpperCase()}_${categoryFilter || "ALL"}`;
  const now = Date.now();
  const cached = countryNewsCache.get(key);
  if (cached && now - cached.time < RSS_CACHE_MS && cached.items.length > 0) return cached.items;

  let items: NewsSummaryItem[] = [];
  try {
    const localItems = categoryFilter ? [] : await getLocalMarketNewsItems(countryCode);
    const hasNewsData = (process.env.NEWSDATA_API_KEY ?? "").trim();
    const hasMediastack = (process.env.MEDIASTACK_ACCESS_KEY ?? "").trim();
    
    // NewsData.io/Mediastack API는 카테고리 필터 미지원 시 전체 데이터에서 가져옴 (추후 확장 가능)
    if (hasNewsData && countryCode !== "ALL" && !categoryFilter) {
      const { fetchNewsDataIo } = await import("./externalApis/newsDataIo.js");
      const raw = await fetchNewsDataIo(countryCode, { limit: 15 });
      items = raw.map((r) => ({ ...r, date: r.date || new Date().toISOString().slice(0, 10) }));
    }
    if (items.length === 0 && hasMediastack && countryCode !== "ALL" && !categoryFilter) {
      const { fetchMediastackNews } = await import("./externalApis/mediastack.js");
      const raw = await fetchMediastackNews(countryCode, { limit: 15 });
      items = raw.map((r) => ({ ...r, date: r.date || new Date().toISOString().slice(0, 10) }));
    }
    
    // 카테고리 필터가 있거나 API 결과가 없으면 RSS에서 가져옴
    if (items.length === 0) {
      const { fetchRssNewsItems } = await import("./externalApis/rssNews.js");
      items = (await fetchRssNewsItems(10, categoryFilter)) as any;
    }
    
    items = [...localItems, ...items];
  } catch {
    const { fetchRssNewsItems } = await import("./externalApis/rssNews.js");
    const local = categoryFilter ? [] : await getLocalMarketNewsItems(countryCode).catch(() => []);
    const rss = (await fetchRssNewsItems(10, categoryFilter)) as any;
    items = [...local, ...rss];
  }
  
  countryNewsCache.set(key, { items, time: now });
  if (countryNewsCache.size > 100) {
    const oldest = [...countryNewsCache.entries()].sort((a, b) => a[1].time - b[1].time)[0];
    if (oldest) countryNewsCache.delete(oldest[0]);
  }
  return items;
}

/** 관심 분야: b2b | b2c | both. 빈 배열이면 필터 없음 */
export async function getMarketNewsSummaryAsync(
  countryCode: string,
  lang: ReportLanguage = "ko",
  options?: { categories?: ("b2b" | "b2c" | "both")[]; categoryFilter?: string }
): Promise<NewsSummaryItem[]> {
  const stub = NEWS_SUMMARY_STUB[lang] ?? NEWS_SUMMARY_STUB.ko;
  const date = new Date().toISOString().slice(0, 10);
  const stubWithDate = stub.map((item) => ({ ...item, date: item.date || date }));
  
  const live = await getCountryNewsCached(countryCode || "ALL", options?.categoryFilter);
  let liveWithDate = live.map((item) => ({ ...item, date: item.date || date }));
  
  const cats = options?.categories;
  if (Array.isArray(cats) && cats.length > 0) {
    liveWithDate = liveWithDate.filter((item) => cats.includes(item.b2b_b2c));
  }
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
  const stored = getReportOptions(orgId, countryCode);
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
  const current = getReportOptions(orgId, countryCode) ?? { ...defaultReportOptions };
  const VALID_FORMATS = ["pdf", "word", "docx", "excel", "json"] as const;
  const rawFormat = options.format ?? current.format;
  const format = VALID_FORMATS.includes(rawFormat as (typeof VALID_FORMATS)[number]) ? rawFormat : current.format;
  const rawTier = options.report_tier ?? current.report_tier ?? "medium";
  const report_tier: ReportTier = VALID_REPORT_TIERS.includes(rawTier as ReportTier) ? (rawTier as ReportTier) : "medium";
  const rawPages = options.target_page_count ?? current.target_page_count ?? 20;
  const target_page_count = Math.max(TARGET_PAGE_MIN, Math.min(TARGET_PAGE_MAX, Number(rawPages) || 20));
  const next: MarketReportOutputOptions = {
    format,
    scope: options.scope ?? current.scope,
    schedule: options.schedule ?? current.schedule,
    sections: Array.isArray(options.sections) ? options.sections : current.sections,
    language: options.language ?? current.language ?? "ko",
    report_tier,
    target_page_count,
    layout_template: options.layout_template ?? current.layout_template ?? "standard",
  };
  return setReportOptions(orgId, countryCode, next);
}

export function getEnabledPaidSources(orgId: string): string[] {
  return getEnabledPaidSourcesForOrg(orgId);
}

export function setEnabledPaidSources(orgId: string, sourceIds: string[]): string[] {
  return setEnabledPaidSourcesForOrg(orgId, sourceIds);
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

/** 시장 리포트 생성: 데이터 수집 후 선택 포맷(PDF/DOCX/Excel/JSON)으로 파일 생성 및 다운로드 URL 반환 */
export type { MarketReportJob } from "./marketReportGenerator.js";
export { generateMarketReportAsync as generateMarketReport } from "./marketReportGenerator.js";
