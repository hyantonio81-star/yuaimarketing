import axios from "axios";
import { getCurrentCountryCode } from "./marketStore.js";
import { supabase } from "./supabase.js";

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

api.interceptors.request.use(async (config) => {
  const country = getCurrentCountryCode();
  if (country) config.headers["X-Country"] = country;
  if (supabase && typeof window !== "undefined") {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) config.headers.Authorization = `Bearer ${session.access_token}`;
    } catch (_) {
      // auth not ready or network error — proceed without token
    }
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const data = err?.response?.data;
    if (data && typeof data === "object" && (data.message || data.error)) {
      err.apiMessage = data.message || data.error;
    }
    return Promise.reject(err);
  }
);

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

/** Admin (관리자): 사용자 목록, bootstrap 상태/생성. Authorization Bearer 필요. */
export const adminApi = {
  getUsers: () => api.get("/admin/users").then((r) => r.data),
  getBootstrapStatus: () => api.get("/admin/bootstrap-status").then((r) => r.data),
  postBootstrap: (email, password) => api.post("/admin/bootstrap", { email, password }).then((r) => r.data),
};

/** YouTube Shorts 에이전트: 트렌드, 파이프라인, 작업, YouTube 연동, 아바타 */
export const shortsApi = {
  getTrends: (keywords, maxPerKeyword) =>
    api.get("/shorts/trends", { params: { keywords: keywords?.join(","), max_per_keyword: maxPerKeyword } }).then((r) => r.data),
  runPipeline: (keywords, options) =>
    api.post("/shorts/run", { keywords: keywords ?? [], avatarPresetId: options?.avatarPresetId, enableTts: options?.enableTts }).then((r) => r.data),
  getJobs: (limit) =>
    api.get("/shorts/jobs", { params: { limit } }).then((r) => r.data),
  getJob: (jobId) =>
    api.get(`/shorts/jobs/${jobId}`).then((r) => r.data),
  getAvatars: () =>
    api.get("/shorts/avatars").then((r) => r.data),
  getYoutubeAuthUrl: (state) =>
    api.get("/shorts/youtube/auth-url", { params: state ? { state } : {} }).then((r) => r.data),
  getYoutubeStatus: () =>
    api.get("/shorts/youtube/status").then((r) => r.data),
  disconnectYoutube: () =>
    api.post("/shorts/youtube/disconnect").then((r) => r.data),
};

/** 이커머스 채널 연동 (B2C). orgId 있으면 X-Organization-Id 헤더로 전달. */
export const ecommerceApi = {
  getConnections: (orgId) =>
    api.get("/b2c/connections", orgId ? { headers: { "X-Organization-Id": orgId } } : {}).then((r) => r.data),
  connectChannel: (body, orgId) =>
    api.post("/b2c/connections", body, orgId ? { headers: { "X-Organization-Id": orgId } } : {}).then((r) => r.data),
  disconnectChannel: (channel, orgId) =>
    api.delete("/b2c/connections", { params: { channel }, ...(orgId ? { headers: { "X-Organization-Id": orgId } } : {}) }).then((r) => r.data),
};

/** B2C AI 설정·승인 대기 (반자율화/자율화) */
export const b2cApi = {
  getSettings: (orgId) =>
    api.get("/b2c/settings", orgId ? { headers: { "X-Organization-Id": orgId } } : {}).then((r) => r.data),
  setSettings: (body, orgId) =>
    api.put("/b2c/settings", body, orgId ? { headers: { "X-Organization-Id": orgId } } : {}).then((r) => r.data),
  getPendingApprovals: (orgId, status) =>
    api.get("/b2c/pending-approvals", {
      params: status ? { status } : {},
      ...(orgId ? { headers: { "X-Organization-Id": orgId } } : {}),
    }).then((r) => r.data),
  approvePending: (id, orgId) =>
    api.post(`/b2c/pending-approvals/${id}/approve`, {}, orgId ? { headers: { "X-Organization-Id": orgId } } : {}).then((r) => r.data),
  rejectPending: (id, orgId) =>
    api.post(`/b2c/pending-approvals/${id}/reject`, {}, orgId ? { headers: { "X-Organization-Id": orgId } } : {}).then((r) => r.data),
};

export default api;
