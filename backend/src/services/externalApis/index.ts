/**
 * 시스템 필요 무료 API 연동
 * - World Bank Open Data (지표·프로젝트)
 * - FRED (환경변수 FRED_API_KEY 있을 때)
 * - UN Comtrade (무역 통계)
 * - RSS 뉴스 (Reuters, BBC)
 * - IMF Data (WEO 지표)
 * - OECD Stat (무역·산업 지표)
 */

export {
  fetchCountryIndicator,
  fetchProjectsSearch,
  WORLD_BANK_INDICATORS,
  type WorldBankIndicatorPoint,
  type WorldBankCountryIndicatorResponse,
  type WorldBankProjectHit,
} from "./worldBank.js";

export {
  fetchSeries,
  FRED_SERIES_IDS,
  type FredSeriesPoint,
} from "./fred.js";

export {
  fetchTradeData,
  type ComtradeQueryParams,
  type ComtradeDataRow,
  type ComtradeResponse,
} from "./unComtrade.js";

export { fetchRssNewsItems, type RssNewsItem } from "./rssNews.js";

export {
  fetchWeoIndicator,
  IMF_WEO_INDICATORS,
  type ImfSeriesPoint,
} from "./imfData.js";

export {
  fetchOecdDataset,
  OECD_DATASETS,
  type OecdDataPoint,
} from "./oecd.js";

export {
  fetchUnidoData,
  type UnidoDataPoint,
} from "./unido.js";

export {
  searchCompanies,
  type OpenCorporatesCompany,
} from "./opencorporates.js";

export {
  searchVideos,
  getCommentThreads,
  type YouTubeSearchItem,
  type YouTubeCommentItem,
} from "./youtube.js";

export {
  getGoogleTrends,
  getGoogleSearch,
  type SerpApiTrendsResult,
  type SerpApiSearchResultItem,
} from "./serpApi.js";

export {
  customSearch,
  type GoogleSearchItem,
} from "./googleSearch.js";

export {
  fetchDgcpReleases,
  type DgcpReleaseItem,
  type DgcpSearchResult,
} from "./dgcpDominican.js";

export {
  getPageById,
  searchPages,
  type FacebookPageInfo,
} from "./facebookGraph.js";
