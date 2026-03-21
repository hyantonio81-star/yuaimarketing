/**
 * YouTube Shorts 자율 생성 오케스트레이터
 * 분야별 에이전트(트렌드·스크립트·비주얼·보이스·BGM·편집·배포)를 순서대로 호출.
 */
export type {
  TrendTopic,
  ShortsCharacter,
  ShortsScriptScene,
  ShortsScript,
  ShortsPipelineJob,
  SceneImageResult,
  SceneAudioResult,
  VoicePresetOption,
  ShortsFormat,
  BgmOption,
} from "./shorts/shortsTypes.js";

import { collectTrendTopics } from "./shorts/shortsTrendAgent.js";
import { generateScriptForTopic } from "./shorts/shortsScriptAgent.js";
import { generateVisualAssets } from "./shorts/shortsVisualAgent.js";
import { generateSceneAudios } from "./shorts/shortsVoiceAgent.js";
import { selectBgm } from "./shorts/shortsBgmAgent.js";
import { assembleVideo as editAssembleVideo } from "./shorts/shortsEditAgent.js";
import { deployToYouTube, deployToPlatforms, type DeployPlatform } from "./shorts/shortsDeployAgent.js";
import { updateVideoStats } from "./shorts/shortsStatsService.js";
import { loadJobsFromFile, saveJobsToFile } from "./shortsJobStore.js";
import {
  copyVideoToStorage,
  isExpired,
  deleteVideoFile,
  getExpiresAt,
  RETENTION_DAYS_UPLOADED,
  RETENTION_DAYS_VIDEO_READY,
} from "./shortsStorage.js";
import { getChannelDefaults } from "./shortsChannelDefaults.js";
import type { ShortsPipelineJob, ShortsScript } from "./shorts/shortsTypes.js";
import { generateNewsBlogContent } from "./contentAutomation/dualContentService.js";
import { publishToBlogger } from "./contentAutomation/bloggerService.js";

const JOBS = new Map<string, ShortsPipelineJob>();
let jobsLoaded = false;

async function ensureJobsLoaded(): Promise<void> {
  if (jobsLoaded) return;
  const list = await loadJobsFromFile();
  for (const j of list) {
    if (j.jobId && !JOBS.has(j.jobId)) JOBS.set(j.jobId, j);
  }
  jobsLoaded = true;
}

export async function persistJobs(): Promise<void> {
  await saveJobsToFile(Array.from(JOBS.values())).catch(() => {});
}

/** 만료된 영상 파일 삭제 후 job은 체크리스트로 유지 (videoPath 제거, fileDeletedAt 기록) */
async function runCleanupExpiredFiles(): Promise<void> {
  const now = new Date().toISOString();
  let changed = false;
  for (const job of JOBS.values()) {
    if (!job.videoPath || !job.expiresAt || !isExpired(job.expiresAt)) continue;
    try {
      await deleteVideoFile(job.jobId);
      job.videoPath = undefined;
      job.fileDeletedAt = now;
      job.updatedAt = now;
      changed = true;
    } catch {
      // ignore per-job errors
    }
  }
  if (changed) await persistJobs();
}

/** video_ready 보관 상한 초과 시 오래된 것부터 파일 삭제 (체크리스트는 유지) */
async function enforceVideoReadyCap(): Promise<void> {
  const cap = Math.max(1, parseInt(process.env.SHORTS_VIDEO_READY_MAX_COUNT ?? "100000", 10) || 100000);
  const withFile = Array.from(JOBS.values()).filter(
    (j) => j.status === "video_ready" && j.videoPath
  );
  if (withFile.length <= cap) return;
  const toRemove = withFile.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1)).slice(0, withFile.length - cap);
  const now = new Date().toISOString();
  let changed = false;
  for (const job of toRemove) {
    try {
      await deleteVideoFile(job.jobId);
      job.videoPath = undefined;
      job.fileDeletedAt = now;
      job.updatedAt = now;
      changed = true;
    } catch {
      // ignore
    }
  }
  if (changed) await persistJobs();
}

/** 라우트 등에서 사용: 만료된 영상 파일 정리 (410 전 호출 권장) */
export async function cleanupExpiredShortsFiles(): Promise<void> {
  await ensureJobsLoaded();
  await runCleanupExpiredFiles();
}

