import type { FastifyRequest } from "fastify";
import { FastifyInstance } from "fastify";
import { checkRateLimitApi } from "../lib/rateLimit.js";
import {
  sanitizeCountryCode,
  sanitizeCountryCodeWithDefault,
  sanitizeItemOrProduct,
  sanitizeHsCode,
  sanitizeNumber,
  sanitizeShortString,
  sanitizeOrgId,
} from "../lib/apiSecurity.js";
import {
  getTrendSources,
  getCollectionSchedule,
  getStorageConfig,
} from "../services/b2bDataService.js";
import { B2B_SECTORS, getRegionsList, isValidSector } from "../data/b2bRegionMetadata.js";
import { marketScore } from "../services/marketScoreService.js";
import { generateMarketReport } from "../services/marketReportService.js";
import { generateMarketingStrategy } from "../services/marketingStrategyService.js";
import { generateIntegratedMarketingStrategy } from "../services/integratedMarketingStrategyService.js";
import { generateCustomerInsightReport } from "../services/customerInsightReportService.js";
import { matchBuyers } from "../services/buyerMatchingService.js";
import { getBuyerProfile } from "../services/buyerProfileService.js";
import { evaluateTender, type TenderInput } from "../services/tenderEvaluationService.js";
import { generateTenderChecklist } from "../services/tenderChecklistService.js";
import { generateCommercialInvoice, type OrderInput } from "../services/commercialInvoiceService.js";
import { classifyHsCode } from "../services/hsCodeClassifyService.js";
import { getShippingQuotes } from "../services/shippingQuotesService.js";
import { calculateTotalLandedCost } from "../services/landedCostService.js";
import { getB2bIndexViewerData } from "../services/b2bIndexViewerService.js";
import { tradeMarketScore } from "../services/tradeMarketScoreService.js";

/** B2B API 스코프: X-Organization-Id, X-Country (선택). 값은 검증 후 반환 */
function getB2bScope(req: FastifyRequest): { organization_id?: string; country_code?: string } {
  const rawOrg = (req.headers["x-organization-id"] as string)?.trim() || (req.query as { orgId?: string })?.orgId?.trim();
  const rawCountry = (req.headers["x-country"] as string)?.trim() || (req.query as { country?: string })?.country?.trim();
  const orgId = rawOrg ? sanitizeOrgId(rawOrg) : undefined;
  const country = rawCountry ? sanitizeCountryCode(rawCountry) ?? undefined : undefined;
  return { ...(orgId && orgId !== "default" && { organization_id: orgId }), ...(country && { country_code: country }) };
}

