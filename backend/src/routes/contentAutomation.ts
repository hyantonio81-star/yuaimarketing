import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireUser } from "../lib/auth.js";
import { checkRateLimitApi } from "../lib/rateLimit.js";
import {
  runContentAutomationPipeline,
  getContentAutomationSettingsAsync,
  setContentAutomationSettings,
} from "../services/contentAutomation/index.js";

export async function contentAutomationRoutes(app: FastifyInstance) {
  const settingsKey = "default";

  app.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    if (!checkRateLimitApi(request)) {
      reply.code(429).send({ error: "Too Many Requests", message: "Rate limit exceeded." });
      return;
    }
  });

  /** 설정 조회 (파일에서 로드, 배포 후 웹에서만 수정 가능) */
  app.get("/settings", async () => ({
    settings: await getContentAutomationSettingsAsync(settingsKey),
  }));

  /** 설정 저장 (data/content-automation-settings.json 에 영속화) */
  app.put<{
    Body: {
      enableBlog?: boolean;
      enableSns?: boolean;
      blogUrlPlaceholder?: string;
      contentLanguage?: string;
      targetCountry?: string;
      marketplace?: string;
      threadAccountId?: string;
      useOversightBoard?: boolean;
      amazonAssociateTag?: string;
      aliexpressAffiliateParams?: string;
      temuAffiliateParams?: string;
    };
  }>("/settings", async (req) => {
    const body = req.body ?? {};
    const next = await setContentAutomationSettings(settingsKey, {
      enableBlog: body.enableBlog,
      enableSns: body.enableSns,
      blogUrlPlaceholder: body.blogUrlPlaceholder,
      contentLanguage: body.contentLanguage as "es-DO" | "es-MX" | "pt-BR" | "ko" | "en" | undefined,
      targetCountry: body.targetCountry as "DO" | "MX" | "BR" | "KR" | "US" | "PA" | undefined,
      marketplace: body.marketplace,
      threadAccountId: body.threadAccountId,
      useOversightBoard: body.useOversightBoard,
      amazonAssociateTag: body.amazonAssociateTag,
      aliexpressAffiliateParams: body.aliexpressAffiliateParams,
      temuAffiliateParams: body.temuAffiliateParams,
    });
    return { settings: next };
  });

  /** 파이프라인 1회 실행 (Trigger). 스케줄러 또는 수동 호출 */
  app.post<{
    Body: { source?: "rss" | "marketplace" | "shein_affiliate"; marketplace?: string };
  }>("/run", async (req, reply: FastifyReply) => {
    const body = req.body ?? {};
    const result = await runContentAutomationPipeline({
      settingsKey,
      source: body.source ?? "marketplace",
      marketplace: body.marketplace as "amazon" | "shein" | "temu" | "aliexpress" | undefined,
    });
    return result;
  });
}
