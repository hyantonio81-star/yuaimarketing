import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { updateInventory } from "../services/inventorySyncService.js";
import { processOrderAuto, type OrderInput } from "../services/orderAutomationService.js";
import { calculateOptimalPrice, type ProductInput } from "../services/optimalPriceService.js";
import { planPromotion, type ProductForPromo, type PromotionGoal } from "../services/promotionPlanService.js";
import { analyzeReviews, type ProductForReview } from "../services/reviewAnalysisService.js";
import { handleNegativeReview, type NegativeReviewInput } from "../services/negativeReviewHandlerService.js";
import { churnPreventionCampaign } from "../services/churnPreventionService.js";
import { generateRecommendations, type RecommendationCustomer } from "../services/recommendationService.js";

/** Request scope: organization + country (Pillar 3 = 판매 국가 기준). */
function getB2cScope(request: FastifyRequest): { organization_id?: string; country_code?: string } {
  const country = (request.headers["x-country"] as string)?.trim() || (request.query as { country?: string })?.country?.trim();
  const orgId = (request.headers["x-organization-id"] as string)?.trim();
  return { ...(country && { country_code: country }), ...(orgId && { organization_id: orgId }) };
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

export async function b2cRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Body: UpdateInventoryBody;
  }>("/inventory-sync", async (request: FastifyRequest<{ Body: UpdateInventoryBody }>, reply: FastifyReply) => {
    const { sku, quantity_change } = request.body ?? {};
    if (sku == null || quantity_change == null) {
      return reply.code(400).send({ error: "sku and quantity_change required" });
    }
    const scope = getB2cScope(request);
    const result = updateInventory(String(sku), Number(quantity_change));
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
    const order: OrderInput = {
      id: String(body.id),
      customer: { email: String(body.customer.email) },
      items: body.items.map((i) => ({ sku: String(i.sku), quantity: Number(i.quantity) || 1 })),
    };
    const result = processOrderAuto(order);
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
    const scope = getB2cScope(request);
    const product: ProductInput = {
      sku: String(prod.sku),
      cost: Number(prod.cost),
      target_margin: Number(prod.target_margin),
      current_price: Number(prod.current_price),
    };
    const result = calculateOptimalPrice(product, String(body.channel));
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
    const product: ProductForPromo = {
      sku: String(prod.sku),
      name: prod.name != null ? String(prod.name) : undefined,
      base_price: typeof prod.base_price === "number" ? prod.base_price : undefined,
    };
    const goal: PromotionGoal = ["revenue", "profit", "clearance"].includes(body?.goal as PromotionGoal)
      ? (body.goal as PromotionGoal)
      : "revenue";
    const result = planPromotion(product, goal);
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
    const scope = getB2cScope(request);
    const product: ProductForReview = { sku: String(prod.sku) };
    const result = analyzeReviews(product);
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
    const review: NegativeReviewInput = {
      id: r.id != null ? String(r.id) : undefined,
      text: String(r.text),
      channel: r.channel != null ? String(r.channel) : undefined,
      rating: typeof r.rating === "number" ? r.rating : undefined,
    };
    const result = handleNegativeReview(review);
    return Object.keys(scope).length ? { ...result, meta: { scope } } : result;
  });

  fastify.post<{
    Body: ChurnCampaignBody;
  }>("/churn-prevention-campaign", async (request: FastifyRequest<{ Body: ChurnCampaignBody }>) => {
    const scope = getB2cScope(request);
    const limit = typeof request.body?.limit === "number" ? Math.min(200, request.body.limit) : 100;
    const result = churnPreventionCampaign(limit);
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
    const scope = getB2cScope(request);
    const customer: RecommendationCustomer = {
      id: String(c.id),
      order_history: Array.isArray(c.order_history) ? c.order_history.map(String) : undefined,
      favorite_category: c.favorite_category != null ? String(c.favorite_category) : undefined,
    };
    const context = body?.context ?? "email";
    const result = generateRecommendations(customer, context);
    return Object.keys(scope).length ? { ...result, meta: { scope } } : result;
  });
}
