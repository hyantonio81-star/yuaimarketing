import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { checkRateLimitApi } from "../lib/rateLimit.js";
import {
  sanitizeOrgId,
  sanitizeCountryCodeWithDefault,
  sanitizeShortString,
  sanitizeNumber,
} from "../lib/apiSecurity.js";
import { updateInventory } from "../services/inventorySyncService.js";
import { processOrderAuto, type OrderInput } from "../services/orderAutomationService.js";
import { calculateOptimalPrice, type ProductInput } from "../services/optimalPriceService.js";
import { planPromotion, type ProductForPromo, type PromotionGoal } from "../services/promotionPlanService.js";
import { analyzeReviews, type ProductForReview } from "../services/reviewAnalysisService.js";
import { handleNegativeReview, type NegativeReviewInput } from "../services/negativeReviewHandlerService.js";
import { churnPreventionCampaign } from "../services/churnPreventionService.js";
import { generateRecommendations, type RecommendationCustomer } from "../services/recommendationService.js";
import {
  getConnections,
  connectChannel,
  disconnectChannel,
  type ChannelId,
} from "../services/ecommerceConnectionsService.js";
import { getB2cSettings, setB2cSettings } from "../services/b2cSettingsService.js";
import {
  listPending,
  getPending,
  resolvePending,
  countPending,
} from "../services/b2cPendingApprovalsService.js";

/** Request scope: organization + country (Pillar 3 = 판매 국가 기준). */
function getB2cScope(request: FastifyRequest): { organization_id?: string; country_code?: string } {
  const rawCountry = (request.headers["x-country"] as string)?.trim() || (request.query as { country?: string })?.country?.trim();
  const rawOrgId = (request.headers["x-organization-id"] as string)?.trim();
  const country_code = rawCountry ? sanitizeCountryCodeWithDefault(rawCountry, "US") : undefined;
  const organization_id = rawOrgId ? sanitizeOrgId(rawOrgId) : undefined;
  return { ...(country_code && { country_code }), ...(organization_id && organization_id !== "default" && { organization_id }) };
}

function getOrgId(request: FastifyRequest): string {
  const raw = (request.headers["x-organization-id"] as string)?.trim();
  return sanitizeOrgId(raw || "default");
}

interface UpdateInventoryBody {
  sku: string;
  quantity_change: number;
}

interface ProcessOrderBody {
  id: string;
  customer: { email: string };
  items: Array<{ sku: string; quantity: number }>;
}

interface OptimalPriceBody {
  product: { sku: string; cost: number; target_margin: number; current_price: number };
  channel: string;
}

interface PromotionPlanBody {
  product: { sku: string; name?: string; base_price?: number };
  goal?: "revenue" | "profit" | "clearance";
}

interface ReviewAnalysisBody {
  product: { sku: string };
}

interface HandleNegativeReviewBody {
  review: { id?: string; text: string; channel?: string; rating?: number };
}

interface ChurnCampaignBody {
  limit?: number;
}

interface RecommendationsBody {
  customer: { id: string; order_history?: string[]; favorite_category?: string };
  context?: string;
}

const VALID_CHANNELS: ChannelId[] = ["shopify"];
const MAX_SKU_LENGTH = 64;
const MAX_EMAIL_LENGTH = 200;
const MAX_REVIEW_TEXT_LENGTH = 2000;

