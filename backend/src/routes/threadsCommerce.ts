import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { MarketplaceId } from "../services/threadsCommerce/types.js";
import {
  fetchProductsByMarketplace,
  getPromoShortlist,
  getThreadsConnection,
  setThreadsConnection,
  disconnectThreads,
  canPublishNow,
  getSettings,
  setSettings,
  runPipelineOnce,
  getPublishRateLimit,
  getPostLog,
} from "../services/threadsCommerce/index.js";

export async function threadsCommerceRoutes(app: FastifyInstance) {
  const accountId = "default";

  /** 이커머스 상품 목록 (marketplace: amazon | shein | temu | aliexpress) */
  app.get<{
    Querystring: { category?: string; source?: string; limit?: string; marketplace?: string };
  }>("/products", async (req) => {
    const q = req.query ?? {};
    const limit = Math.min(50, Math.max(1, parseInt(q.limit ?? "10", 10) || 10));
    const marketplace = (q.marketplace as MarketplaceId) || "amazon";
    const products = await fetchProductsByMarketplace(marketplace, {
      category: q.category,
      source: q.source as "bestsellers" | "movers_shakers" | "both" | undefined,
      limit,
    });
    return { products };
  });

  /** 홍보 후보 shortlist: 제휴 상품 + 인기·AI팀 점수, min_score 필터 (인기 상품 해석 기획) */
  app.get<{
    Querystring: { category?: string; source?: string; limit?: string; marketplace?: string; min_score?: string };
  }>("/shortlist", async (req) => {
    const q = req.query ?? {};
    const limit = Math.min(50, Math.max(1, parseInt(q.limit ?? "20", 10) || 20));
    const marketplace = (q.marketplace as MarketplaceId) || "amazon";
    const min_score = q.min_score != null ? parseInt(String(q.min_score), 10) : undefined;
    return getPromoShortlist(marketplace, {
      category: q.category,
      source: q.source as "bestsellers" | "movers_shakers" | "both" | undefined,
      limit,
      min_score: Number.isFinite(min_score) ? min_score : undefined,
    });
  });

  /** 설정 조회 */
  app.get("/settings", async () => ({ settings: getSettings(accountId) }));

  /** 설정 저장 */
  app.put<{
    Body: {
      landingPageUrl?: string;
      infoRatio?: number;
      priceDropThreshold?: number;
      categories?: string[];
      source?: string;
      marketplace?: string;
      targetCountry?: string;
      contentLanguage?: string;
      amazonAssociateTag?: string;
      aliexpressAffiliateParams?: string;
      temuAffiliateParams?: string;
    };
  }>("/settings", async (req) => {
    const body = req.body ?? {};
    const next = setSettings(accountId, {
      landingPageUrl: body.landingPageUrl,
      infoRatio: body.infoRatio,
      priceDropThreshold: body.priceDropThreshold,
      categories: body.categories,
      source: body.source as "bestsellers" | "movers_shakers" | "both" | undefined,
      marketplace: body.marketplace as MarketplaceId | undefined,
      targetCountry: body.targetCountry as "DO" | "MX" | "BR" | "KR" | "US" | "PA" | undefined,
      contentLanguage: body.contentLanguage as "es-DO" | "es-MX" | "pt-BR" | "ko" | "en" | undefined,
      amazonAssociateTag: body.amazonAssociateTag,
      aliexpressAffiliateParams: body.aliexpressAffiliateParams,
      temuAffiliateParams: body.temuAffiliateParams,
    });
    return { settings: next };
  });

  /** Threads 계정 연동 상태 */
  app.get("/connection", async () => {
    const conn = getThreadsConnection(accountId);
    return {
      connected: !!conn,
      displayName: conn?.displayName ?? null,
      connectedAt: conn?.connectedAt ?? null,
    };
  });

  /** Threads 계정 연동 (토큰 저장) */
  app.post<{
    Body: { accessToken: string; displayName?: string };
  }>("/connection", async (req, reply: FastifyReply) => {
    const body = req.body ?? {};
    const token = (body.accessToken as string)?.trim();
    if (!token) return reply.status(400).send({ error: "accessToken required" });
    const conn = setThreadsConnection(accountId, {
      accessToken: token,
      displayName: body.displayName as string | undefined,
    });
    return { connected: true, displayName: conn.displayName };
  });

  /** Threads 계정 연동 해제 */
  app.post("/connection/disconnect", async () => {
    disconnectThreads(accountId);
    return { connected: false };
  });

  /** 30분 게시 제한 상태 */
  app.get("/rate-limit", async () => getPublishRateLimit());

  /** 게시 로그 (ROI/대시보드 연동용) */
  app.get<{ Querystring: { limit?: string } }>("/post-log", async (req) => {
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit ?? "50", 10) || 50));
    return { entries: getPostLog(limit) };
  });

  /** 파이프라인 1회 실행 (수집 → AI 문구 → 게시, 30분에 1건) */
  app.post<{
    Body: { usePriceDropOnly?: boolean; contentType?: "product" | "info" };
  }>("/run", async (req, reply: FastifyReply) => {
    const body = req.body ?? {};
    const result = await runPipelineOnce(accountId, {
      usePriceDropOnly: body.usePriceDropOnly,
      contentType: body.contentType,
    });
    return result;
  });
}
