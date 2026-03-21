import axios from "axios";
import { getCurrentCountryCode } from "./marketStore.js";
import { supabase } from "./supabase.js";

const explicit = import.meta.env.VITE_API_URL;
const isLocalHost =
  typeof window !== "undefined" &&
  (window.location?.hostname === "localhost" || window.location?.hostname === "127.0.0.1");
const API_BASE =
  explicit !== undefined && explicit !== ""
    ? explicit
    : isLocalHost
      ? "" // Vite proxy forwards /api to backend :4000
      : "";

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { "Content-Type": "application/json" },
});
let handlingUnauthorized = false;
const jobVideoUrlCache = new Map();

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
    if (data && typeof data === "object") {
      const msg = typeof data.message === "string" ? data.message : typeof data.error === "string" ? data.error : data.error?.message;
      if (msg) err.apiMessage = msg;
    }
    if (err?.response?.status === 401 && typeof window !== "undefined" && !handlingUnauthorized) {
      const currentPath = window.location?.pathname ?? "";
      if (!currentPath.startsWith("/login")) {
        handlingUnauthorized = true;
        Promise.resolve()
          .then(async () => {
            try {
              if (supabase) {
                await supabase.auth.signOut();
              }
            } catch {
              // ignore sign-out errors and continue redirect
            }
            window.location.replace("/login?reason=session_expired");
          })
          .finally(() => {
            handlingUnauthorized = false;
          });
      }
    }
    return Promise.reject(err);
  }
);

/**
 * Extract a safe string from API error (any type of input).
 * Always returns a string to avoid React Error #31.
 */
export function getApiErrorMessage(e, fallback = "An error occurred.") {
  if (!e) return fallback;
  if (typeof e === "string") return e;

  // Handle Axios/Fetch error objects
  const data = e?.response?.data;
  const err = data?.error;
  const msg = data?.message;

  if (typeof err === "string") return err;
  if (typeof msg === "string") return msg;

  // Handle nested error objects like { error: { message: "..." } }
  if (err && typeof err === "object" && typeof err.message === "string") return err.message;
  if (msg && typeof msg === "object" && typeof msg.message === "string") return msg.message;

  // Handle standard Error objects or custom apiMessage
  if (e.apiMessage && typeof e.apiMessage === "string") return e.apiMessage;
  if (e.message && typeof e.message === "string") return e.message;

  // Fallback to JSON stringify if it's an object we don't recognize
  try {
    if (typeof e === "object") {
      const str = JSON.stringify(e);
      return str.length > 100 ? str.slice(0, 100) + "..." : str;
    }
  } catch (_) {
    // ignore
  }

  return String(e) || fallback;
}