export async function b2cRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", async (request, reply) => {
    if (!checkRateLimitApi(request)) {
      return reply.code(429).send({ error: "Too Many Requests", message: "요청 한도를 초과했습니다. 잠시 후 다시 시도하세요." });
    }
  });

  /** 이커머스 채널 연동 목록 (조직별) */
  fastify.get("/connections", async (request: FastifyRequest, _reply: FastifyReply) => {
    const orgId = getOrgId(request);
    const connections = await getConnections(orgId);
    return { connections };
  });

  /** 이커머스 채널 연동하기 (예: Shopify store URL + API token) */
  fastify.post<{
    Body: { channel?: ChannelId; store_url?: string; store_name?: string; api_token?: string };
  }>("/connections", async (request: FastifyRequest<{ Body: { channel?: ChannelId; store_url?: string; store_name?: string; api_token?: string } }>, reply: FastifyReply) => {
    const body = request.body ?? {};
    const channel = (body.channel ?? "shopify").toLowerCase() as ChannelId;
    if (!VALID_CHANNELS.includes(channel)) {
      return reply.code(400).send({ error: "Invalid channel. Supported: shopify" });
    }
    const orgId = getOrgId(request);
    const info = await connectChannel(orgId, channel, {
      store_url: sanitizeShortString(body.store_url, 500),
      store_name: sanitizeShortString(body.store_name, 100),
      api_token: sanitizeShortString(body.api_token, 200),
    });
    return { ok: true, connection: info };
  });

  /** 이커머스 채널 연동 해제 */
  fastify.delete<{ Querystring: { channel?: string } }>("/connections", async (request: FastifyRequest<{ Querystring: { channel?: string } }>, reply: FastifyReply) => {
    const channel = (request.query?.channel ?? "").toLowerCase() as ChannelId;
    if (!VALID_CHANNELS.includes(channel)) {
      return reply.code(400).send({ error: "Invalid channel. Supported: shopify" });
    }
    const orgId = getOrgId(request);
    const removed = await disconnectChannel(orgId, channel);
    return removed ? { ok: true } : reply.code(404).send({ error: "Connection not found" });
  });

  /** B2C AI 설정 (반자율화 vs 자율화) */
  fastify.get("/settings", async (request: FastifyRequest) => {
    const orgId = getOrgId(request);
    return getB2cSettings(orgId);
  });

  fastify.put<{
    Body: { ai_automation_enabled?: boolean };
  }>("/settings", async (request: FastifyRequest<{ Body: { ai_automation_enabled?: boolean } }>, reply: FastifyReply) => {
    const orgId = getOrgId(request);
    const enabled = request.body?.ai_automation_enabled;
    if (typeof enabled !== "boolean") {
      return reply.code(400).send({ error: "ai_automation_enabled (boolean) required" });
    }
    return setB2cSettings(orgId, { ai_automation_enabled: enabled });
  });

  /** 승인 대기 목록 (반자율화 시) */
  fastify.get<{
    Querystring: { status?: string };
  }>("/pending-approvals", async (request: FastifyRequest<{ Querystring: { status?: string } }>) => {
    const orgId = getOrgId(request);
    const rawStatus = request.query?.status;
    const status = ["pending", "approved", "rejected"].includes(String(rawStatus ?? "")) ? (rawStatus as "pending" | "approved" | "rejected") : undefined;
    const list = listPending(orgId, status);
    const count = countPending(orgId);
    return { items: list, pending_count: count };
  });

  fastify.post<{
    Params: { id: string };
    Body: { action?: string };
  }>("/pending-approvals/:id/approve", async (request: FastifyRequest<{ Params: { id: string }; Body: { action?: string } }>, reply: FastifyReply) => {
    const orgId = getOrgId(request);
    const id = sanitizeShortString(request.params?.id, 64);
    if (!id) return reply.code(400).send({ error: "id required" });
    const resolved = resolvePending(id, orgId, "approve");
    if (!resolved) return reply.code(404).send({ error: "Not found or already resolved" });
    return { ok: true, item: resolved };
  });

  fastify.post<{
    Params: { id: string };
  }>("/pending-approvals/:id/reject", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const orgId = getOrgId(request);
    const id = sanitizeShortString(request.params?.id, 64);
    if (!id) return reply.code(400).send({ error: "id required" });
    const resolved = resolvePending(id, orgId, "reject");
    if (!resolved) return reply.code(404).send({ error: "Not found or already resolved" });
    return { ok: true, item: resolved };
  });

  fastify.post<{
    Body: UpdateInventoryBody;
  }>("/inventory-sync", async (request: FastifyRequest<{ Body: UpdateInventoryBody }>, reply: FastifyReply) => {
    const { sku, quantity_change } = request.body ?? {};
    if (sku == null || quantity_change == null) {
      return reply.code(400).send({ error: "sku and quantity_change required" });
    }
    const safeSku = sanitizeShortString(sku, MAX_SKU_LENGTH);
    if (!safeSku) return reply.code(400).send({ error: "sku required" });
    const qty = sanitizeNumber(quantity_change, 0, -1e6, 1e6);
    const scope = getB2cScope(request);
    const orgId = scope.organization_id ?? getOrgId(request);
    const countryCode = scope.country_code ?? null;
    const result = await updateInventory(orgId, countryCode, safeSku, qty);
    return Object.keys(scope).length ? { ...result, meta: { scope } } : result;
  });

  fastify.post<{
    Body: ProcessOrderBody;
  }>("/process-order", async (request: FastifyRequest<{ Body: ProcessOrderBody }>, reply: FastifyReply) => {
    const body = request.body;
    if (!body?.id || !body?.customer?.email || !Array.isArray(body?.items) || body.items.length === 0) {
      return reply.code(400).send({ error: "id, customer.email, and non-empty items[] required" });
    }
    const scope = getB2cScope(request);
    const orgId = scope.organization_id ?? getOrgId(request);
    const countryCode = scope.country_code ?? undefined;
    const order: OrderInput = {
      id: sanitizeShortString(body.id, 64),
      customer: { email: sanitizeShortString(body.customer.email, MAX_EMAIL_LENGTH) },
      items: body.items.slice(0, 200).map((i) => ({
        sku: sanitizeShortString(i.sku, MAX_SKU_LENGTH),
        quantity: sanitizeNumber(i.quantity, 1, 1, 1e5),
      })),
    };
    if (!order.id || !order.customer.email) return reply.code(400).send({ error: "id and customer.email required" });
    const result = processOrderAuto(order, orgId, countryCode);
    return Object.keys(scope).length ? { ...result, meta: { scope } } : result;
  });

  fastify.post<{
    Body: OptimalPriceBody;
  }>("/optimal-price", async (request: FastifyRequest<{ Body: OptimalPriceBody }>, reply: FastifyReply) => {
    const body = request.body;
    const prod = body?.product;
    if (
      !prod?.sku ||
      typeof prod.cost !== "number" ||
      typeof prod.target_margin !== "number" ||
      typeof prod.current_price !== "number" ||
      !body?.channel
    ) {
      return reply.code(400).send({ error: "product.sku, product.cost, product.target_margin, product.current_price, channel required" });
    }
    const ch = (String(body.channel).toLowerCase() as ChannelId);
    if (!VALID_CHANNELS.includes(ch)) {
      return reply.code(400).send({ error: "Invalid channel. Supported: shopify" });
    }
    const scope = getB2cScope(request);
    const orgId = scope.organization_id ?? getOrgId(request);
    const countryCode = scope.country_code ?? undefined;
    const product: ProductInput = {
      sku: sanitizeShortString(prod.sku, MAX_SKU_LENGTH),
      cost: sanitizeNumber(prod.cost, 0, 0, 1e12),
      target_margin: sanitizeNumber(prod.target_margin, 0, 0, 100),
      current_price: sanitizeNumber(prod.current_price, 0, 0, 1e12),
    };
    if (!product.sku) return reply.code(400).send({ error: "product.sku required" });
    const result = calculateOptimalPrice(product, ch, orgId, countryCode);
    return Object.keys(scope).length ? { ...result, meta: { scope } } : result;
  });

  fastify.post<{
    Body: PromotionPlanBody;
  }>("/promotion-plan", async (request: FastifyRequest<{ Body: PromotionPlanBody }>, reply: FastifyReply) => {
    const body = request.body;
    const prod = body?.product;
    if (!prod?.sku) {
      return reply.code(400).send({ error: "product.sku required" });
    }
    const scope = getB2cScope(request);
    const orgId = scope.organization_id ?? getOrgId(request);
    const countryCode = scope.country_code ?? undefined;
    const product: ProductForPromo = {
      sku: sanitizeShortString(prod.sku, MAX_SKU_LENGTH),
      name: prod.name != null ? sanitizeShortString(prod.name, 200) : undefined,
      base_price: typeof prod.base_price === "number" ? sanitizeNumber(prod.base_price, 0, 0, 1e12) : undefined,
    };
    if (!product.sku) return reply.code(400).send({ error: "product.sku required" });
    const goal: PromotionGoal = ["revenue", "profit", "clearance"].includes(body?.goal as PromotionGoal)
      ? (body.goal as PromotionGoal)
      : "revenue";
    const result = planPromotion(product, goal, orgId, countryCode);
    return Object.keys(scope).length ? { ...result, meta: { scope } } : result;
  });

  fastify.post<{
    Body: ReviewAnalysisBody;
  }>("/review-analysis", async (request: FastifyRequest<{ Body: ReviewAnalysisBody }>, reply: FastifyReply) => {
    const body = request.body;
    const prod = body?.product;
    if (!prod?.sku) {
      return reply.code(400).send({ error: "product.sku required" });
    }
    const sku = sanitizeShortString(prod.sku, MAX_SKU_LENGTH);
    if (!sku) return reply.code(400).send({ error: "product.sku required" });
    const scope = getB2cScope(request);
    const orgId = scope.organization_id ?? getOrgId(request);
    const countryCode = scope.country_code ?? undefined;
    const product: ProductForReview = { sku };
    const result = analyzeReviews(product, orgId, countryCode);
    return Object.keys(scope).length ? { ...result, meta: { scope } } : result;
  });

  fastify.post<{
    Body: HandleNegativeReviewBody;
  }>("/handle-negative-review", async (request: FastifyRequest<{ Body: HandleNegativeReviewBody }>, reply: FastifyReply) => {
    const body = request.body;
    const r = body?.review;
    if (!r?.text || typeof r.text !== "string") {
      return reply.code(400).send({ error: "review.text required" });
    }
    const scope = getB2cScope(request);
    const orgId = scope.organization_id ?? getOrgId(request);
    const countryCode = scope.country_code ?? undefined;
    const review: NegativeReviewInput = {
      id: r.id != null ? sanitizeShortString(r.id, 64) : undefined,
      text: sanitizeShortString(r.text, MAX_REVIEW_TEXT_LENGTH),
      channel: r.channel != null ? sanitizeShortString(r.channel, 50) : undefined,
      rating: typeof r.rating === "number" ? sanitizeNumber(r.rating, 0, 0, 5) : undefined,
    };
    if (!review.text) return reply.code(400).send({ error: "review.text required" });
    const result = handleNegativeReview(review, orgId, countryCode);
    return Object.keys(scope).length ? { ...result, meta: { scope } } : result;
  });

  fastify.post<{
    Body: ChurnCampaignBody;
  }>("/churn-prevention-campaign", async (request: FastifyRequest<{ Body: ChurnCampaignBody }>) => {
    const scope = getB2cScope(request);
    const orgId = scope.organization_id ?? getOrgId(request);
    const countryCode = scope.country_code ?? undefined;
    const limit = sanitizeNumber(request.body?.limit, 100, 1, 200);
    const result = churnPreventionCampaign(limit, orgId, countryCode);
    return Object.keys(scope).length ? { ...result, meta: { scope } } : result;
  });

  fastify.post<{
    Body: RecommendationsBody;
  }>("/recommendations", async (request: FastifyRequest<{ Body: RecommendationsBody }>, reply: FastifyReply) => {
    const body = request.body;
    const c = body?.customer;
    if (!c?.id) {
      return reply.code(400).send({ error: "customer.id required" });
    }
    const customerId = sanitizeShortString(c.id, 64);
    if (!customerId) return reply.code(400).send({ error: "customer.id required" });
    const scope = getB2cScope(request);
    const orgId = scope.organization_id ?? getOrgId(request);
    const countryCode = scope.country_code ?? undefined;
    const customer: RecommendationCustomer = {
      id: customerId,
      order_history: Array.isArray(c.order_history) ? c.order_history.slice(0, 500).map((x) => sanitizeShortString(x, 64)) : undefined,
      favorite_category: c.favorite_category != null ? sanitizeShortString(c.favorite_category, 100) : undefined,
    };
    const context = sanitizeShortString(body?.context ?? "email", 50) || "email";
    const result = generateRecommendations(customer, context, orgId, countryCode);
    return Object.keys(scope).length ? { ...result, meta: { scope } } : result;
  });
}
