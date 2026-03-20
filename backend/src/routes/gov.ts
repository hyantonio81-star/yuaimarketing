import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireUser } from "../lib/auth.js";
import { monitorKoreaProcurement } from "../services/koreaProcurementService.js";
import { monitorInternationalTendersAsync } from "../services/internationalTendersService.js";
import { checkQualification } from "../services/tenderQualificationService.js";
import { calculateOptimalBid, type TenderForBid } from "../services/optimalBidService.js";
import { generateProposal, type TenderForProposal } from "../services/proposalGenerationService.js";

const GOV_TENDER_ENABLED = process.env.GOV_TENDER_ENABLED === "true";

interface KoreaProcurementBody {
  user_keywords?: string[];
}

interface InternationalTendersBody {
  user_profile?: { keywords?: string[]; sectors?: string[] };
}

interface CheckQualificationBody {
  tender: { id?: string; document?: string };
}

interface OptimalBidBody {
  tender: { id?: string; scope_of_work?: string; contract_period?: string; delivery_location?: string; budget?: number; agency?: string };
}

interface GenerateProposalBody {
  tender: { id?: string; type?: string; scope_of_work?: string; contract_period?: string; technical_specs?: string; required_expertise?: string; submission_guidelines?: string };
}

export async function govRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return reply;
  });

  /** 수동 모드: GOV_TENDER_ENABLED !== 'true' 이면 API는 503 + manual 메시지 반환 */
  fastify.get("/status", async () => ({
    mode: GOV_TENDER_ENABLED ? "active" : "manual",
    message: GOV_TENDER_ENABLED ? undefined : "정부 입찰 기능은 현재 수동 모드입니다. 활성화하려면 GOV_TENDER_ENABLED=true 로 설정하세요.",
  }));

  const manualReply = (reply: FastifyReply) => {
    return reply.code(503).send({
      mode: "manual",
      error: "Gov Tender is in manual mode",
      message: "정부 입찰 기능은 접어두었습니다. 사용하려면 서버에서 GOV_TENDER_ENABLED=true 로 설정하세요.",
    });
  };

  fastify.post<{
    Body: KoreaProcurementBody;
  }>(
    "/korea-procurement",
    async (request: FastifyRequest<{ Body: KoreaProcurementBody }>, reply: FastifyReply) => {
      if (!GOV_TENDER_ENABLED) return manualReply(reply);
      const userKeywords = request.body?.user_keywords;
      const list = Array.isArray(userKeywords)
        ? userKeywords.map((k) => String(k)).filter(Boolean)
        : undefined;
      return monitorKoreaProcurement(list?.length ? list : undefined);
    }
  );

  fastify.post<{
    Body: InternationalTendersBody;
  }>("/international-tenders", async (request: FastifyRequest<{ Body: InternationalTendersBody }>, reply: FastifyReply) => {
    if (!GOV_TENDER_ENABLED) return manualReply(reply);
    const profile = request.body?.user_profile;
    const userProfile =
      profile?.keywords?.length || profile?.sectors?.length
        ? {
            keywords: Array.isArray(profile.keywords) ? profile.keywords.map(String) : undefined,
            sectors: Array.isArray(profile.sectors) ? profile.sectors.map(String) : undefined,
          }
        : undefined;
    return await monitorInternationalTendersAsync(userProfile);
  });

  fastify.post<{
    Body: CheckQualificationBody;
  }>("/check-qualification", async (request: FastifyRequest<{ Body: CheckQualificationBody }>, reply: FastifyReply) => {
    if (!GOV_TENDER_ENABLED) return manualReply(reply);
    const body = request.body;
    const t = body?.tender;
    if (!t) {
      return reply.code(400).send({ error: "tender required" });
    }
    const tender = { id: t.id != null ? String(t.id) : undefined, document: t.document != null ? String(t.document) : undefined };
    return checkQualification(tender);
  });

  fastify.post<{
    Body: OptimalBidBody;
  }>("/optimal-bid", async (request: FastifyRequest<{ Body: OptimalBidBody }>, reply: FastifyReply) => {
    if (!GOV_TENDER_ENABLED) return manualReply(reply);
    const body = request.body;
    const t = body?.tender;
    if (!t) {
      return reply.code(400).send({ error: "tender required" });
    }
    const tender: TenderForBid = {
      id: t.id != null ? String(t.id) : undefined,
      scope_of_work: t.scope_of_work != null ? String(t.scope_of_work) : undefined,
      contract_period: t.contract_period != null ? String(t.contract_period) : undefined,
      delivery_location: t.delivery_location != null ? String(t.delivery_location) : undefined,
      budget: typeof t.budget === "number" ? t.budget : undefined,
      agency: t.agency != null ? String(t.agency) : undefined,
    };
    return calculateOptimalBid(tender);
  });

  fastify.post<{
    Body: GenerateProposalBody;
  }>("/generate-proposal", async (request: FastifyRequest<{ Body: GenerateProposalBody }>, reply: FastifyReply) => {
    if (!GOV_TENDER_ENABLED) return manualReply(reply);
    const body = request.body;
    const t = body?.tender;
    if (!t) {
      return reply.code(400).send({ error: "tender required" });
    }
    const tender: TenderForProposal = {
      id: t.id != null ? String(t.id) : undefined,
      type: t.type != null ? String(t.type) : undefined,
      scope_of_work: t.scope_of_work != null ? String(t.scope_of_work) : undefined,
      contract_period: t.contract_period != null ? String(t.contract_period) : undefined,
      technical_specs: t.technical_specs != null ? String(t.technical_specs) : undefined,
      required_expertise: t.required_expertise != null ? String(t.required_expertise) : undefined,
      submission_guidelines: t.submission_guidelines != null ? String(t.submission_guidelines) : undefined,
    };
    return generateProposal(tender);
  });
}