/** 라우트 등에서 사용: 파일이 이미 없을 때 job에서 videoPath 제거·fileDeletedAt 기록 (404 시 호출) */
export async function markJobVideoDeleted(jobId: string): Promise<void> {
  const job = JOBS.get(jobId);
  if (!job) return;
  if (job.videoPath != null) {
    job.videoPath = undefined;
    job.fileDeletedAt = new Date().toISOString();
    job.updatedAt = job.fileDeletedAt;
    await persistJobs();
  }
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export { collectTrendTopics } from "./shorts/shortsTrendAgent.js";
export { generateScriptForTopic } from "./shorts/shortsScriptAgent.js";

/** 비주얼 에이전트: 캐릭터 1인 + 장면 이미지 (기존 API 호환용) */
export async function generateImagesForScript(script: ShortsScript, avatarPresetId?: string) {
  const { sceneImages } = await generateVisualAssets(script, avatarPresetId);
  return sceneImages.map((r) => ({ sceneIndex: r.sceneIndex, imageUrl: r.imageUrl }));
}

/** 영상 조립: 편집 에이전트 호출 (기존 시그니처 호환) */
export async function assembleVideo(
  script: ShortsScript,
  sceneImages: { sceneIndex: number; imageUrl: string }[],
  sceneAudios: { sceneIndex: number; audioPath: string | null }[],
  bgmPath?: string | null
) {
  const result = await editAssembleVideo({
    script,
    sceneImages,
    sceneAudios,
    bgmPath,
  });
  return {
    videoPath: result.videoPath,
    thumbnailPath: result.thumbnailPath,
    durationSeconds: result.durationSeconds,
  };
}

/** YouTube 업로드: 배포 에이전트 호출 */
export async function uploadToYouTube(
  videoPath: string,
  meta: { title: string; description?: string },
  youtubeKey: string = "default"
) {
  return deployToYouTube(videoPath, meta, youtubeKey);
}

export interface RunPipelineOptions {
  avatarPresetId?: string;
  youtubeKey?: string;
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
  platforms?: DeployPlatform[];
  /** AI의 전략적 선택 근거 (Self-Optimization Reasoning) */
  reasoning?: string;
  category?: string;
  /** 원본 뉴스 언어 */
  sourceLanguage?: string;
  /** 타겟 언어 (문화 교류용) */
  languageOverride?: string;
  /** OSMU 활성화: 영상 생성 시 블로그 포스트 자동 동 동시 생성 */
  enableOsmu?: boolean;
}

/**
 * 비동기 파이프라인 실행: jobId를 즉시 반환하고 백그라운드에서 작업을 계속함 (Vercel 타임아웃 방지)
 */
export async function runPipelineOnce(keywords: string[], options?: RunPipelineOptions): Promise<ShortsPipelineJob> {
  await ensureJobsLoaded();
  const defaults = options?.youtubeKey ? await getChannelDefaults(options.youtubeKey) : null;
  const {
    avatarPresetId,
    youtubeKey = "default",
    enableTts = true,
    noBgm = defaults?.noBgm ?? false,
    voiceGender,
    voiceAge,
    voiceTone,
    voiceSpeed,
    voicePitch,
    format,
    targetDurationSeconds,
    uploadMode: uploadModeOpt,
    characterAge,
    characterGender,
    bgmGenre,
    bgmMood,
    bgmVolume = defaults?.bgmVolume ?? 0.15,
    platforms = ["youtube"],
    enableOsmu = true, // 기본값 true로 설정하여 OSMU 시너지 극대화
    reasoning,
    category,
    sourceLanguage,
    languageOverride,
  } = options ?? {};

  const uploadMode = uploadModeOpt ?? (defaults?.autoUpload === false ? "review_first" : "immediate");
  const merged = {
    avatarPresetId,
    youtubeKey,
    enableTts,
    noBgm,
    voiceGender: voiceGender ?? defaults?.voiceGender,
    voiceAge: voiceAge ?? defaults?.voiceAge,
    voiceTone: voiceTone ?? defaults?.voiceTone,
    voiceSpeed: voiceSpeed ?? defaults?.voiceSpeed,
    voicePitch: voicePitch ?? defaults?.voicePitch,
    format: format ?? defaults?.format,
    targetDurationSeconds: targetDurationSeconds ?? defaults?.targetDurationSeconds,
    uploadMode,
    characterAge: characterAge ?? defaults?.characterAge,
    characterGender: characterGender ?? defaults?.characterGender,
    bgmGenre: bgmGenre ?? defaults?.bgmGenre,
    bgmMood: bgmMood ?? defaults?.bgmMood,
    bgmVolume: bgmVolume ?? defaults?.bgmVolume ?? 0.15,
    platforms: platforms?.length ? platforms : ["youtube"],
    enableOsmu,
    reasoning,
    category,
    sourceLanguage,
    languageOverride,
  };

  const jobId = `job-${Date.now()}-${simpleHash(keywords.join(","))}`;
  const now = new Date().toISOString();
  const job: ShortsPipelineJob = {
    jobId,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  JOBS.set(jobId, job);
  await persistJobs();

  // 백그라운드 실행
  runPipelineInternal(jobId, keywords, merged).catch((err) => {
    console.error(`[Pipeline Error] ${jobId}:`, err);
  });

  return job;
}

/** 실제 파이프라인 로직 (내부용) */
async function runPipelineInternal(jobId: string, keywords: string[], merged: any): Promise<void> {
  const job = JOBS.get(jobId);
  if (!job) return;

  try {
    job.status = "collecting";
    job.reasoning = merged.reasoning; // AI 전략 근거 기록
    job.updatedAt = new Date().toISOString();
    await persistJobs();

    const topics = await collectTrendTopics(keywords.length ? keywords : ["YouTube Shorts", "트렌드"], {
      category: merged.category,
    });
    const topic = topics[0];
    job.topic = topic;

    job.status = "script";
    job.updatedAt = new Date().toISOString();
    await persistJobs();

    const script = await generateScriptForTopic(topic, merged.avatarPresetId, {
      avatarPresetId: merged.avatarPresetId,
      format: merged.format,
      targetDurationSeconds: merged.targetDurationSeconds,
      characterAge: merged.characterAge,
      characterGender: merged.characterGender,
      languageOverride: merged.languageOverride,
      category: merged.category,
      sourceLanguage: merged.sourceLanguage,
    });
    job.script = script;

    // [OSMU] 블로그 포스팅 자동 생성 (선택 사항)
    if (merged.enableOsmu) {
      try {
        const blogContent = await generateNewsBlogContent(topic, script, {
          contentLanguage: merged.languageOverride ?? "es-DO",
        });
        const blogId = (process.env.BLOGGER_BLOG_ID ?? "").trim();
        if (blogId && blogContent.blogReview) {
          const blogResult = await publishToBlogger(
            blogId,
            blogContent.blogTitle ?? script.topicTitle,
            blogContent.blogReview
          );
          if (blogResult.ok && blogResult.postUrl) {
            console.log(`[OSMU] Blog post created: ${blogResult.postUrl}`);
            // 필요 시 job.deployedUrls 등에 블로그 링크 추가 가능
          }
        }
      } catch (blogErr) {
        console.error(`[OSMU Error] Failed to generate blog:`, blogErr);
      }
    }

    job.status = "images";
    job.updatedAt = new Date().toISOString();
    await persistJobs();
    const { sceneImages } = await generateVisualAssets(script, merged.avatarPresetId);

    let sceneAudios: { sceneIndex: number; audioPath: string | null }[] = [];
    if (merged.enableTts) {
      job.status = "voice";
      job.updatedAt = new Date().toISOString();
      await persistJobs();
      sceneAudios = await generateSceneAudios(script.scenes, {
        voice: {
          voiceGender: merged.voiceGender,
          voiceAge: merged.voiceAge,
          voiceTone: merged.voiceTone,
          voiceSpeed: merged.voiceSpeed,
          voicePitch: merged.voicePitch,
        },
      });
    }

    const bgmPath = await selectBgm({
      durationSeconds: script.totalDurationSeconds,
      noBgm: merged.noBgm,
      bgmGenre: merged.bgmGenre,
      bgmMood: merged.bgmMood,
      bgmVolume: merged.bgmVolume,
    });

    job.status = "video";
    job.updatedAt = new Date().toISOString();
    await persistJobs();
    const videoMeta = await editAssembleVideo({
      script,
      sceneImages,
      sceneAudios,
      bgmPath,
      bgmVolume: merged.bgmVolume ?? 0.15,
    });

    if (merged.uploadMode === "review_first") {
      const { videoPath: storedPath, supabaseUrl, expiresAt } = await copyVideoToStorage(
        jobId,
        videoMeta.videoPath,
        job.createdAt,
        RETENTION_DAYS_VIDEO_READY
      );
      job.status = "video_ready";
      job.videoPath = storedPath;
      job.supabaseUrl = supabaseUrl;
      job.expiresAt = expiresAt;
      job.updatedAt = new Date().toISOString();
      await persistJobs();
      await enforceVideoReadyCap();
      return;
    }

    job.status = "upload";
    job.updatedAt = new Date().toISOString();
    await persistJobs();
    const meta = {
      title: script.topicTitle.slice(0, 100),
      description: script.hook + "\n\n" + script.scenes.map((s) => s.text).join("\n"),
    };
    const { results } = await deployToPlatforms(
      videoMeta.videoPath,
      meta,
      merged.platforms,
      merged.youtubeKey
    );
    const deployedUrls: Record<string, string> = {};
    for (const [platform, r] of Object.entries(results ?? {})) {
      if (r?.url) {
        deployedUrls[platform] = r.url;
        // [Stats 피드백] 초기 성과 데이터 생성
        try {
          await updateVideoStats({
            jobId,
            platform,
            externalId: r.url.split("/").pop() || jobId, // URL에서 ID 추출 시도
            views: 0,
            likes: 0,
            comments: 0,
            updatedAt: new Date().toISOString()
          });
        } catch {
          // ignore
        }
      }
    }
    job.deployedUrls = Object.keys(deployedUrls).length ? deployedUrls : undefined;
    job.videoUrl = job.deployedUrls?.youtube ?? Object.values(deployedUrls)[0];

    job.status = "done";
    const { videoPath: storedPath, supabaseUrl, expiresAt } = await copyVideoToStorage(
      jobId,
      videoMeta.videoPath,
      job.createdAt,
      RETENTION_DAYS_UPLOADED
    );
    job.videoPath = storedPath;
    job.supabaseUrl = supabaseUrl;
    job.expiresAt = expiresAt;
    job.updatedAt = new Date().toISOString();
    await persistJobs();
  } catch (err) {
    job.status = "failed";
    job.error = err instanceof Error ? err.message : String(err);
    job.updatedAt = new Date().toISOString();
    await persistJobs();
  }
}

/** video_ready 상태 job을 선택 플랫폼에 업로드 */
export async function uploadJob(
  jobId: string,
  youtubeKey: string = "default",
  platforms: DeployPlatform[] = ["youtube"]
): Promise<ShortsPipelineJob> {
  await ensureJobsLoaded();
  const job = JOBS.get(jobId);
  if (!job) throw new Error("Job not found");
  if (job.status !== "video_ready" || !job.videoPath || !job.script) {
    throw new Error("Job is not ready for upload");
  }
  const meta = {
    title: job.script.topicTitle.slice(0, 100),
    description: job.script.hook + "\n\n" + job.script.scenes.map((s) => s.text).join("\n"),
  };
  const list: DeployPlatform[] = platforms?.length ? platforms : ["youtube"];
  const { results } = await deployToPlatforms(job.videoPath, meta, list, youtubeKey);
  const deployedUrls: Record<string, string> = {};
  for (const [platform, r] of Object.entries(results ?? {})) {
    if (r?.url) deployedUrls[platform] = r.url;
  }
  job.deployedUrls = Object.keys(deployedUrls).length ? deployedUrls : undefined;
  job.videoUrl = job.deployedUrls?.youtube ?? Object.values(deployedUrls)[0];
  job.status = "done";
  job.expiresAt = getExpiresAt(new Date().toISOString(), RETENTION_DAYS_UPLOADED);
  job.updatedAt = new Date().toISOString();
  await persistJobs();
  return job;
}

export async function listJobsAsync(limit = 20): Promise<ShortsPipelineJob[]> {
  await ensureJobsLoaded();
  await runCleanupExpiredFiles();
  return Array.from(JOBS.values())
    .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
    .slice(0, limit);
}

export function listJobs(limit = 20): ShortsPipelineJob[] {
  return Array.from(JOBS.values())
    .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
    .slice(0, limit);
}

export async function getJobAsync(jobId: string): Promise<ShortsPipelineJob | undefined> {
  await ensureJobsLoaded();
  return JOBS.get(jobId);
}

export function getJob(jobId: string): ShortsPipelineJob | undefined {
  return JOBS.get(jobId);
}

export async function getLibrary(): Promise<ShortsPipelineJob[]> {
  await ensureJobsLoaded();
  await runCleanupExpiredFiles();
  return Array.from(JOBS.values())
    .filter((j) => (j.status === "done" || j.status === "video_ready") && j.videoPath && !isExpired(j.expiresAt))
    .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
}

export async function getChecklist(limit = 100): Promise<ShortsPipelineJob[]> {
  await ensureJobsLoaded();
  await runCleanupExpiredFiles();
  return Array.from(JOBS.values())
    .filter((j) => (j.status === "done" || j.status === "video_ready") && (j.fileDeletedAt != null || !j.videoPath))
    .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
    .slice(0, limit);
}
