import type { FastifyRequest, FastifyReply } from "fastify";
import { FastifyInstance } from "fastify";
import { checkRateLimitApi } from "../lib/rateLimit.js";
import { requireUser } from "../lib/auth.js";
import {
  sanitizeCountryCode,
  sanitizeCountryCodeWithDefault,
  sanitizeItemOrProduct,
  sanitizeHsCode,
  sanitizeNumber,
  sanitizeShortString,
  sanitizeOrgId,
} from "../lib/apiSecurity.js";
import { getRequestScope } from "../lib/routeScope.js";
import {
  getTrendSources,
  getCollectionSchedule,
  getStorageConfig,
} from "../services/b2bDataService.js";
import { B2B_SECTORS, getRegionsList, isValidSector, getCountryB2BMetadata } from "../data/b2bRegionMetadata.js";
import { marketScore } from "../services/marketScoreService.js";
import { getSegmentedAnalysisResultAsync } from "../services/marketIntelService.js";
import type { RecommendedCompany } from "../services/marketIntel/types.js";
import type { MatchedBuyer } from "../services/buyerMatchingService.js";
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
import { prepareB2bMessage, runB2bMessageCompliance, fillProposalTemplate, fillProposalSubject, type B2bMessageLocale, type B2bProposalVars } from "../services/b2bMessageService.js";
import {
  createLead,
  getLead,
  getLeads,
  transferLead,
  createHotLeads,
  generateHotLeadCandidates,
  type CreateLeadInput,
  type LeadFilter,
  type LeadStatus,
} from "../services/b2bLeadsService.js";
import {
  runPartnerVerification,
  getPartnerVerificationStatus,
  type PartnerVerificationInput,
} from "../services/b2bPartnerVerificationService.js";
import {
  getLatamTargetProductsByCountry,
  getDefaultHsForLatam,
  LATAM_TARGET_PRODUCTS_2026,
} from "../data/latamTargetProducts.js";

/** B2B API 스코프: X-Organization-Id, X-Country (선택). 값은 검증 후 반환 */
function getB2bScope(req: FastifyRequest): { organization_id?: string; country_code?: string } {
  return getRequestScope(req, { orgQueryKey: "orgId", countryQueryKey: "country" });
}

