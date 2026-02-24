import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  collectTrendTopics,
  runPipelineOnce,
  listJobs,
  getJob,
} from "../services/shortsAgentService.js";
import {
  getAuthUrl,
  exchangeCodeAndStore,
  getConnectionStatus,
  disconnect as youtubeDisconnect,
} from "../services/youtubeUploadService.js";
import { AVATAR_PRESETS } from "../services/shortsImageService.js";

export async function shortsRoutes(app: FastifyInstance) {
  /** 트렌드 주제 수집 (키워드로 YouTube 등 검색) */
  app.get<{
    Querystring: { keywords?: string; max_per_keyword?: string };
  }>("/trends", async (request: FastifyRequest<{ Querystring: { keywords?: string; max_per_keyword?: string } }>, reply: FastifyReply) => {
    const raw = request.query?.keywords ?? "";
    const keywords = raw.split(",").map((k) => k.trim()).filter(Boolean);
    const maxPer = Math.min(20, Math.max(1, parseInt(request.query?.max_per_keyword ?? "5", 10) || 5));
    const topics = await collectTrendTopics(keywords.length ? keywords : ["YouTube Shorts", "트렌드"], { maxPerKeyword: maxPer });
    return { topics };
  });

  /** 아바타 프리셋 목록 */
  app.get("/avatars", async () => ({ presets: AVATAR_PRESETS }));

  /** YouTube 연동: 인증 URL */
  app.get<{ Querystring: { state?: string } }>("/youtube/auth-url", async (request: FastifyRequest<{ Querystring: { state?: string } }>) => {
    const state = request.query?.state;
    const result = getAuthUrl(state);
    if (!result) return { url: null, error: "YOUTUBE_CLIENT_ID not set" };
    return { url: result.url, state: result.state };
  });

  /** YouTube 연동: code 교환 (callback). 성공 시 프론트 /shorts?youtube=connected 로 리다이렉트 */
  app.get<{ Querystring: { code?: string; state?: string } }>("/youtube/callback", async (request: FastifyRequest<{ Querystring: { code?: string; state?: string } }>, reply: FastifyReply) => {
    const code = request.query?.code?.trim();
    const frontendOrigin = (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173").trim();
    const redirectTo = `${frontendOrigin}/shorts?youtube=connected`;
    if (!code) {
      return reply.redirect(302, `${frontendOrigin}/shorts?youtube=error&message=code_required`);
    }
    const result = await exchangeCodeAndStore(code, "default");
    if (!result.ok) {
      return reply.redirect(302, `${frontendOrigin}/shorts?youtube=error&message=${encodeURIComponent(result.error ?? "exchange_failed")}`);
    }
    return reply.redirect(302, redirectTo);
  });

  /** YouTube 연동 상태 */
  app.get("/youtube/status", async () => getConnectionStatus("default"));

  /** YouTube 연동 해제 */
  app.post("/youtube/disconnect", async () => {
    youtubeDisconnect("default");
    return { ok: true };
  });

  /** 파이프라인 1회 실행 (키워드 + 아바타/TTS 옵션, YouTube 연동 시 실업로드) */
  app.post<{
    Body: { keywords?: string[]; avatarPresetId?: string; enableTts?: boolean };
  }>("/run", async (request: FastifyRequest<{ Body: { keywords?: string[]; avatarPresetId?: string; enableTts?: boolean } }>, reply: FastifyReply) => {
    const body = request.body ?? {};
    const keywords = Array.isArray(body.keywords) ? body.keywords.filter(Boolean) : [];
    const job = await runPipelineOnce(keywords, {
      avatarPresetId: body.avatarPresetId ?? undefined,
      youtubeKey: "default",
      enableTts: body.enableTts !== false,
    });
    return job;
  });

  /** 작업 목록 */
  app.get<{ Querystring: { limit?: string } }>("/jobs", async (request: FastifyRequest<{ Querystring: { limit?: string } }>) => {
    const limit = Math.min(100, Math.max(1, parseInt(request.query?.limit ?? "20", 10) || 20));
    const jobs = listJobs(limit);
    return { jobs };
  });

  /** 작업 1건 상세 */
  app.get<{ Params: { jobId: string } }>("/jobs/:jobId", async (request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) => {
    const job = getJob(request.params.jobId);
    if (!job) return reply.code(404).send({ error: "Job not found" });
    return job;
  });
}
