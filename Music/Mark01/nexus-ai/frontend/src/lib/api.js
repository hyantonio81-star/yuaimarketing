import axios from "axios";
import { getCurrentCountryCode } from "./marketStore.js";

const explicit = import.meta.env.VITE_API_URL;
const API_BASE =
  explicit !== undefined && explicit !== ""
    ? explicit
    : typeof window !== "undefined" && window.location?.hostname !== "localhost"
      ? ""
      : "http://localhost:4000";

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const country = getCurrentCountryCode();
  if (country) config.headers["X-Country"] = country;
  return config;
});

/** Market Intel (Pillar 1) */
export const marketIntelApi = {
  getSources: (lang) =>
    api.get("/market-intel/sources", { params: lang ? { lang } : {} }).then((r) => r.data),
  getNewsSummary: (country, lang) =>
    api.get("/market-intel/news-summary", { params: { country, lang } }).then((r) => r.data),
  getAnalysis: () => api.get("/market-intel/analysis").then((r) => r.data),
  getResults: () => api.get("/market-intel/results").then((r) => r.data),
  getTools: () => api.get("/market-intel/tools").then((r) => r.data),
  getServices: () => api.get("/market-intel/services").then((r) => r.data),
  getReportOptions: (lang) =>
    api.get("/market-intel/report-options", { params: lang ? { lang } : {} }).then((r) => r.data),
  getReportSettings: (orgId, country) =>
    api.get("/market-intel/report-settings", { params: { orgId, country } }).then((r) => r.data),
  setReportSettings: (orgId, country, options) =>
    api.put("/market-intel/report-settings", { orgId, country, options }).then((r) => r.data),
  getResearchTypes: (lang) =>
    api.get("/market-intel/research-types", { params: lang ? { lang } : {} }).then((r) => r.data),
  getGranularRequest: (orgId, country) =>
    api.get("/market-intel/granular-request", { params: { orgId, country } }).then((r) => r.data),
  setGranularRequest: (orgId, country, request) =>
    api.put("/market-intel/granular-request", { orgId, country, request }).then((r) => r.data),
  getSegmentedAnalysisResults: (params) =>
    api.get("/market-intel/segmented-analysis-results", { params }).then((r) => r.data),
  getEnabledPaidSources: (orgId) =>
    api.get("/market-intel/enabled-paid-sources", { params: { orgId: orgId ?? "default" } }).then((r) => r.data),
  setEnabledPaidSources: (orgId, enabledPaidSourceIds) =>
    api.put("/market-intel/enabled-paid-sources", { orgId: orgId ?? "default", enabled_paid_source_ids: enabledPaidSourceIds }).then((r) => r.data),
  getReportTierOptions: (lang) =>
    api.get("/market-intel/report-tier-options", { params: lang ? { lang } : {} }).then((r) => r.data),
  generateReport: (orgId, country) =>
    api.post("/market-intel/generate-report", { orgId: orgId ?? "default", country: country ?? "ALL" }).then((r) => r.data),
  getIndicators: (country, indicator, perPage) =>
    api.get("/market-intel/indicators", { params: { country, indicator, per_page: perPage } }).then((r) => r.data),
  getEconomicSnapshot: (country) =>
    api.get("/market-intel/economic-snapshot", { params: { country } }).then((r) => r.data),
  getSeries: (seriesId, limit) =>
    api.get("/market-intel/series", { params: { series_id: seriesId, limit } }).then((r) => r.data),
  getImf: (country, indicator, limit) =>
    api.get("/market-intel/imf", { params: { country, indicator, limit } }).then((r) => r.data),
  getOecd: (dataset, country, limit) =>
    api.get("/market-intel/oecd", { params: { dataset, country, limit } }).then((r) => r.data),
  getUnido: (dataset, countryCode, limit) =>
    api.get("/market-intel/unido", { params: { dataset, country_code: countryCode, limit } }).then((r) => r.data),
  getCompanies: (q, jurisdictionCode, perPage) =>
    api.get("/market-intel/companies", { params: { q, jurisdiction_code: jurisdictionCode, per_page: perPage } }).then((r) => r.data),
  getYoutubeSearch: (q, maxResults, order, pageToken) =>
    api.get("/market-intel/youtube/search", { params: { q, max_results: maxResults, order, page_token: pageToken } }).then((r) => r.data),
  getYoutubeComments: (videoId, maxResults, pageToken) =>
    api.get("/market-intel/youtube/comments", { params: { video_id: videoId, max_results: maxResults, page_token: pageToken } }).then((r) => r.data),
  getTrends: (q, dataType, geo, hl, limit) =>
    api.get("/market-intel/trends", { params: { q, data_type: dataType, geo, hl, limit } }).then((r) => r.data),
  getGoogleSearch: (q, num, country, hl, engine) =>
    api.get("/market-intel/google-search", { params: { q, num, country, hl, engine } }).then((r) => r.data),
  getDgcpDominican: (params) =>
    api.get("/market-intel/dgcp-dominican", { params }).then((r) => r.data),
  getFacebookPage: (pageId) =>
    api.get("/market-intel/facebook/page", { params: { page_id: pageId } }).then((r) => r.data),
  getFacebookSearch: (q, limit) =>
    api.get("/market-intel/facebook/search", { params: { q, limit } }).then((r) => r.data),
};

/** Competitor Tracking (Pillar 1) */
export const competitorsApi = {
  getList: (orgId, country) =>
    api.get("/competitors/list", { params: { orgId: orgId ?? "default", country: country ?? "ALL" } }).then((r) => r.data),
  addCompetitor: (orgId, country, body) =>
    api.post("/competitors/list", { orgId: orgId ?? "default", country: country ?? "ALL", ...body }).then((r) => r.data),
  deleteCompetitor: (orgId, country, id) =>
    api.delete("/competitors/list", { params: { orgId: orgId ?? "default", country: country ?? "ALL", id } }).then((r) => r.data),
  getEvents: (orgId, country, limit) =>
    api.get("/competitors/events", { params: { orgId: orgId ?? "default", country: country ?? "ALL", limit } }).then((r) => r.data),
  getReports: (orgId, country) =>
    api.get("/competitors/reports", { params: { orgId: orgId ?? "default", country: country ?? "ALL" } }).then((r) => r.data),
  generateReport: (orgId, country, schedule) =>
    api.post("/competitors/reports/generate", { orgId: orgId ?? "default", country: country ?? "ALL", schedule: schedule ?? "once" }).then((r) => r.data),
  getAlertSettings: (orgId, country) =>
    api.get("/competitors/alert-settings", { params: { orgId: orgId ?? "default", country: country ?? "ALL" } }).then((r) => r.data),
  setAlertSettings: (orgId, country, settings) =>
    api.put("/competitors/alert-settings", { orgId: orgId ?? "default", country: country ?? "ALL", settings }).then((r) => r.data),
  getTrackingProfile: (orgId, country) =>
    api.get("/competitors/tracking-profile", { params: { orgId: orgId ?? "default", country: country ?? "ALL" } }).then((r) => r.data),
  setTrackingProfile: (orgId, country, body) =>
    api.put("/competitors/tracking-profile", { orgId: orgId ?? "default", country: country ?? "ALL", ...body }).then((r) => r.data),
  getIndustryOptions: (lang) =>
    api.get("/competitors/industry-options", { params: lang ? { lang } : {} }).then((r) => r.data),
};

export default api;