export async function b2bRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
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

  app.get<{ Querystring: { item?: string; country?: string; hs_code?: string } }>("/market-score", async (req) => {
    const q = req.query ?? {};
    const raw = (q as { item?: string }).item;
    const item = raw != null ? sanitizeItemOrProduct(raw, 200) || "default" : "default";
    const country = (q as { country?: string }).country ? sanitizeCountryCode((q as { country: string }).country) ?? undefined : undefined;
    const hsCode = (q as { hs_code?: string }).hs_code ? sanitizeHsCode((q as { hs_code: string }).hs_code) ?? undefined : undefined;
    let marketSizeOverride: number | undefined;
    if (country && (hsCode || /^\d{2,10}$/.test(String(item).trim()))) {
      try {
        const segmented = await getSegmentedAnalysisResultAsync(
          {
            country_code: country,
            item: /^\d{2,10}$/.test(String(item).trim()) ? "" : item,
            hs_code: hsCode ?? (/^\d{2,10}$/.test(String(item).trim()) ? String(item).trim() : ""),
            research_types: ["import", "export"],
          },
          "ko"
        );
        let sum = 0;
        for (const md of segmented?.market_dominance ?? []) {
          for (const p of md.top_players ?? []) {
            const val = (p as { primaryValue?: number }).primaryValue;
            if (typeof val === "number" && val > 0) sum += val;
          }
        }
        if (sum > 0) marketSizeOverride = sum;
      } catch {
        // Comtrade 조회 실패 시 스텁 점수만 사용
      }
    }
    return marketScore(item, marketSizeOverride != null ? { marketSizeOverride, country, hs_code: hsCode ?? (/\d{2,10}/.test(String(item)) ? item : undefined) } : undefined);
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
    const rawGoal = body.goal;
    const goal: "awareness" | "lead" | "revenue" =
      rawGoal === "awareness" || rawGoal === "lead" || rawGoal === "revenue" ? rawGoal : "lead";
    return generateMarketingStrategy({
      product: sanitizeItemOrProduct(body.product, 200) || "제품/서비스",
      target,
      budget: sanitizeShortString(body.budget, 100) || "미정",
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

    const productObj = typeof product === "string" ? { hs_code: product } : product;
    const hsCode = productObj.hs_code ?? product;
    const isHs = /^\d{2,10}$/.test(String(hsCode).trim());
    let realBuyers: MatchedBuyer[] = [];

    if (countries.length > 0 && (product || hsCode)) {
      try {
        const segmented = await getSegmentedAnalysisResultAsync(
          {
            country_code: countries[0],
            item: isHs ? "" : String(hsCode).slice(0, 200),
            hs_code: isHs ? String(hsCode) : "",
            research_types: ["import", "export"],
          },
          "ko"
        );
        const related = segmented?.related_companies ?? [];
        realBuyers = related.slice(0, 20).map((rc: RecommendedCompany, idx: number) => {
          const meta = getCountryB2BMetadata(rc.country_code);
          const baseScore = 78 + (idx % 14);
          return {
            id: `real-${idx}-${String(rc.company_name).replace(/\s+/g, "-").slice(0, 30)}`,
            name: rc.company_name ?? `Company ${idx + 1}`,
            country: rc.country_code ?? countries[0],
            region: meta?.region,
            annual_imports: 0,
            match_score: Math.min(95, baseScore),
            score_breakdown: {
              product_match: 24,
              volume: 12,
              reputation: 17,
              geo: 14,
              response_prob: 4,
              sector_fit: 5,
            },
          };
        });
      } catch {
        // 실데이터 조회 실패 시 합성만 사용
      }
    }

    const syntheticBuyers = matchBuyers(productObj, countries, score, sector && isValidSector(sector) ? sector : undefined);
    const seen = new Set(realBuyers.map((b) => `${b.name}|${b.country}`));
    const merged = [
      ...realBuyers,
      ...syntheticBuyers.filter((b) => {
        const key = `${b.name}|${b.country}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
    ].slice(0, 50);

    return {
      product,
      min_score: score,
      sector: sector || null,
      scope: scope.organization_id ? { organization_id: scope.organization_id, country_code: scope.country_code } : undefined,
      buyers: merged,
      real_buyer_count: realBuyers.length,
    };
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
    const quantity: number =
      typeof body.quantity === "number" ? body.quantity : sanitizeNumber(Number(body.quantity) || 0, 0, 0, 1e6);
    const budgetNum: number =
      typeof body.budget === "number" ? body.budget : sanitizeNumber(Number(body.budget) || 0, 0, 0, 1e9);
    const tenderInput: TenderInput = {
      document: sanitizeShortString(body.document, 5000),
      items,
      quantity,
      delivery_terms: sanitizeShortString(body.delivery_terms, 500),
      budget: budgetNum,
      country,
      payment: sanitizeShortString(body.payment, 200),
      penalty_clause: sanitizeShortString(body.penalty_clause, 1000),
      title: sanitizeShortString(body.title, 200),
    };
    return evaluateTender(tenderInput);
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

  /** B2B 메시지: 푸터 부착 (LGPD/opt-out) */
  app.post<{ Body: { body?: string; locale?: "es" | "pt" } }>("/prepare-message", async (req) => {
    const b = req.body ?? {};
    const body = typeof b.body === "string" ? b.body : "";
    const locale: B2bMessageLocale = b.locale === "pt" ? "pt" : "es";
    return { prepared: prepareB2bMessage(body, locale) };
  });

  /** B2B 메시지: 감독관 검수 (b2b_message) */
  app.post<{ Body: { body?: string; target_country?: string } }>("/validate-message", async (req) => {
    const b = req.body ?? {};
    const body = typeof b.body === "string" ? b.body : "";
    const targetCountry = b.target_country ? sanitizeCountryCode(b.target_country) ?? "DO" : "DO";
    return runB2bMessageCompliance(body, targetCountry);
  });

  /** B2B 제안서 템플릿 치환 + 푸터 부착 (스페인어). Make.com/WhatsApp 발송용 */
  app.post<{
    Body: { product_name?: string; country_name?: string; sector_name?: string; partner_name?: string; locale?: "es" | "pt" };
  }>("/proposal", async (req) => {
    const b = req.body ?? {};
    const vars: B2bProposalVars = {
      product_name: sanitizeShortString(b.product_name, 200) || "[품목명]",
      country_name: sanitizeShortString(b.country_name, 100) || "[국가명]",
      sector_name: sanitizeShortString(b.sector_name, 150) || "[업종명]",
      partner_name: sanitizeShortString(b.partner_name, 200) || "[파트너 성함/Empresa]",
    };
    const locale: B2bMessageLocale = b.locale === "pt" ? "pt" : "es";
    const body = fillProposalTemplate(vars);
    const prepared = prepareB2bMessage(body, locale);
    return { subject: fillProposalSubject(vars), body_prepared: prepared };
  });

  /** 파트너 검증 실행 (AI 감독 위원회 스타일 교차 검증·목 구현) */
  app.post<{ Body: PartnerVerificationInput }>("/partners/verify", async (req) => {
    const body = req.body ?? {};
    const input: PartnerVerificationInput = {
      partner_id: sanitizeShortString(body.partner_id, 64) || "unknown",
      organization_name: body.organization_name ? sanitizeShortString(body.organization_name, 200) : undefined,
      country_code: sanitizeCountryCode(body.country_code) ?? "DO",
      registration_id: body.registration_id ? sanitizeShortString(String(body.registration_id), 32) : undefined,
      lead_id: body.lead_id ? sanitizeShortString(body.lead_id, 80) : undefined,
    };
    return runPartnerVerification(input);
  });

  /** 파트너 검증 상태 조회 (Make.com 발송 게이트: 80점 이상 APPROVED만 발송) */
  app.get<{ Params: { id: string } }>("/partners/:id/verification-status", async (req, reply) => {
    const id = sanitizeShortString(req.params.id, 80);
    const result = getPartnerVerificationStatus(id);
    if (!result) return reply.code(404).send({ error: "Verification not found", partner_id: id });
    return result;
  });

  /** 리드별 검증 상태 (리드의 buyer_id를 partner_id로 조회) */
  app.get<{ Params: { id: string } }>("/leads/:id/verification-status", async (req, reply) => {
    const leadId = sanitizeShortString(req.params.id, 80);
    const lead = await getLead(leadId);
    if (!lead) return reply.code(404).send({ error: "Lead not found", lead_id: leadId });
    const partnerId = lead.buyer_id || leadId;
    const verification = getPartnerVerificationStatus(partnerId);
    const approved = verification?.decision === "APPROVED" && (verification?.overall_score ?? 0) >= 80;
    return { lead_id: leadId, approved, verification: verification ?? null };
  });

  /** 중남미(DO·PA) 타겟 품목 리스트 (2026). Hot Lead/매칭 기본값용 */
  app.get<{ Querystring: { country?: string } }>("/latam-products", async (req) => {
    const country = req.query?.country ? sanitizeCountryCode(req.query.country) ?? undefined : undefined;
    const products = country ? getLatamTargetProductsByCountry(country) : LATAM_TARGET_PRODUCTS_2026;
    const default_hs = country ? getDefaultHsForLatam(country) : undefined;
    return { products, default_hs };
  });

  /** 리드 생성 */
  app.post<{ Body: CreateLeadInput }>("/leads", async (req) => {
    const body = req.body ?? {};
    const product_or_hs = sanitizeItemOrProduct(body.product_or_hs, 100) || sanitizeHsCode(body.product_or_hs) || "8504";
    const country = sanitizeCountryCode(body.country) ?? "US";
    const source = ["manual", "hot_lead", "match_buyers", "api"].includes(body.source ?? "") ? body.source : "manual";
    const score = sanitizeNumber(body.score, 50, 0, 100);
    return await createLead({
      product_or_hs,
      country,
      source: source as CreateLeadInput["source"],
      score: typeof body.score === "number" ? score : undefined,
      buyer_id: body.buyer_id ? sanitizeShortString(body.buyer_id, 64) : undefined,
      buyer_name: body.buyer_name ? sanitizeShortString(body.buyer_name, 200) : undefined,
      buyer_contact: body.buyer_contact ? sanitizeShortString(body.buyer_contact, 200) : undefined,
      metadata: typeof body.metadata === "object" && body.metadata !== null ? (body.metadata as Record<string, unknown>) : undefined,
    });
  });

  /** 리드 목록 (필터·페이지네이션) */
  app.get<{
    Querystring: { country?: string; status?: LeadStatus; source?: string; min_score?: string; limit?: string; offset?: string };
  }>("/leads", async (req) => {
    const q = req.query ?? {};
    const filter: LeadFilter = {};
    if (q.country) filter.country = sanitizeCountryCode(q.country) ?? undefined;
    if (q.status && ["new", "contacted", "qualified", "transferred", "closed"].includes(q.status)) filter.status = q.status as LeadStatus;
    if (q.source && ["manual", "hot_lead", "match_buyers", "api"].includes(q.source)) filter.source = q.source as LeadFilter["source"];
    if (q.min_score != null) filter.min_score = sanitizeNumber(q.min_score, 0, 0, 100);
    const limit = sanitizeNumber(q.limit, 50, 1, 100);
    const offset = sanitizeNumber(q.offset, 0, 0, 1e6);
    return await getLeads(filter, limit, offset);
  });

  /** 리드 이전 */
  app.post<{
    Params: { id: string };
    Body: { supplier_id?: string; fee?: number };
  }>("/leads/:id/transfer", async (req) => {
    const id = sanitizeShortString(req.params.id, 80);
    const body = req.body ?? {};
    const supplier_id = body.supplier_id != null ? sanitizeShortString(String(body.supplier_id), 64) : undefined;
    const fee = typeof body.fee === "number" ? sanitizeNumber(body.fee, 0, 0, 1e9) : undefined;
    return await transferLead(id, supplier_id, fee);
  });

  /** Hot Lead 후보 조회 (trade-market-score + match-buyers, 리드 미생성) */
  app.get<{
    Querystring: { origin?: string; destination?: string; product_or_hs?: string; limit?: string };
  }>("/hot-leads/candidates", async (req) => {
    const q = req.query ?? {};
    const origin = sanitizeCountryCodeWithDefault(q.origin, "KR");
    const destination = sanitizeCountryCodeWithDefault(q.destination, "US");
    const rawProduct = q.product_or_hs?.trim();
    const productOrHs = rawProduct
      ? (/^\d{2,10}$/.test(rawProduct) ? sanitizeHsCode(rawProduct) : sanitizeItemOrProduct(rawProduct, 100)) || "8504"
      : (["DO", "PA"].includes(destination) ? getDefaultHsForLatam(destination) : "8504");
    const limit = sanitizeNumber(q.limit, 20, 1, 50);
    return { candidates: generateHotLeadCandidates(origin, destination, productOrHs, limit) };
  });

  /** Hot Lead 생성 후 리드로 저장 */
  app.post<{
    Body: { origin?: string; destination?: string; product_or_hs?: string; count?: number };
  }>("/hot-leads", async (req) => {
    const body = req.body ?? {};
    const origin = sanitizeCountryCodeWithDefault(body.origin, "KR");
    const destination = sanitizeCountryCodeWithDefault(body.destination, "US");
    const rawProduct = body.product_or_hs?.trim();
    const productOrHs = rawProduct
      ? (/^\d{2,10}$/.test(rawProduct) ? sanitizeHsCode(rawProduct) : sanitizeItemOrProduct(rawProduct, 100)) || "8504"
      : (["DO", "PA"].includes(destination) ? getDefaultHsForLatam(destination) : "8504");
    const count = sanitizeNumber(body.count, 5, 1, 20);
    return { leads: await createHotLeads(origin, destination, productOrHs, count) };
  });
}