/** Market Intel (Pillar 1) */
export const marketIntelApi = {
  getSources: (lang) =>
    api.get("/market-intel/sources", { params: lang ? { lang } : {} }).then((r) => r.data),
  getNewsSummary: (country, lang, options) => {
    const params = { country, lang };
    if (Array.isArray(options?.categories) && options.categories.length) params.categories = options.categories.join(",");
    return api.get("/market-intel/news-summary", { params }).then((r) => r.data);
  },
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
  runResearch: (body) =>
    api.post("/market-intel/run-research", body, { timeout: 60000 }).then((r) => r.data),
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

/** SEO · Threads Commerce (스레드 x 아마존 자동화) */
export const threadsCommerceApi = {
  getProducts: (params) =>
    api.get("/seo/threads-commerce/products", { params }).then((r) => r.data),
  getSettings: () =>
    api.get("/seo/threads-commerce/settings").then((r) => r.data),
  setSettings: (body) =>
    api.put("/seo/threads-commerce/settings", body).then((r) => r.data),
  getConnection: () =>
    api.get("/seo/threads-commerce/connection").then((r) => r.data),
  connect: (body) =>
    api.post("/seo/threads-commerce/connection", body).then((r) => r.data),
  disconnect: () =>
    api.post("/seo/threads-commerce/connection/disconnect").then((r) => r.data),
  getRateLimit: () =>
    api.get("/seo/threads-commerce/rate-limit").then((r) => r.data),
  getPostLog: (limit) =>
    api.get("/seo/threads-commerce/post-log", { params: limit != null ? { limit } : {} }).then((r) => r.data),
  run: (body) =>
    api.post("/seo/threads-commerce/run", body || {}).then((r) => r.data),
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

/** 사용자 설정: 연동 전용 PIN */
export const userSettingsApi = {
  getConnectionPinConfig: () => api.get("/user/connection-pin").then((r) => r.data),
  setConnectionPin: (pin) => api.post("/user/connection-pin", { action: "set", pin }).then((r) => r.data),
  verifyConnectionPin: (pin) => api.post("/user/connection-pin", { action: "verify", pin }).then((r) => r.data),
};

/** Admin (관리자): 사용자 목록, bootstrap 상태/생성. Authorization Bearer 필요. */
export const adminApi = {
  getUsers: () => api.get("/admin/users").then((r) => r.data),
  getBootstrapStatus: () => api.get("/admin/bootstrap-status").then((r) => r.data),
  postBootstrap: (email, password) => api.post("/admin/bootstrap", { email, password }).then((r) => r.data),
};

/** KPI 목표 (BSC·SMART). 로그인 필수. */
export const kpiApi = {
  getGoals: () => api.get("/kpi/goals").then((r) => r.data),
  setGoals: (goals) => api.put("/kpi/goals", { goals }).then((r) => r.data),
};

/** KPI 감사원: 일과 루틴·KPI 감사 보고서 */
export const auditorApi = {
  getReport: () => api.get("/nexus/auditor/report").then((r) => r.data),
};

/** YouTube Shorts 에이전트: 트렌드, 파이프라인, 작업, YouTube 연동, 아바타 */
export const shortsApi = {
  getTrends: (keywords, maxPerKeyword) =>
    api.get("/shorts/trends", { params: { keywords: keywords?.join(","), max_per_keyword: maxPerKeyword } }).then((r) => r.data),
  runPipeline: (keywords, options) =>
    api.post("/shorts/run", {
      keywords: keywords ?? [],
      avatarPresetId: options?.avatarPresetId,
      enableTts: options?.enableTts,
      noBgm: options?.noBgm,
      voiceGender: options?.voiceGender,
      voiceAge: options?.voiceAge,
      voiceTone: options?.voiceTone,
      voiceSpeed: options?.voiceSpeed,
      voicePitch: options?.voicePitch,
      format: options?.format,
      targetDurationSeconds: options?.targetDurationSeconds,
      uploadMode: options?.uploadMode,
      characterAge: options?.characterAge,
      characterGender: options?.characterGender,
      bgmGenre: options?.bgmGenre,
      bgmMood: options?.bgmMood,
      bgmVolume: options?.bgmVolume,
      platforms: options?.platforms,
    }).then((r) => r.data),
  getPlatforms: () =>
    api.get("/shorts/platforms").then((r) => r.data),
  getHealth: () =>
    api.get("/shorts/health").then((r) => r.data),
  getJobs: (limit) =>
    api.get("/shorts/jobs", { params: { limit } }).then((r) => r.data),
  getJob: (jobId) =>
    api.get(`/shorts/jobs/${jobId}`).then((r) => r.data),
  getLibrary: () =>
    api.get("/shorts/library").then((r) => r.data),
  getChecklist: (limit) =>
    api.get("/shorts/checklist", { params: limit != null ? { limit } : {} }).then((r) => r.data),
  getJobVideoUrl: async (jobId) => {
    if (jobVideoUrlCache.has(jobId)) return jobVideoUrlCache.get(jobId);
    const res = await api.get(`/shorts/jobs/${jobId}/video`, { responseType: "blob" });
    const blobUrl = URL.createObjectURL(res.data);
    jobVideoUrlCache.set(jobId, blobUrl);
    return blobUrl;
  },
  revokeJobVideoUrl: (jobId) => {
    const url = jobVideoUrlCache.get(jobId);
    if (url) {
      URL.revokeObjectURL(url);
      jobVideoUrlCache.delete(jobId);
    }
  },
  uploadJob: (jobId, youtubeKey = "default", platforms) =>
    api.post(`/shorts/jobs/${jobId}/upload`, { youtubeKey, platforms }).then((r) => r.data),
  getChannelDefaults: (channelKey) =>
    api.get(`/shorts/channels/${channelKey}/defaults`).then((r) => r.data),
  setChannelDefaults: (channelKey, defaults) =>
    api.put(`/shorts/channels/${channelKey}/defaults`, defaults).then((r) => r.data),
  getAvatars: () =>
    api.get("/shorts/avatars").then((r) => r.data),
  getYoutubeAccounts: () =>
    api.get("/shorts/youtube/accounts").then((r) => r.data),
  getYoutubeAuthUrl: (key) =>
    api.get("/shorts/youtube/auth-url", { params: key ? { key } : {} }).then((r) => r.data),
  getYoutubeStatus: (key) =>
    api.get("/shorts/youtube/status", { params: key ? { key } : {} }).then((r) => r.data),
  disconnectYoutube: (key) =>
    api.post("/shorts/youtube/disconnect", key ? { key } : {}).then((r) => r.data),
  setYoutubeAccountLabel: (key, label) =>
    api.put(`/shorts/youtube/accounts/${encodeURIComponent(key)}`, { label }).then((r) => r.data),
  requestYoutubeAccount: (body) =>
    api.post("/shorts/youtube/account-request", body).then((r) => r.data),
  /** 채널 프로필 (웹에서만 설정·운영, 배포 없이 툭딱) */
  getChannelProfiles: (platform = "youtube") =>
    api.get("/shorts/channel-profiles", { params: { platform } }).then((r) => r.data),
  getChannelProfile: (key, platform = "youtube") =>
    api.get(`/shorts/channel-profiles/${encodeURIComponent(key)}`, { params: { platform } }).then((r) => r.data),
  setChannelProfile: (key, profile, platform = "youtube") =>
    api.put(`/shorts/channel-profiles/${encodeURIComponent(key)}`, profile, { params: { platform } }).then((r) => r.data),
  
  /** 배포 관리 API */
  addToDistributionQueue: (jobIds, platforms, scheduledAt) =>
    api.post("/shorts/distribution/queue", { jobIds, platforms, scheduledAt }).then((r) => r.data),
  getDistributionQueue: () =>
    api.get("/shorts/distribution/queue").then((r) => r.data),
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
  /** 시뮬레이션용 제품 목록 (제휴 shortlist) */
  getSimulationProducts: (params = {}, orgId) =>
    api.get("/b2c/simulation-products", {
      params: { marketplace: params.marketplace || "amazon", limit: params.limit ?? 10, min_score: params.min_score },
      ...(orgId ? { headers: { "X-Organization-Id": orgId } } : {}),
    }).then((r) => r.data),
};

export default api;
