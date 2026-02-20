import { FastifyInstance } from "fastify";
import {
  getTrendSources,
  getCollectionSchedule,
  getStorageConfig,
} from "../services/b2bDataService.js";
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

export async function b2bRoutes(app: FastifyInstance) {
  app.get("/sources", async () => ({ sources: getTrendSources() }));
  app.get("/schedule", async () => getCollectionSchedule());
  app.get("/storage", async () => getStorageConfig());

  app.get<{ Querystring: { item?: string } }>("/market-score", async (req) => {
    const item = req.query?.item ?? "default";
    return marketScore(item);
  });

  app.get<{ Querystring: { item?: string; lang?: string } }>("/market-report", async (req) => {
    const item = req.query?.item ?? "제품명";
    const lang = (req.query?.lang ?? "ko") as "ko" | "en" | "es";
    const validLang = ["ko", "en", "es"].includes(lang) ? lang : "ko";
    return generateMarketReport(item, validLang);
  });

  app.post<{
    Body: { product?: string; target?: "B2B" | "B2C"; budget?: string; goal?: "awareness" | "lead" | "revenue" };
  }>("/marketing-strategy", async (req) => {
    const body = req.body ?? {};
    return generateMarketingStrategy({
      product: body.product ?? "",
      target: body.target ?? "B2B",
      budget: body.budget ?? "",
      goal: body.goal ?? "lead",
    });
  });

  app.get<{
    Querystring: { product?: string; budget?: string; period?: string };
  }>("/integrated-marketing-strategy", async (req) => {
    const q = req.query ?? {};
    return generateIntegratedMarketingStrategy(
      q.product ?? "제품명",
      q.budget ?? "$50,000",
      q.period ?? "3개월"
    );
  });

  app.get<{ Querystring: { lang?: string } }>("/customer-insight-report", async (req) => {
    const lang = (req.query?.lang ?? "ko") as "ko" | "en" | "es";
    const validLang = ["ko", "en", "es"].includes(lang) ? lang : "ko";
    return generateCustomerInsightReport(validLang);
  });

  app.get<{
    Querystring: { product?: string; countries?: string; min_score?: string };
  }>("/match-buyers", async (req) => {
    const q = req.query ?? {};
    const product = q.product ?? "8504";
    const countries = q.countries ? q.countries.split(",").map((c) => c.trim()).filter(Boolean) : [];
    const minScore = q.min_score ? parseInt(q.min_score, 10) : 70;
    const score = Number.isFinite(minScore) ? Math.min(100, Math.max(0, minScore)) : 70;
    const buyers = matchBuyers(
      typeof product === "string" ? { hs_code: product } : product,
      countries,
      score
    );
    return { product, min_score: score, buyers };
  });

  app.get<{
    Querystring: { id?: string; name?: string; country?: string };
  }>("/buyer-profile", async (req) => {
    const q = req.query ?? {};
    return getBuyerProfile(q.id, q.name, q.country);
  });

  app.post<{ Body: TenderInput }>("/evaluate-tender", async (req) => {
    const body = req.body ?? {};
    return evaluateTender({
      document: body.document,
      items: body.items,
      quantity: body.quantity,
      delivery_terms: body.delivery_terms,
      budget: body.budget,
      country: body.country,
      payment: body.payment,
      penalty_clause: body.penalty_clause,
      title: body.title,
    });
  });

  app.get<{
    Querystring: { tender?: string; country?: string; deadline?: string };
  }>("/tender-checklist", async (req) => {
    const q = req.query ?? {};
    return generateTenderChecklist(q.tender, q.country, q.deadline);
  });

  app.post<{ Body: OrderInput }>("/generate-commercial-invoice", async (req) => {
    const body = req.body as OrderInput;
    if (!body?.buyer?.company_name || !body?.items?.length) {
      return { error: "buyer.company_name and items[] required" };
    }
    return generateCommercialInvoice(body);
  });

  app.get<{
    Querystring: { product?: string; country?: string };
  }>("/classify-hs-code", async (req) => {
    const q = req.query ?? {};
    return classifyHsCode(q.product ?? "", q.country);
  });

  app.post<{ Body: import("../services/shippingQuotesService.js").ShipmentInput }>("/shipping-quotes", async (req) => {
    const body = req.body ?? {};
    return getShippingQuotes({
      origin_port: body.origin_port,
      dest_port: body.dest_port,
      weight: body.weight,
      cbm: body.cbm,
      incoterm: body.incoterm,
    });
  });

  app.post<{
    Body: { shipment?: import("../services/landedCostService.js").ShipmentForLandedCost; destination_country?: string };
  }>("/landed-cost", async (req) => {
    const body = req.body ?? {};
    return calculateTotalLandedCost(
      body.shipment ?? { fob_value: 0 },
      body.destination_country ?? "US"
    );
  });
}
