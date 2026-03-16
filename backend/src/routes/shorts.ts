import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createReadStream, existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireUser } from "../lib/auth.js";
import { checkRateLimitApi } from "../lib/rateLimit.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "..", "data");
const ACCOUNT_REQUESTS_PATH = join(DATA_DIR, "account-requests.json");
import {
  collectTrendTopics,
  runPipelineOnce,
  listJobs,
  getJob,
  listJobsAsync,
  getJobAsync,
  getLibrary,
  getChecklist,
  uploadJob,
  cleanupExpiredShortsFiles,
  markJobVideoDeleted,
} from "../services/shortsAgentService.js";
import { isExpired } from "../services/shortsStorage.js";
import { DEPLOY_PLATFORMS } from "../services/shorts/shortsDeployAgent.js";
import {
  getAuthUrl,
  exchangeCodeAndStore,
  getConnectionStatus,
  disconnect as youtubeDisconnect,
  listAccounts,
  suggestNextKey,
  setAccountLabel,
  ensureYoutubeStoreLoaded,
  MAX_YT_ACCOUNTS,
} from "../services/youtubeUploadService.js";
import { AVATAR_PRESETS } from "../services/shortsImageService.js";
import { getChannelDefaults, setChannelDefaults } from "../services/shortsChannelDefaults.js";
import {
  getChannelProfile,
  setChannelProfile,
  listChannelProfiles,
  type ChannelProfile,
} from "../services/channelProfileService.js";

/** YouTube OAuth callback은 Google 리다이렉트라 JWT 없음 → 인증 제외 */
function isYoutubeCallback(request: FastifyRequest): boolean {
  return request.method === "GET" && (request.url?.split("?")[0]?.endsWith("/youtube/callback") === true);
}

