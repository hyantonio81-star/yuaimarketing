import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createReadStream, existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { timingSafeEqual } from "node:crypto";
import { join } from "node:path";
import { requireUser, getAuthUserFromRequest } from "../lib/auth.js";
import { checkRateLimitApi } from "../lib/rateLimit.js";
import { getLocalDataDir } from "../lib/localDataDir.js";

const ACCOUNT_REQUESTS_PATH = join(getLocalDataDir(), "account-requests.json");
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
  listPendingAssemblyJobs,
  markAssemblyJobProcessing,
  failRemoteAssembly,
  finalizeRemoteAssemblySuccess,
} from "../services/shortsAgentService.js";
import {
  addToDistributionQueue,
  getDistributionQueue,
  processDistributionQueue,
} from "../services/shortsDistributionService.js";
import { isExpired } from "../services/shortsStorage.js";
import { DEPLOY_PLATFORMS } from "../services/shorts/shortsDeployAgent.js";
import {
  getAuthUrl,
  exchangeCodeAndStore,
  verifyYoutubeOAuthState,
  getConnectionStatus,
  disconnect as youtubeDisconnect,
  listAccounts,
  suggestNextKey,
  setAccountLabel,
  ensureYoutubeStoreLoaded,
  MAX_YT_ACCOUNTS,
} from "../services/youtubeUploadService.js";
import { checkFfmpegInstalled } from "../services/shorts/shortsHealthService.js";
import { AVATAR_PRESETS } from "../services/shortsImageService.js";
import { getChannelDefaults, setChannelDefaults } from "../services/shortsChannelDefaults.js";
import {
  listSeriesForUser,
  getSeriesForUser,
  createSeries,
  updateSeries,
  deleteSeries,
  listEpisodesForSeries,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  chunkTextIntoEpisodes,
  serialContentPipelineHint,
  musicVideoModeInfo,
  type SeriesGenre,
  type EpisodeStatus,
} from "../services/contentSeriesService.js";
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

/**
 * OAuth 완료 후 브라우저를 보낼 SPA origin.
 * 우선순위: FRONTEND_ORIGIN → Vercel 프록시 헤더 → 안전한 Referer → 로컬 기본.
 * (Google 리다이렉트 시 Referer가 google.com일 수 있어 그 경우는 무시)
 */