export async function b2bRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    if (!checkRateLimitApi(request)) {
      return reply.code(429).send({ error: "Too Many Requests", message: "요청 한도를 초과했습니다. 잠시 후 다시 시도하세요." });
    }
  });

  app.get("/options", async () => ({
    sectors: B2B_SECTORS,
    regions: getRegionsList(),
  }));

  app.get("/sources", async () => ({ sources: getTrendSources() }));
  app.get("/schedule", async () => getCollectionSchedule());
  app.get("/storage", async () => getStorageConfig());

  /** INDEX 뷰어: PMI, 운임 지수, 원자재 지수, 경제 요약. country 있으면 PMI 해당국만 */
  app.get<{ Querystring: { country?: string } }>("/indices", async (req) => {
    const scope = getB2bScope(req);
    const rawCountry = (req.query as { country?: string })?.country ?? scope.country_code;
    const country = rawCountry ? sanitizeCountryCodeWithDefault(rawCountry, "US") : undefined;
    return getB2bIndexViewerData(country ?? undefined);
  });

  app.get<{ Querystring: { item?: string } }>("/market-score", async (req) => {
    const raw = (req.query as { item?: string })?.item;
    const item = raw != null ? sanitizeItemOrProduct(raw, 200) || "default" : "default";
    return marketScore(item);
  });

  /** 무역 시장성 점수: 수출국/수입국, 아이템 또는 HS 코드 → 점수 + 간략 리뷰 */
  app.get<{
    Querystring: { origin?: string; destination?: string; item?: string; hs_code?: string };
  }>("/trade-market-score", async (req) => {
    const q = req.query ?? {};
    const origin = sanitizeCountryCodeWithDefault(q.origin, "KR");
    const destination = sanitizeCountryCodeWithDefault(q.destination, "US");
    const rawItem = q.item ?? q.hs_code ?? "8504";
    const itemOrHs = /^\d{2,10}$/.test(String(rawItem).trim()) ? sanitizeHsCode(rawItem) : sanitizeItemOrProduct(rawItem, 300);
    return tradeMarketScore(origin, destination, itemOrHs || "8504");
  });

  app.get<{ Querystring: { item?: string; lang?: string } }>("/market-report", async (req) => {
    const rawItem = (req.query as { item?: string })?.item;
    const item = rawItem != null ? sanitizeItemOrProduct(rawItem, 200) || "제품명" : "제품명";
    const lang = (req.query as { lang?: string })?.lang ?? "ko";
    const validLang = ["ko", "en", "es"].includes(String(lang)) ? (lang as "ko" | "en" | "es") : "ko";
    return generateMarketReport(item, validLang);
  });

  app.post<{
    Body: { product?: string; target?: "B2B" | "B2C"; budget?: string; goal?: "awareness" | "lead" | "revenue" };
  }>("/marketing-strategy", async (req) => {
    const body = req.body ?? {};
    const target = body.target === "B2C" ? "B2C" : "B2B";
    const goal = (["awareness", "lead", "revenue"].includes(String(body.goal)) ? body.goal : "lead") as "awareness" | "lead" | "revenue";
    return generateMarketingStrategy({
      product: sanitizeItemOrProduct(body.product, 200),
      target,
      budget: sanitizeShortString(body.budget, 100),
      goal,
    });
  });

  app.get<{
    Querystring: { product?: string; budget?: string; period?: string };
  }>("/integrated-marketing-strategy", async (req) => {
    const q = req.query ?? {};
    const product = sanitizeItemOrProduct(q.product, 200) || "제품명";
    const budget = sanitizeShortString(q.budget, 80) || "$50,000";
    const period = sanitizeShortString(q.period, 30) || "3개월";
    return generateIntegratedMarketingStrategy(product, budget, period);
  });

  app.get<{ Querystring: { lang?: string } }>("/customer-insight-report", async (req) => {
    const lang = (req.query?.lang ?? "ko") as "ko" | "en" | "es";
    const validLang = ["ko", "en", "es"].includes(lang) ? lang : "ko";
    return generateCustomerInsightReport(validLang);
  });

  app.get<{
    Querystring: { product?: string; countries?: string; regions?: string; sector?: string; min_score?: string };
  }>("/match-buyers", async (req) => {
    const scope = getB2bScope(req);
    const q = req.query ?? {};
    const product = /^\d{2,10}$/.test(String(q.product ?? "").trim()) ? sanitizeHsCode(q.product) : sanitizeItemOrProduct(q.product, 100) || "8504";
    let countries: string[] = q.countries ? q.countries.split(",").map((c) => sanitizeCountryCode(c)).filter((c): c is string => c != null) : [];
    const regionsParam = q.regions ? q.regions.split(",").map((r) => sanitizeShortString(r, 50)).filter(Boolean) : [];
    const sector = (q.sector as string)?.trim() || undefined;
    const score = sanitizeNumber(q.min_score, 70, 0, 100);
    if (regionsParam.length > 0 && countries.length === 0) {
      const { getCountriesByRegion } = await import("../data/b2bRegionMetadata.js");
      countries = regionsParam.flatMap((r) => getCountriesByRegion(r));
    }
    const buyers = matchBuyers(
      typeof product === "string" ? { hs_code: product } : product,
      countries,
      score,
      sector && isValidSector(sector) ? sector : undefined
    );
    return { product, min_score: score, sector: sector || null, scope: scope.organization_id ? { organization_id: scope.organization_id, country_code: scope.country_code } : undefined, buyers };
  });

  app.get<{
    Querystring: { id?: string; name?: string; country?: string };
  }>("/buyer-profile", async (req) => {
    const q = req.query ?? {};
    const country = q.country ? sanitizeCountryCodeWithDefault(q.country, "DE") : undefined;
    return getBuyerProfile(sanitizeShortString(q.id, 64), sanitizeShortString(q.name, 200), country ?? q.country);
  });

  app.post<{ Body: TenderInput }>("/evaluate-tender", async (req) => {
    const body = req.body ?? {};
    const items = Array.isArray(body.items) ? body.items.slice(0, 50).map((x) => sanitizeShortString(x, 200)) : undefined;
    const country = body.country ? sanitizeCountryCode(body.country) ?? undefined : undefined;
    const quantity = typeof body.quantity === "number" ? body.quantity : sanitizeNumber(body.quantity, 0, 0, 1e6);
    const budget = typeof body.budget === "number" ? body.budget : sanitizeNumber(body.budget, 0, 0, 1e9);
    return evaluateTender({
      document: sanitizeShortString(body.document, 5000),
      items,
      quantity,
      delivery_terms: sanitizeShortString(body.delivery_terms, 500),
      budget,
      country,
      payment: sanitizeShortString(body.payment, 200),
      penalty_clause: sanitizeShortString(body.penalty_clause, 1000),
      title: sanitizeShortString(body.title, 200),
    });
  });

  app.get<{
    Querystring: { tender?: string; country?: string; deadline?: string };
  }>("/tender-checklist", async (req) => {
    const q = req.query ?? {};
    const tender = sanitizeShortString(q.tender, 300) || undefined;
    const country = q.country ? sanitizeCountryCode(q.country) ?? undefined : undefined;
    const deadline = sanitizeShortString(q.deadline, 20) || undefined;
    return generateTenderChecklist(tender, country ?? undefined, deadline);
  });

  app.post<{ Body: OrderInput }>("/generate-commercial-invoice", async (req) => {
    const body = req.body as OrderInput;
    if (!body?.buyer?.company_name || !body?.items?.length) {
      return { error: "buyer.company_name and items[] required" };
    }
    const safeBody: OrderInput = {
      ...body,
      buyer: {
        company_name: sanitizeShortString(body.buyer.company_name, 200),
        full_address: sanitizeShortString((body.buyer as { full_address?: string }).full_address ?? "", 500),
        contact_person: (body.buyer as { contact_person?: string }).contact_person ? sanitizeShortString((body.buyer as { contact_person?: string }).contact_person, 100) : undefined,
      },
      items: body.items.slice(0, 100).map((it: { name?: string; hs_code?: string; qty?: number; price?: number }) => ({
        name: sanitizeShortString(it.name, 200),
        hs_code: sanitizeHsCode(it.hs_code) || "8504",
        qty: sanitizeNumber(it.qty, 1, 0, 1e6),
        price: sanitizeNumber(it.price, 0, 0, 1e9),
      })),
    };
    return generateCommercialInvoice(safeBody);
  });

  app.get<{
    Querystring: { product?: string; country?: string };
  }>("/classify-hs-code", async (req) => {
    const q = req.query ?? {};
    const product = sanitizeItemOrProduct(q.product, 300);
    const country = q.country ? sanitizeCountryCodeWithDefault(q.country, "US") : "US";
    return classifyHsCode(product, country);
  });

  app.post<{ Body: import("../services/shippingQuotesService.js").ShipmentInput }>("/shipping-quotes", async (req) => {
    const body = req.body ?? {};
    return getShippingQuotes({
      origin_port: sanitizeShortString(body.origin_port, 20),
      dest_port: sanitizeShortString(body.dest_port, 20),
      weight: sanitizeNumber(body.weight, 0, 0, 1e6),
      cbm: sanitizeNumber(body.cbm, 0, 0, 1e6),
      incoterm: sanitizeShortString(body.incoterm, 10),
    });
  });

  app.post<{
    Body: { shipment?: import("../services/landedCostService.js").ShipmentForLandedCost; destination_country?: string };
  }>("/landed-cost", async (req) => {
    const scope = getB2bScope(req);
    const body = req.body ?? {};
    const dest = body.destination_country ?? scope.country_code ?? "US";
    const shipment = body.shipment ?? { fob_value: 0 };
    if (shipment.origin_country) shipment.origin_country = sanitizeCountryCodeWithDefault(shipment.origin_country, "KR");
    return calculateTotalLandedCost(shipment, sanitizeCountryCodeWithDefault(dest, "US"));
  });
}