export async function shortsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    if (isYoutubeCallback(request)) return;
    const user = await requireUser(request, reply);
    if (!user) return;
    await ensureYoutubeStoreLoaded();
    if (!checkRateLimitApi(request)) {
      reply.code(429).send({ error: "Too Many Requests", message: "Rate limit exceeded." });
      return;
    }
  });

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

  /** 배포 가능 플랫폼 목록 */
  app.get("/platforms", async () => ({ platforms: DEPLOY_PLATFORMS }));

  /** YouTube 연동 계정 목록 (최대 5개) */
  app.get("/youtube/accounts", async () => {
    const accounts = listAccounts();
    const suggestedNextKey = suggestNextKey();
    return { accounts, suggestedNextKey, maxAccounts: MAX_YT_ACCOUNTS };
  });

  /** YouTube 연동: 인증 URL. query.key가 있으면 해당 key로 연동 (새 계정 추가 시 사용) */
  app.get<{ Querystring: { state?: string; key?: string } }>("/youtube/auth-url", async (request: FastifyRequest<{ Querystring: { state?: string; key?: string } }>) => {
    const key = request.query?.key?.trim() || request.query?.state?.trim();
    const result = getAuthUrl(key || undefined);
    if (!result) return { url: null, error: "YOUTUBE_CLIENT_ID not set" };
    return { url: result.url, state: result.state };
  });

  /** YouTube 연동: code 교환 (callback). state에 key 포함. 성공 시 프론트 /shorts?youtube=connected 로 리다이렉트 */
  app.get<{ Querystring: { code?: string; state?: string } }>("/youtube/callback", async (request: FastifyRequest<{ Querystring: { code?: string; state?: string } }>, reply: FastifyReply) => {
    const code = request.query?.code?.trim();
    const stateKey = (request.query?.state ?? "").trim() || "default";
    const frontendOrigin = (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173").trim();
    const redirectTo = `${frontendOrigin}/shorts?youtube=connected`;
    const redirectConnections = `${frontendOrigin}/settings/connections?youtube=connected`;
    if (!code) {
      return reply.redirect(`${frontendOrigin}/shorts?youtube=error&message=code_required`, 302);
    }
    const result = await exchangeCodeAndStore(code, stateKey);
    if (!result.ok) {
      return reply.redirect(`${frontendOrigin}/settings/connections?youtube=error&message=${encodeURIComponent(result.error ?? "exchange_failed")}`, 302);
    }
    return reply.redirect(redirectConnections, 302);
  });

  /** YouTube 연동 상태 (query.key 없으면 default) */
  app.get<{ Querystring: { key?: string } }>("/youtube/status", async (request: FastifyRequest<{ Querystring: { key?: string } }>) => {
    const key = request.query?.key?.trim() || "default";
    return getConnectionStatus(key);
  });

  /** YouTube 연동 해제. body.key 지정 시 해당 계정만 해제 */
  app.post<{ Body: { key?: string } }>("/youtube/disconnect", async (request: FastifyRequest<{ Body: { key?: string } }>) => {
    const key = (request.body as { key?: string } | undefined)?.key?.trim() || "default";
    youtubeDisconnect(key);
    return { ok: true };
  });

  /** YouTube 계정 라벨 수정 */
  app.put<{ Params: { key: string }; Body: { label?: string } }>("/youtube/accounts/:key", async (request: FastifyRequest<{ Params: { key: string }; Body: { label?: string } }>) => {
    const key = request.params?.key ?? "";
    const label = (request.body as { label?: string } | undefined)?.label?.trim() ?? "";
    setAccountLabel(key, label);
    return { ok: true };
  });

  /** 채널 프로필 목록 (웹앱에서만 설정·운영용). platform=youtube 시 YouTube 계정별 프로필 */
  app.get<{ Querystring: { platform?: string } }>("/channel-profiles", async (request: FastifyRequest<{ Querystring: { platform?: string } }>) => {
    const platform = (request.query?.platform ?? "youtube").trim() || "youtube";
    const profiles = await listChannelProfiles(platform);
    return { profiles };
  });

  /** 채널 프로필 한 건 조회 */
  app.get<{ Params: { key: string }; Querystring: { platform?: string } }>("/channel-profiles/:key", async (request: FastifyRequest<{ Params: { key: string }; Querystring: { platform?: string } }>) => {
    const platform = (request.query?.platform ?? "youtube").trim() || "youtube";
    const key = (request.params?.key ?? "").trim();
    const profile = await getChannelProfile(platform, key);
    return profile ?? {};
  });

  /** 채널 프로필 저장 (테마·언어·제휴 집중·마켓 허용 목록 등, 웹에서 툭딱 설정) */
  app.put<{
    Params: { key: string };
    Querystring: { platform?: string };
    Body: Partial<ChannelProfile>;
  }>("/channel-profiles/:key", async (request: FastifyRequest<{ Params: { key: string }; Querystring: { platform?: string }; Body: Partial<ChannelProfile> }>) => {
    const platform = (request.query?.platform ?? "youtube").trim() || "youtube";
    const key = (request.params?.key ?? "").trim();
    const body = (request.body ?? {}) as Partial<ChannelProfile>;
    const profile = await setChannelProfile(platform, key, {
      theme: body.theme,
      primaryLanguage: body.primaryLanguage,
      affiliateFocus: body.affiliateFocus,
      marketplaceAllowlist: body.marketplaceAllowlist,
      label: body.label,
    });
    return { profile };
  });

  /** YouTube 추가 계정 신청 (5개 초과 필요 시 연락처·목적 제출) */
  app.post<{ Body: { contactEmail?: string; contactSiteUrl?: string; purpose?: string } }>(
    "/youtube/account-request",
    async (request: FastifyRequest<{ Body: { contactEmail?: string; contactSiteUrl?: string; purpose?: string } }>, reply: FastifyReply) => {
      const body = request.body ?? {};
      const contactEmail = String(body.contactEmail ?? "").trim();
      const contactSiteUrl = String(body.contactSiteUrl ?? "").trim();
      const purpose = String(body.purpose ?? "").trim();
      if (!contactEmail && !contactSiteUrl) {
        return reply.code(400).send({ error: "contactEmail or contactSiteUrl required" });
      }
      let list: { contactEmail: string; contactSiteUrl: string; purpose: string; requestedAt: string }[] = [];
      try {
        if (existsSync(ACCOUNT_REQUESTS_PATH)) {
          const raw = await readFile(ACCOUNT_REQUESTS_PATH, "utf-8");
          list = JSON.parse(raw);
          if (!Array.isArray(list)) list = [];
        }
      } catch {
        list = [];
      }
      list.push({
        contactEmail: contactEmail || "",
        contactSiteUrl: contactSiteUrl || "",
        purpose: purpose || "",
        requestedAt: new Date().toISOString(),
      });
      try {
        await writeFile(ACCOUNT_REQUESTS_PATH, JSON.stringify(list, null, 2), "utf-8");
      } catch (e) {
        return reply.code(500).send({ error: "Failed to save request" });
      }
      return reply.code(201).send({ ok: true, message: "Request submitted" });
    }
  );

  /** 채널별 기본 설정 조회 */
  app.get<{ Params: { channelKey: string } }>("/channels/:channelKey/defaults", async (request: FastifyRequest<{ Params: { channelKey: string } }>) => {
    const defaults = await getChannelDefaults(request.params.channelKey);
    return defaults ?? {};
  });

  /** 채널별 기본 설정 저장 */
  app.put<{
    Params: { channelKey: string };
    Body: Record<string, unknown>;
  }>("/channels/:channelKey/defaults", async (request: FastifyRequest<{ Params: { channelKey: string }; Body: Record<string, unknown> }>, reply: FastifyReply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    await setChannelDefaults(request.params.channelKey, {
      language: body.language as string | undefined,
      interestKeywords: Array.isArray(body.interestKeywords) ? (body.interestKeywords as string[]) : undefined,
      voiceGender: body.voiceGender as "female" | "male" | "neutral" | undefined,
      voiceAge: body.voiceAge as "child" | "young" | "adult" | "mature" | undefined,
      voiceTone: body.voiceTone as "bright" | "warm" | "calm" | "friendly" | "authoritative" | undefined,
      voiceSpeed: typeof body.voiceSpeed === "number" ? body.voiceSpeed : undefined,
      voicePitch: body.voicePitch as "high" | "medium" | "low" | undefined,
      format: body.format as "shorts" | "long" | undefined,
      targetDurationSeconds: typeof body.targetDurationSeconds === "number" ? body.targetDurationSeconds : undefined,
      characterAge: body.characterAge as "child" | "young" | "adult" | "mature" | undefined,
      characterGender: body.characterGender as "female" | "male" | "neutral" | undefined,
      noBgm: body.noBgm === true,
      bgmGenre: body.bgmGenre as string | undefined,
      bgmMood: body.bgmMood as string | undefined,
      bgmVolume: typeof body.bgmVolume === "number" ? body.bgmVolume : undefined,
      autoUpload: body.autoUpload === true,
    });
    return { ok: true };
  });

  /** 파이프라인 1회 실행 (키워드 + 세부 옵션) */
  app.post<{
    Body: {
      keywords?: string[];
      avatarPresetId?: string;
      enableTts?: boolean;
      noBgm?: boolean;
      voiceGender?: "female" | "male" | "neutral";
      voiceAge?: "child" | "young" | "adult" | "mature";
      voiceTone?: "bright" | "warm" | "calm" | "friendly" | "authoritative";
      voiceSpeed?: number;
      voicePitch?: "high" | "medium" | "low";
      format?: "shorts" | "long";
      targetDurationSeconds?: number;
      uploadMode?: "immediate" | "review_first";
      characterAge?: "child" | "young" | "adult" | "mature";
      characterGender?: "female" | "male" | "neutral";
      bgmGenre?: string;
      bgmMood?: string;
      bgmVolume?: number;
      platforms?: string[];
    };
  }>("/run", async (request, reply: FastifyReply) => {
    const body = request.body ?? {};
    const keywords = Array.isArray(body.keywords) ? body.keywords.filter(Boolean) : [];
    const platforms = Array.isArray(body.platforms) ? body.platforms.filter((p): p is "youtube" | "tiktok" | "instagram" | "facebook" => ["youtube", "tiktok", "instagram", "facebook"].includes(p)) : undefined;
    const job = await runPipelineOnce(keywords, {
      avatarPresetId: body.avatarPresetId ?? undefined,
      youtubeKey: "default",
      enableTts: body.enableTts !== false,
      noBgm: body.noBgm === true,
      voiceGender: body.voiceGender,
      voiceAge: body.voiceAge,
      voiceTone: body.voiceTone,
      voiceSpeed: body.voiceSpeed,
      voicePitch: body.voicePitch,
      format: body.format,
      targetDurationSeconds: body.targetDurationSeconds,
      uploadMode: body.uploadMode ?? "immediate",
      characterAge: body.characterAge,
      characterGender: body.characterGender,
      bgmGenre: body.bgmGenre,
      bgmMood: body.bgmMood,
      bgmVolume: body.bgmVolume,
      platforms,
    });
    return job;
  });

  /** 저장된 영상 목록 (videoPath 있음, 만료 제외) */
  app.get("/library", async () => {
    const jobs = await getLibrary();
    return { jobs };
  });

  /** 체크리스트: 업로드 로그·미업로드 삭제 알림 (파일 삭제된 항목) */
  app.get<{ Querystring: { limit?: string } }>("/checklist", async (request: FastifyRequest<{ Querystring: { limit?: string } }>) => {
    const limit = Math.min(500, Math.max(1, parseInt(request.query?.limit ?? "100", 10) || 100));
    const jobs = await getChecklist(limit);
    return { jobs };
  });

  /** 작업 목록 */
  app.get<{ Querystring: { limit?: string } }>("/jobs", async (request: FastifyRequest<{ Querystring: { limit?: string } }>) => {
    const limit = Math.min(100, Math.max(1, parseInt(request.query?.limit ?? "20", 10) || 20));
    await listJobsAsync(limit);
    const jobs = listJobs(limit);
    return { jobs };
  });

  /** 작업 1건 상세 */
  app.get<{ Params: { jobId: string } }>("/jobs/:jobId", async (request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) => {
    await getJobAsync(request.params.jobId);
    const job = getJob(request.params.jobId);
    if (!job) return reply.code(404).send({ error: "Job not found" });
    return job;
  });

  /** 저장된 영상 스트리밍/다운로드 */
  app.get<{ Params: { jobId: string } }>("/jobs/:jobId/video", async (request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) => {
    await getJobAsync(request.params.jobId);
    const job = getJob(request.params.jobId);
    if (!job) return reply.code(404).send({ error: "Job not found" });
    if (!job.videoPath || !existsSync(job.videoPath)) {
      markJobVideoDeleted(request.params.jobId);
      return reply.code(404).send({ error: "Video file not found" });
    }
    if (job.expiresAt && isExpired(job.expiresAt)) {
      await cleanupExpiredShortsFiles();
      return reply.code(410).send({ error: "Video expired" });
    }
    const stream = createReadStream(job.videoPath);
    return reply.header("Content-Type", "video/mp4").send(stream);
  });

  /** video_ready 작업 수동 업로드 (다중 플랫폼 선택 가능) */
  app.post<{ Params: { jobId: string }; Body: { youtubeKey?: string; platforms?: string[] } }>("/jobs/:jobId/upload", async (request: FastifyRequest<{ Params: { jobId: string }; Body: { youtubeKey?: string; platforms?: string[] } }>, reply: FastifyReply) => {
    const { jobId } = request.params;
    const body = (request.body ?? {}) as { youtubeKey?: string; platforms?: string[] };
    const youtubeKey = body.youtubeKey ?? "default";
    const platforms = Array.isArray(body.platforms) ? body.platforms.filter((p): p is "youtube" | "tiktok" | "instagram" | "facebook" => ["youtube", "tiktok", "instagram", "facebook"].includes(p)) : undefined;
    try {
      const job = await uploadJob(jobId, youtubeKey, platforms);
      return job;
    } catch (e) {
      return reply.code(400).send({ error: e instanceof Error ? e.message : "Upload failed" });
    }
  });
}
