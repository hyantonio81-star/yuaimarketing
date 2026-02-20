import { FastifyInstance } from "fastify";
import {
  getSources,
  getSourceCategories,
  getAnalysisTech,
  getResultOutputs,
  getMarketResearchTools,
  getMarketResearchServices,
  getReportOutputOptions,
  getDefaultReportOptions,
  getMarketReportOptions,
  setMarketReportOptions,
  getResearchTypeOptions,
  getGranularAnalysisRequest,
  setGranularAnalysisRequest,
  getSegmentedAnalysisResultAsync,
  getMarketNewsSummaryAsync,
  getEnabledPaidSources,
  setEnabledPaidSources,
  getReportTierOptions,
  generateMarketReport,
} from "../services/marketIntelService.js";

export async function marketIntelRoutes(app: FastifyInstance) {
  /** Data Sources (카테고리·유형·가격대). 쿼리 lang=ko|en|es 시 categories 포함 */
  app.get<{ Querystring: { lang?: string } }>("/sources", async (req) => {
    const lang = (req.query?.lang ?? "ko") as "ko" | "en" | "es";
    const validLang = ["ko", "en", "es"].includes(lang) ? lang : "ko";
    return {
      sources: getSources(),
      categories: getSourceCategories(validLang),
    };
  });
  app.get("/analysis", async () => ({ analysis: getAnalysisTech() }));
  app.get("/results", async () => ({ results: getResultOutputs() }));

  /** 시장 국가별 뉴스 요약 (무료 RSS: Reuters, BBC + 스텁) */
  app.get<{ Querystring: { country?: string; lang?: string } }>("/news-summary", async (req) => {
    const country = req.query?.country ?? "";
    const lang = (req.query?.lang ?? "ko") as "ko" | "en" | "es";
    const validLang = ["ko", "en", "es"].includes(lang) ? lang : "ko";
    const items = await getMarketNewsSummaryAsync(country, validLang);
    return { country, items };
  });

  /** 시장조사 툴 (소스·분석·아웃풋 강세) */
  app.get("/tools", async () => ({ tools: getMarketResearchTools() }));
  app.get("/services", async () => ({ services: getMarketResearchServices() }));

  /** 시장 리포트 출력 옵션 메타 (포맷/스코프/스케줄/섹션 목록). 쿼리 lang=ko|en|es 로 섹션 라벨 언어 지정 */
  app.get<{ Querystring: { lang?: string } }>("/report-options", async (req) => {
    const lang = (req.query?.lang ?? "ko") as "ko" | "en" | "es";
    const validLang = ["ko", "en", "es"].includes(lang) ? lang : "ko";
    return {
      sections: getReportOutputOptions(validLang),
      default: getDefaultReportOptions(),
    };
  });

  /** 조직·국가별 저장된 리포트 설정 조회 */
  app.get<{
    Querystring: { orgId?: string; country?: string };
  }>("/report-settings", async (req) => {
    const orgId = req.query?.orgId ?? "default";
    const country = req.query?.country ?? "ALL";
    return { options: getMarketReportOptions(orgId, country) };
  });

  /** 시장 리포트 출력 설정 저장 */
  app.put<{
    Body: { orgId?: string; country?: string; options?: Record<string, unknown> };
  }>("/report-settings", async (req, reply) => {
    const orgId = (req.body?.orgId as string) ?? "default";
    const country = (req.body?.country as string) ?? "ALL";
    const options = req.body?.options as Parameters<typeof setMarketReportOptions>[2] | undefined;
    if (!options) {
      return reply.status(400).send({ error: "options required" });
    }
    const updated = setMarketReportOptions(orgId, country, options);
    return { options: updated };
  });

  /** 시장 리포트 생성 (플레이스홀더: 옵션 저장 후 생성 파이프라인 연동 예정) */
  app.post<{ Body: { orgId?: string; country?: string } }>("/generate-report", async (req) => {
    const orgId = (req.body?.orgId as string) ?? "default";
    const country = (req.body?.country as string) ?? "ALL";
    const job = generateMarketReport(orgId, country);
    return job;
  });

  /** 유료 API 소스 사용자별 선택: 조회/저장 */
  app.get<{ Querystring: { orgId?: string } }>("/enabled-paid-sources", async (req) => {
    const orgId = req.query?.orgId ?? "default";
    return { enabled_paid_source_ids: getEnabledPaidSources(orgId) };
  });
  app.put<{ Body: { orgId?: string; enabled_paid_source_ids?: string[] } }>("/enabled-paid-sources", async (req) => {
    const orgId = (req.body?.orgId as string) ?? "default";
    const ids = (req.body?.enabled_paid_source_ids as string[] | undefined) ?? [];
    const updated = setEnabledPaidSources(orgId, ids);
    return { enabled_paid_source_ids: updated };
  });

  /** 리포트 등급 옵션 (중/고/최고). 쿼리 lang=ko|en|es */
  app.get<{ Querystring: { lang?: string } }>("/report-tier-options", async (req) => {
    const lang = (req.query?.lang ?? "ko") as "ko" | "en" | "es";
    return { options: getReportTierOptions(["ko", "en", "es"].includes(lang) ? lang : "ko") };
  });

  /** 조사유형 옵션 (세분화 분석) */
  app.get<{ Querystring: { lang?: string } }>("/research-types", async (req) => {
    const lang = (req.query?.lang ?? "ko") as "ko" | "en" | "es";
    return { options: getResearchTypeOptions(["ko", "en", "es"].includes(lang) ? lang : "ko") };
  });

  /** 세분화 분석의뢰 저장/조회 */
  app.get<{ Querystring: { orgId?: string; country?: string } }>("/granular-request", async (req) => {
    const orgId = req.query?.orgId ?? "default";
    const country = req.query?.country ?? "ALL";
    const request = getGranularAnalysisRequest(orgId, country);
    return { request };
  });

  app.put<{
    Body: { orgId?: string; country?: string; request?: Partial<import("../services/marketIntelService.js").GranularAnalysisRequest> | null };
  }>("/granular-request", async (req) => {
    const orgId = (req.body?.orgId as string) ?? "default";
    const country = (req.body?.country as string) ?? "ALL";
    const request = req.body?.request as Parameters<typeof setGranularAnalysisRequest>[2] | undefined;
    const updated = setGranularAnalysisRequest(orgId, country, request ?? null);
    return { request: updated };
  });

  /** 경제 지표 (World Bank 무료 API). country=KR&indicator=NY.GDP.MKTP.CD */
  app.get<{ Querystring: { country?: string; indicator?: string; per_page?: string } }>("/indicators", async (req) => {
    const country = (req.query?.country ?? "USA").trim().toUpperCase().slice(0, 3);
    const indicator = (req.query?.indicator ?? "NY.GDP.MKTP.CD").trim();
    const perPage = Math.min(20, Math.max(1, parseInt(req.query?.per_page ?? "5", 10) || 5));
    const { fetchCountryIndicator, WORLD_BANK_INDICATORS } = await import("../services/externalApis/worldBank.js");
    const code = country.length === 2 ? (country === "KR" ? "KOR" : country) : country;
    const data = await fetchCountryIndicator(code, indicator, perPage);
    return { country: code, indicator, data, indicators: WORLD_BANK_INDICATORS };
  });

  /** 경제 스냅샷 (World Bank + IMF + FRED). country=KR */
  app.get<{ Querystring: { country?: string } }>("/economic-snapshot", async (req) => {
    const country = (req.query?.country ?? "USA").trim().toUpperCase().slice(0, 2);
    const code = country === "KR" ? "KOR" : country;
    const [
      { fetchCountryIndicator, WORLD_BANK_INDICATORS },
      { fetchWeoIndicator, IMF_WEO_INDICATORS },
      { fetchSeries, FRED_SERIES_IDS },
    ] = await Promise.all([
      import("../services/externalApis/worldBank.js"),
      import("../services/externalApis/imfData.js"),
      import("../services/externalApis/fred.js"),
    ]);
    const [wbGdp, imfGdp, fredGdp] = await Promise.all([
      fetchCountryIndicator(code, WORLD_BANK_INDICATORS.GDP, 3),
      fetchWeoIndicator(country || "USA", "NGDPD", 3),
      fetchSeries(FRED_SERIES_IDS.GDP, { limit: 3 }).catch(() => []),
    ]);
    return {
      country: code,
      world_bank: { gdp: wbGdp },
      imf: { weo_ngdpd: imfGdp },
      fred: fredGdp.length > 0 ? { gdp: fredGdp } : undefined,
      meta: { indicators_wb: WORLD_BANK_INDICATORS, indicators_imf: IMF_WEO_INDICATORS, series_fred: FRED_SERIES_IDS },
    };
  });

  /** FRED 시계열 (FRED_API_KEY 설정 시). series_id=GDP&limit=10 */
  app.get<{ Querystring: { series_id?: string; limit?: string } }>("/series", async (req) => {
    const seriesId = (req.query?.series_id ?? "GDP").trim();
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit ?? "10", 10) || 10));
    const { fetchSeries } = await import("../services/externalApis/fred.js");
    const data = await fetchSeries(seriesId, { limit });
    return { series_id: seriesId, data };
  });

  /** IMF WEO 지표. country=USA&indicator=NGDPD */
  app.get<{ Querystring: { country?: string; indicator?: string; limit?: string } }>("/imf", async (req) => {
    const country = (req.query?.country ?? "USA").trim().toUpperCase().slice(0, 3);
    const indicator = (req.query?.indicator ?? "NGDPD").trim();
    const limit = Math.min(30, Math.max(1, parseInt(req.query?.limit ?? "10", 10) || 10));
    const { fetchWeoIndicator, IMF_WEO_INDICATORS } = await import("../services/externalApis/imfData.js");
    const data = await fetchWeoIndicator(country, indicator, limit);
    return { country, indicator, data, indicators: IMF_WEO_INDICATORS };
  });

  /** OECD 데이터셋. dataset=KEYINDICATORS&country=KOR */
  app.get<{ Querystring: { dataset?: string; country?: string; limit?: string } }>("/oecd", async (req) => {
    const dataset = (req.query?.dataset ?? "KEYINDICATORS").trim();
    const country = (req.query?.country ?? "KOR").trim().toUpperCase().slice(0, 3);
    const limit = Math.min(50, Math.max(1, parseInt(req.query?.limit ?? "10", 10) || 10));
    const { fetchOecdDataset, OECD_DATASETS } = await import("../services/externalApis/oecd.js");
    const data = await fetchOecdDataset(dataset, { country, limit });
    return { dataset, country, data, datasets: OECD_DATASETS };
  });

  /** UNIDO 제조·산업 통계. dataset=CIP&country_code=410 */
  app.get<{ Querystring: { dataset?: string; country_code?: string; limit?: string } }>("/unido", async (req) => {
    const dataset = (req.query?.dataset ?? "CIP").trim();
    const countryCode = (req.query?.country_code ?? "410").trim();
    const limit = Math.min(50, Math.max(1, parseInt(req.query?.limit ?? "10", 10) || 10));
    const { fetchUnidoData } = await import("../services/externalApis/unido.js");
    const data = await fetchUnidoData(dataset, { countryCode, limit });
    return { dataset, country_code: countryCode, data };
  });

  /** OpenCorporates 회사 검색 (OPENCOMPORATES_API_TOKEN 선택). q=회사명&jurisdiction_code=kr */
  app.get<{ Querystring: { q?: string; jurisdiction_code?: string; per_page?: string } }>("/companies", async (req) => {
    const q = (req.query?.q ?? "").trim().slice(0, 200);
    const jurisdictionCode = (req.query?.jurisdiction_code ?? "").trim() || undefined;
    const perPage = Math.min(30, Math.max(1, parseInt(req.query?.per_page ?? "10", 10) || 10));
    const { searchCompanies } = await import("../services/externalApis/opencorporates.js");
    const data = q ? await searchCompanies(q, { jurisdictionCode, perPage }) : [];
    return { q: q || null, companies: data };
  });

  /** YouTube 동영상 검색 (GOOGLE_API_KEY 또는 YOUTUBE_API_KEY) */
  app.get<{ Querystring: { q?: string; max_results?: string; order?: string; page_token?: string } }>("/youtube/search", async (req) => {
    const q = (req.query?.q ?? "").trim().slice(0, 200);
    const maxResults = Math.min(50, Math.max(1, parseInt(req.query?.max_results ?? "10", 10) || 10));
    const order = (req.query?.order === "date" || req.query?.order === "viewCount") ? req.query.order : "relevance";
    const { searchVideos } = await import("../services/externalApis/youtube.js");
    const result = q ? await searchVideos(q, { maxResults, order, pageToken: req.query?.page_token }) : { items: [] };
    return { q: q || null, ...result };
  });

  /** YouTube 동영상 댓글 (GOOGLE_API_KEY 또는 YOUTUBE_API_KEY). video_id=필수 */
  app.get<{ Querystring: { video_id?: string; max_results?: string; page_token?: string } }>("/youtube/comments", async (req) => {
    const videoId = (req.query?.video_id ?? "").trim();
    const maxResults = Math.min(100, Math.max(1, parseInt(req.query?.max_results ?? "20", 10) || 20));
    const { getCommentThreads } = await import("../services/externalApis/youtube.js");
    const result = videoId ? await getCommentThreads(videoId, { maxResults, pageToken: req.query?.page_token }) : { items: [] };
    return { video_id: videoId || null, ...result };
  });

  /** Google Trends (SerpApi 유료, SERPAPI_KEY). q=키워드&geo=KR */
  app.get<{ Querystring: { q?: string; data_type?: string; geo?: string; hl?: string; limit?: string } }>("/trends", async (req) => {
    const q = (req.query?.q ?? "").trim().slice(0, 100);
    const data_type = (req.query?.data_type ?? "TIMESERIES").trim();
    const limit = Math.min(90, Math.max(1, parseInt(req.query?.limit ?? "30", 10) || 30));
    const { getGoogleTrends } = await import("../services/externalApis/serpApi.js");
    const data = q ? await getGoogleTrends(q, { data_type: data_type as "TIMESERIES" | "GEO_MAP" | "RELATED_TOPICS" | "RELATED_QUERIES", geo: req.query?.geo, hl: req.query?.hl, limit }) : null;
    return { q: q || null, data };
  });

  /** Google 검색 결과 — SerpApi (유료 SERPAPI_KEY) 또는 Custom Search (무료 100회/일: GOOGLE_API_KEY+GOOGLE_CSE_ID) */
  app.get<{ Querystring: { q?: string; num?: string; country?: string; hl?: string; engine?: string } }>("/google-search", async (req) => {
    const q = (req.query?.q ?? "").trim().slice(0, 300);
    const num = Math.min(20, Math.max(1, parseInt(req.query?.num ?? "10", 10) || 10));
    const engine = (req.query?.engine ?? "serp").toLowerCase();
    if (!q) return { q: null, items: [], engine: null };
    if (engine === "custom") {
      const { customSearch } = await import("../services/externalApis/googleSearch.js");
      const result = await customSearch(q, { num, country: req.query?.country, lang: req.query?.hl });
      return { q, items: result.items, totalResults: result.totalResults, nextStartIndex: result.nextStartIndex, engine: "google_custom" };
    }
    const { getGoogleSearch } = await import("../services/externalApis/serpApi.js");
    const result = await getGoogleSearch(q, { num, country: req.query?.country, hl: req.query?.hl });
    return { q, items: result.items, total: result.total, engine: "serpapi" };
  });

  /** 도미니카공화국 DGCP 정부조달 오픈데이터 (OCDS). limit, offset, updated_from, updated_to, q */
  app.get<{ Querystring: { limit?: string; offset?: string; updated_from?: string; updated_to?: string; q?: string } }>("/dgcp-dominican", async (req) => {
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit ?? "20", 10) || 20));
    const offset = Math.max(0, parseInt(req.query?.offset ?? "0", 10) || 0);
    const { fetchDgcpReleases } = await import("../services/externalApis/dgcpDominican.js");
    const result = await fetchDgcpReleases({
      limit,
      offset,
      updatedFrom: req.query?.updated_from,
      updatedTo: req.query?.updated_to,
      q: req.query?.q?.trim().slice(0, 200),
    });
    return { ...result, source: "DGCP Dominican Republic" };
  });

  /** Facebook 페이지 ID로 조회 (FB_ACCESS_TOKEN 또는 FB_APP_ID+FB_APP_SECRET) */
  app.get<{ Querystring: { page_id?: string } }>("/facebook/page", async (req) => {
    const pageId = (req.query?.page_id ?? "").trim();
    const { getPageById } = await import("../services/externalApis/facebookGraph.js");
    const data = pageId ? await getPageById(pageId) : null;
    return { page_id: pageId || null, page: data };
  });

  /** Facebook 페이지 검색 (FB_ACCESS_TOKEN 필요, PPMA App Review 필요할 수 있음) */
  app.get<{ Querystring: { q?: string; limit?: string } }>("/facebook/search", async (req) => {
    const q = (req.query?.q ?? "").trim().slice(0, 100);
    const limit = Math.min(25, Math.max(1, parseInt(req.query?.limit ?? "10", 10) || 10));
    const { searchPages } = await import("../services/externalApis/facebookGraph.js");
    const pages = q ? await searchPages(q, { limit }) : [];
    return { q: q || null, pages };
  });

  /** 세분화 분석 결과 (시장 장악 + 관련 업체). 쿼리 또는 저장된 의뢰 사용 */
  app.get<{
    Querystring: { orgId?: string; country?: string; lang?: string; country_code?: string; item?: string; hs_code?: string; research_types?: string };
  }>("/segmented-analysis-results", async (req) => {
    const lang = (req.query?.lang ?? "ko") as "ko" | "en" | "es";
    const validLang = ["ko", "en", "es"].includes(lang) ? lang : "ko";
    let reqBody: import("../services/marketIntelService.js").GranularAnalysisRequest;
    const saved = getGranularAnalysisRequest(req.query?.orgId ?? "default", req.query?.country ?? "ALL");
    const validResearchTypes = ["import", "export", "distribution", "consumption", "manufacturing"] as const;
    if (req.query?.country_code != null || req.query?.item != null || req.query?.hs_code != null || req.query?.research_types != null) {
      const rawTypes = req.query.research_types
        ? req.query.research_types.split(",").map((s) => s.trim()).filter(Boolean)
        : saved?.research_types ?? ["import", "export"];
      const types = rawTypes.filter((t): t is import("../services/marketIntelService.js").ResearchType =>
        validResearchTypes.includes(t as typeof validResearchTypes[number])
      );
      reqBody = {
        country_code: (req.query?.country_code as string) ?? saved?.country_code ?? "",
        item: (req.query?.item as string) ?? saved?.item ?? "",
        hs_code: (req.query?.hs_code as string) ?? saved?.hs_code ?? "",
        research_types: types,
      };
    } else if (saved) {
      reqBody = saved;
    } else {
      reqBody = { country_code: "", item: "", hs_code: "", research_types: ["import", "export"] };
    }
    const result = await getSegmentedAnalysisResultAsync(reqBody, validLang);
    return result;
  });
}