function resolveFrontendOrigin(request: FastifyRequest): string {
  const fromEnv = (process.env.FRONTEND_ORIGIN ?? "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const xfHost = (request.headers["x-forwarded-host"] as string | undefined)?.split(",")[0]?.trim();
  const xfProto =
    (request.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim() || "https";
  if (xfHost && !/^127\.0\.0\.1(?::\d+)?$/i.test(xfHost)) {
    return `${xfProto}://${xfHost}`;
  }

  const host = (request.headers.host as string | undefined)?.split(",")[0]?.trim();
  if (host && !/^127\.0\.0\.1:\d+$/.test(host) && !/^localhost:\d+$/.test(host)) {
    const proto = host.startsWith("localhost") ? "http" : xfProto || "https";
    return `${proto}://${host}`;
  }

  const referer = request.headers.referer;
  if (referer) {
    try {
      const u = new URL(referer);
      const h = u.hostname;
      if (h === "localhost" || h === "127.0.0.1" || h.endsWith(".vercel.app")) {
        return u.origin;
      }
    } catch {
      /* ignore */
    }
  }

  return "http://localhost:5173";
}

export async function shortsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    if (isYoutubeCallback(request)) return;

    const workerSecret = process.env.SHORTS_WORKER_SECRET ?? "";
    const workerSecretHeader = request.headers["x-shorts-worker-secret"];
    const providedSecret =
      (typeof workerSecretHeader === "string" ? workerSecretHeader : Array.isArray(workerSecretHeader) ? workerSecretHeader[0] : undefined)?.trim() ?? "";

    const reqUrl = request.url ?? "";
    const isQueueWorkerEndpoint =
      request.method === "POST" && reqUrl.includes("/distribution/queue/process");
    const isAssemblyPending = request.method === "GET" && reqUrl.includes("/assembly/pending-jobs");
    const isAssemblyComplete = request.method === "POST" && reqUrl.includes("/assembly/complete");
    const isAssemblyClaim = request.method === "POST" && reqUrl.includes("/assembly/claim");

    const MAX_SECRET_LEN = 200;
    const secretsMatch = (() => {
      if (!workerSecret || !providedSecret) return false;
      if (workerSecret.length > MAX_SECRET_LEN) return false;
      if (providedSecret.length > MAX_SECRET_LEN) return false;
      if (providedSecret.length !== workerSecret.length) return false;
      return timingSafeEqual(Buffer.from(providedSecret, "utf8"), Buffer.from(workerSecret, "utf8"));
    })();

    const isShortsWorkerBypass =
      secretsMatch &&
      (isQueueWorkerEndpoint || isAssemblyPending || isAssemblyComplete || isAssemblyClaim);

    if (isShortsWorkerBypass) {
      return;
    }

    const user = await requireUser(request, reply);
    if (!user) return;
    await ensureYoutubeStoreLoaded(user.id);
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

  /** Shorts 시스템 헬스체크 (FFmpeg 등). Vercel은 /var/task 에 바이너리 설치 불가 → 프론트에서 별도 안내 */
  app.get("/health", async () => {
    const onVercel = process.env.VERCEL === "1";
    const remoteAssemblyEnabled = process.env.SHORTS_DISABLE_REMOTE_ASSEMBLY !== "1";
    const workerSecretConfigured = Boolean((process.env.SHORTS_WORKER_SECRET ?? "").trim());
    if (onVercel) {
      return {
        ffmpegInstalled: false,
        deployTarget: "vercel" as const,
        remoteAssemblyEnabled,
        workerSecretConfigured,
      };
    }
    const ffmpegInstalled = await checkFfmpegInstalled();
    return {
      ffmpegInstalled,
      deployTarget: "standard" as const,
      remoteAssemblyEnabled,
      workerSecretConfigured,
    };
  });

  /** 원격 조립 대기 job 목록 (X-Shorts-Worker-Secret) */
  app.get<{ Querystring: { limit?: string } }>("/assembly/pending-jobs", async (request) => {
    const limit = Math.min(50, Math.max(1, parseInt(request.query?.limit ?? "10", 10) || 10));
    const jobs = await listPendingAssemblyJobs(limit);
    return { jobs };
  });

  /** 워커가 job을 가져갈 때 processing 표시 후 매니페스트 반환 */
  app.post<{ Body: { jobId?: string } }>("/assembly/claim", async (request, reply) => {
    const jobId = (request.body as { jobId?: string } | undefined)?.jobId?.trim();
    if (!jobId) return reply.code(400).send({ error: "jobId required" });
    const ok = await markAssemblyJobProcessing(jobId);
    if (!ok) return reply.code(404).send({ error: "Job not claimable" });
    const job = await getJobAsync(jobId);
    return { jobId, manifest: job?.assemblyManifest ?? null };
  });

  /** 원격 조립 완료: final.mp4 공개 URL 또는 오류 (X-Shorts-Worker-Secret) */
  app.post<{
    Body: { jobId?: string; supabasePublicUrl?: string; error?: string };
  }>("/assembly/complete", async (request, reply) => {
    const body = (request.body ?? {}) as { jobId?: string; supabasePublicUrl?: string; error?: string };
    const jobId = body.jobId?.trim();
    if (!jobId) return reply.code(400).send({ error: "jobId required" });
    if (body.error) {
      await failRemoteAssembly(jobId, body.error);
      return { ok: true };
    }
    const url = body.supabasePublicUrl?.trim();
    if (!url) return reply.code(400).send({ error: "supabasePublicUrl or error required" });
    try {
      await finalizeRemoteAssemblySuccess(jobId, url);
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return reply.code(400).send({ error: msg });
    }
  });

  /** YouTube 연동 계정 목록 (최대 5개) */
  app.get("/youtube/accounts", async (request: FastifyRequest) => {
    const uid = (await getAuthUserFromRequest(request))?.id ?? "";
    const accounts = await listAccounts(uid);
    const suggestedNextKey = await suggestNextKey(uid);
    return { accounts, suggestedNextKey, maxAccounts: MAX_YT_ACCOUNTS };
  });

  /** YouTube 연동: 인증 URL. query.key가 있으면 해당 key로 연동 (새 계정 추가 시 사용) */
  app.get<{ Querystring: { state?: string; key?: string } }>("/youtube/auth-url", async (request: FastifyRequest<{ Querystring: { state?: string; key?: string } }>) => {
    const uid = (await getAuthUserFromRequest(request))?.id ?? "";
    const key = request.query?.key?.trim() || request.query?.state?.trim();
    const result = getAuthUrl(key || undefined, uid);
    if (!result.ok) return { url: null, error: result.error };
    return { url: result.url, state: result.state };
  });

  /** YouTube 연동: code 교환 (callback). state에 key 포함. 성공 시 프론트 /shorts?youtube=connected 로 리다이렉트 */
  app.get<{ Querystring: { code?: string; state?: string } }>("/youtube/callback", async (request: FastifyRequest<{ Querystring: { code?: string; state?: string } }>, reply: FastifyReply) => {
    const code = request.query?.code?.trim();
    const stateRaw = (request.query?.state ?? "").trim() || "default";
    const frontendOrigin = resolveFrontendOrigin(request);
    const redirectConnections = `${frontendOrigin}/settings/connections?youtube=connected`;
    if (!code) {
      return reply.redirect(`${frontendOrigin}/shorts?youtube=error&message=code_required`, 302);
    }

    const verified = verifyYoutubeOAuthState(stateRaw);
    if (!verified) {
      return reply.redirect(
        `${frontendOrigin}/settings/connections?youtube=error&message=${encodeURIComponent("invalid_oauth_state")}`,
        302
      );
    }

    const stateKey = verified.key;
    const result = await exchangeCodeAndStore(code, stateKey, verified.userId);
    if (!result.ok) {
      return reply.redirect(`${frontendOrigin}/settings/connections?youtube=error&message=${encodeURIComponent(result.error ?? "exchange_failed")}`, 302);
    }
    return reply.redirect(redirectConnections, 302);
  });

  /** YouTube 연동 상태 (query.key 없으면 default) */
  app.get<{ Querystring: { key?: string } }>("/youtube/status", async (request: FastifyRequest<{ Querystring: { key?: string } }>) => {
    const uid = (await getAuthUserFromRequest(request))?.id ?? "";
    const key = request.query?.key?.trim() || "default";
    return getConnectionStatus(key, uid);
  });

  /** YouTube 연동 해제. body.key 지정 시 해당 계정만 해제 */
  app.post<{ Body: { key?: string } }>("/youtube/disconnect", async (request: FastifyRequest<{ Body: { key?: string } }>) => {
    const uid = (await getAuthUserFromRequest(request))?.id ?? "";
    const key = (request.body as { key?: string } | undefined)?.key?.trim() || "default";
    await youtubeDisconnect(key, uid);
    return { ok: true };
  });

  /** YouTube 계정 라벨 수정 */
  app.put<{ Params: { key: string }; Body: { label?: string } }>("/youtube/accounts/:key", async (request: FastifyRequest<{ Params: { key: string }; Body: { label?: string } }>) => {
    const uid = (await getAuthUserFromRequest(request))?.id ?? "";
    const key = request.params?.key ?? "";
    const label = (request.body as { label?: string } | undefined)?.label?.trim() ?? "";
    await setAccountLabel(key, label, uid);
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
      /** 업로드·채널 기본값에 사용할 YouTube 계정 키 (다중 계정) */
      youtubeKey?: string;
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
    const youtubeKey = (body.youtubeKey ?? "default").toString().trim() || "default";
    const ownerUserId = (await getAuthUserFromRequest(request))?.id ?? "";
    const job = await runPipelineOnce(keywords, {
      ownerUserId: ownerUserId || undefined,
      avatarPresetId: body.avatarPresetId ?? undefined,
      youtubeKey,
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

  /** 저장된 영상 스트리밍/다운로드 (로컬 파일 우선, 없으면 Supabase URL로 리다이렉트) */
  app.get<{ Params: { jobId: string } }>("/jobs/:jobId/video", async (request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) => {
    await getJobAsync(request.params.jobId);
    const job = getJob(request.params.jobId);
    if (!job) return reply.code(404).send({ error: "Job not found" });

    // 1. 로컬 파일 확인
    if (job.videoPath && existsSync(job.videoPath)) {
      if (job.expiresAt && isExpired(job.expiresAt)) {
        await cleanupExpiredShortsFiles();
        return reply.code(410).send({ error: "Video expired" });
      }
      const stream = createReadStream(job.videoPath);
      return reply.header("Content-Type", "video/mp4").send(stream);
    }

    // 2. 로컬 파일 없고 Supabase URL 있으면 리다이렉트
    if (job.supabaseUrl) {
      return reply.redirect(job.supabaseUrl);
    }

    // 3. 둘 다 없으면 삭제 처리 후 404
    markJobVideoDeleted(request.params.jobId);
    return reply.code(404).send({ error: "Video file not found" });
  });

  /** video_ready 작업 수동 업로드 (다중 플랫폼 선택 가능) */
  app.post<{ Params: { jobId: string }; Body: { youtubeKey?: string; platforms?: string[] } }>("/jobs/:jobId/upload", async (request: FastifyRequest<{ Params: { jobId: string }; Body: { youtubeKey?: string; platforms?: string[] } }>, reply: FastifyReply) => {
    const { jobId } = request.params;
    const body = (request.body ?? {}) as { youtubeKey?: string; platforms?: string[] };
    const youtubeKey = body.youtubeKey ?? "default";
    const platforms = Array.isArray(body.platforms) ? body.platforms.filter((p): p is "youtube" | "tiktok" | "instagram" | "facebook" => ["youtube", "tiktok", "instagram", "facebook"].includes(p)) : undefined;
    try {
      const uid = (await getAuthUserFromRequest(request))?.id ?? "";
      const job = await uploadJob(jobId, youtubeKey, platforms, uid);
      return job;
    } catch (e) {
      return reply.code(400).send({ error: e instanceof Error ? e.message : "Upload failed" });
    }
  });

  /** 배포 대기열에 추가 (복수 작업 지원) */
  app.post<{ Body: { jobIds: string[]; platforms: string[]; scheduledAt?: string } }>(
    "/distribution/queue",
    async (request, reply) => {
      const { jobIds, platforms, scheduledAt } = request.body;
      if (!jobIds?.length || !platforms?.length) {
        return reply.code(400).send({ error: "jobIds and platforms required" });
      }

      const results = [];
      for (const jobId of jobIds) {
        try {
          const items = await addToDistributionQueue(jobId, platforms, { scheduledAt });
          results.push({ jobId, success: true, items });
        } catch (e) {
          results.push({ jobId, success: false, error: (e as Error).message });
        }
      }
      return { results };
    }
  );

  /** 배포 대기열 조회 */
  app.get("/distribution/queue", async () => {
    const queue = await getDistributionQueue();
    return { queue };
  });

  /** 배포 대기열 워커 1회 실행 (Cron/VM용). X-Shorts-Worker-Secret 필요 */
  app.post<{
    Body: { limit?: number };
  }>("/distribution/queue/process", async (request: FastifyRequest<{ Body: { limit?: number } }>) => {
    const limit = request.body?.limit;
    const result = await processDistributionQueue({ limit: typeof limit === "number" ? limit : undefined });
    return { ok: true, ...result };
  });

  /** 연재 시리즈 목록 */
  app.get("/series", async (request: FastifyRequest) => {
    const uid = (await getAuthUserFromRequest(request))?.id ?? "";
    const series = await listSeriesForUser(uid);
    return { series };
  });

  app.post<{
    Body: {
      title?: string;
      genre?: string;
      defaultLanguage?: string;
      tone?: string;
      youtubePlaylistId?: string;
    };
  }>("/series", async (request: FastifyRequest<{ Body: Record<string, unknown> }>, reply: FastifyReply) => {
    const uid = (await getAuthUserFromRequest(request))?.id ?? "";
    const body = request.body ?? {};
    const title = String(body.title ?? "").trim();
    const genre = String(body.genre ?? "shorts").trim() as SeriesGenre;
    const allowed: SeriesGenre[] = ["novel", "comic", "music", "longform", "shorts"];
    if (!title) return reply.code(400).send({ error: "title required" });
    if (!allowed.includes(genre)) return reply.code(400).send({ error: "invalid genre" });
    try {
      const row = await createSeries(uid, {
        title,
        genre,
        defaultLanguage: body.defaultLanguage != null ? String(body.defaultLanguage) : undefined,
        tone: body.tone != null ? String(body.tone) : undefined,
        youtubePlaylistId: body.youtubePlaylistId != null ? String(body.youtubePlaylistId) : undefined,
      });
      return row;
    } catch (e) {
      return reply.code(500).send({ error: e instanceof Error ? e.message : "create failed" });
    }
  });

  app.get<{ Querystring: { genre?: string } }>("/series/pipeline-hint", async (request: FastifyRequest<{ Querystring: { genre?: string } }>) => {
    const g = (request.query?.genre ?? "shorts").trim() as SeriesGenre;
    return serialContentPipelineHint(g);
  });

  app.get<{ Params: { seriesId: string }; Querystring: { include?: string } }>(
    "/series/:seriesId",
    async (request: FastifyRequest<{ Params: { seriesId: string }; Querystring: { include?: string } }>, reply: FastifyReply) => {
      const uid = (await getAuthUserFromRequest(request))?.id ?? "";
      const s = await getSeriesForUser(uid, request.params.seriesId);
      if (!s) return reply.code(404).send({ error: "Series not found" });
      const include = request.query?.include === "episodes";
      if (!include) return s;
      const episodes = await listEpisodesForSeries(uid, request.params.seriesId);
      return { ...s, episodes };
    }
  );

  app.patch<{
    Params: { seriesId: string };
    Body: Record<string, unknown>;
  }>("/series/:seriesId", async (request, reply: FastifyReply) => {
    const uid = (await getAuthUserFromRequest(request))?.id ?? "";
    const body = request.body ?? {};
    const patch: Parameters<typeof updateSeries>[2] = {};
    if (body.title != null) patch.title = String(body.title);
    if (body.genre != null) patch.genre = String(body.genre) as SeriesGenre;
    if (body.defaultLanguage != null) patch.defaultLanguage = String(body.defaultLanguage);
    if (body.tone !== undefined) patch.tone = body.tone === null ? null : String(body.tone);
    if (body.youtubePlaylistId !== undefined)
      patch.youtubePlaylistId = body.youtubePlaylistId === null ? null : String(body.youtubePlaylistId);
    const updated = await updateSeries(uid, request.params.seriesId, patch);
    if (!updated) return reply.code(404).send({ error: "Series not found" });
    return updated;
  });

  app.delete<{ Params: { seriesId: string } }>("/series/:seriesId", async (request, reply: FastifyReply) => {
    const uid = (await getAuthUserFromRequest(request))?.id ?? "";
    const ok = await deleteSeries(uid, request.params.seriesId);
    if (!ok) return reply.code(404).send({ error: "Series not found" });
    return { ok: true };
  });

  app.get<{ Params: { seriesId: string } }>("/series/:seriesId/episodes", async (request, reply: FastifyReply) => {
    const uid = (await getAuthUserFromRequest(request))?.id ?? "";
    const series = await getSeriesForUser(uid, request.params.seriesId);
    if (!series) return reply.code(404).send({ error: "Series not found" });
    const episodes = await listEpisodesForSeries(uid, request.params.seriesId);
    return { episodes };
  });

  app.post<{
    Params: { seriesId: string };
    Body: Record<string, unknown>;
  }>("/series/:seriesId/episodes", async (request, reply: FastifyReply) => {
    const uid = (await getAuthUserFromRequest(request))?.id ?? "";
    const body = request.body ?? {};
    const episodeIndex = typeof body.episodeIndex === "number" ? body.episodeIndex : parseInt(String(body.episodeIndex ?? ""), 10);
    if (!Number.isFinite(episodeIndex)) return reply.code(400).send({ error: "episodeIndex required" });
    try {
      const ep = await createEpisode(uid, request.params.seriesId, {
        episodeIndex,
        title: body.title != null ? String(body.title) : undefined,
        bodyText: body.bodyText != null ? String(body.bodyText) : undefined,
        imageAssetUrl: body.imageAssetUrl != null ? String(body.imageAssetUrl) : undefined,
        jobId: body.jobId != null ? String(body.jobId) : undefined,
        scheduledPublishAt: body.scheduledPublishAt != null ? String(body.scheduledPublishAt) : undefined,
        status: body.status != null ? (String(body.status) as EpisodeStatus) : undefined,
        metadata: typeof body.metadata === "object" && body.metadata != null ? (body.metadata as Record<string, unknown>) : undefined,
      });
      return ep;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "create failed";
      const code = msg.includes("not found") ? 404 : 400;
      return reply.code(code).send({ error: msg });
    }
  });

  app.post<{
    Params: { seriesId: string };
    Body: { text?: string; charsPerEpisode?: number; titlePrefix?: string };
  }>("/series/:seriesId/episodes/chunk-text", async (request, reply: FastifyReply) => {
    const uid = (await getAuthUserFromRequest(request))?.id ?? "";
    const body = request.body ?? {};
    const text = String(body.text ?? "");
    try {
      const episodes = await chunkTextIntoEpisodes(uid, request.params.seriesId, {
        text,
        charsPerEpisode: typeof body.charsPerEpisode === "number" ? body.charsPerEpisode : undefined,
        titlePrefix: body.titlePrefix != null ? String(body.titlePrefix) : undefined,
      });
      return { episodes };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "chunk failed";
      const code = msg.includes("not found") ? 404 : 400;
      return reply.code(code).send({ error: msg });
    }
  });

  app.patch<{
    Params: { seriesId: string; episodeId: string };
    Body: Record<string, unknown>;
  }>("/series/:seriesId/episodes/:episodeId", async (request, reply: FastifyReply) => {
    const uid = (await getAuthUserFromRequest(request))?.id ?? "";
    const body = request.body ?? {};
    const patch: Parameters<typeof updateEpisode>[3] = {};
    if (body.title !== undefined) patch.title = body.title === null ? null : String(body.title);
    if (body.bodyText !== undefined) patch.bodyText = body.bodyText === null ? null : String(body.bodyText);
    if (body.imageAssetUrl !== undefined)
      patch.imageAssetUrl = body.imageAssetUrl === null ? null : String(body.imageAssetUrl);
    if (body.jobId !== undefined) patch.jobId = body.jobId === null ? null : String(body.jobId);
    if (body.scheduledPublishAt !== undefined)
      patch.scheduledPublishAt = body.scheduledPublishAt === null ? null : String(body.scheduledPublishAt);
    if (body.status != null) patch.status = String(body.status) as EpisodeStatus;
    if (body.metadata != null && typeof body.metadata === "object") patch.metadata = body.metadata as Record<string, unknown>;
    const ep = await updateEpisode(uid, request.params.seriesId, request.params.episodeId, patch);
    if (!ep) return reply.code(404).send({ error: "Episode not found" });
    return ep;
  });

  app.delete<{ Params: { seriesId: string; episodeId: string } }>(
    "/series/:seriesId/episodes/:episodeId",
    async (request, reply: FastifyReply) => {
      const uid = (await getAuthUserFromRequest(request))?.id ?? "";
      const ok = await deleteEpisode(uid, request.params.seriesId, request.params.episodeId);
      if (!ok) return reply.code(404).send({ error: "Episode not found" });
      return { ok: true };
    }
  );

  app.get("/music-video/info", async () => musicVideoModeInfo());
}
