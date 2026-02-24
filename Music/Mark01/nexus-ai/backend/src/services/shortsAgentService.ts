/**
 * YouTube Shorts 자율 생성 에이전트
 * 1) 트렌드 수집 2) 스크립트·캐릭터 3) 이미지 생성(OpenAI/placeholder) 4) TTS 5) 영상 조립(스텁) 6) YouTube 업로드(연동 시 실업로드)
 */
import { searchVideos } from "./externalApis/youtube.js";
import { generateImagesForScript as generateImagesFromService } from "./shortsImageService.js";
import { getAvatarPromptHint } from "./shortsImageService.js";
import { generateAudioForScript } from "./shortsTtsService.js";
import { uploadVideo as youtubeUploadVideo, getConnectionStatus as getYoutubeConnectionStatus } from "./youtubeUploadService.js";

export interface TrendTopic {
  id: string;
  keyword: string;
  title: string;
  summary: string;
  source: "youtube" | "manual";
  publishedAt?: string;
  score?: number;
}

export interface ShortsCharacter {
  name: string;
  description: string;
  tone: string;
  imagePromptHint: string;
}

export interface ShortsScriptScene {
  sceneIndex: number;
  text: string;
  imagePrompt: string;
  durationSeconds: number;
}

export interface ShortsScript {
  topicId: string;
  topicTitle: string;
  hook: string;
  character: ShortsCharacter;
  scenes: ShortsScriptScene[];
  totalDurationSeconds: number;
}

export interface ShortsPipelineJob {
  jobId: string;
  status: "pending" | "collecting" | "script" | "images" | "video" | "upload" | "done" | "failed";
  topic?: TrendTopic;
  script?: ShortsScript;
  videoUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

const JOBS = new Map<string, ShortsPipelineJob>();

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** 1) 트렌드 수집: 키워드로 YouTube 인기/최신 Shorts 주제 후보 수집 */
export async function collectTrendTopics(keywords: string[], options?: { maxPerKeyword?: number }): Promise<TrendTopic[]> {
  const maxPer = options?.maxPerKeyword ?? 5;
  const topics: TrendTopic[] = [];
  const seen = new Set<string>();

  for (const kw of keywords.slice(0, 10)) {
    if (!kw?.trim()) continue;
    try {
      const { items } = await searchVideos(kw.trim(), { maxResults: maxPer, order: "relevance" });
      for (const it of items ?? []) {
        const id = it.videoId || `manual-${simpleHash(it.title + kw)}`;
        if (seen.has(id)) continue;
        seen.add(id);
        topics.push({
          id,
          keyword: kw.trim(),
          title: it.title ?? "",
          summary: (it.description ?? "").slice(0, 200),
          source: "youtube",
          publishedAt: it.publishedAt ?? undefined,
          score: simpleHash(it.title + it.channelId) % 100,
        });
      }
    } catch {
      // API 미설정 또는 실패 시 수동 주제 1개 추가
      const manualId = `manual-${simpleHash(kw + Date.now())}`;
      if (!seen.has(manualId)) {
        seen.add(manualId);
        topics.push({
          id: manualId,
          keyword: kw.trim(),
          title: `${kw} 관련 트렌드`,
          summary: "수동/스텁 주제 (YouTube API 미설정 시)",
          source: "manual",
          score: 50,
        });
      }
    }
  }

  if (topics.length === 0) {
    topics.push({
      id: "stub-1",
      keyword: "Shorts",
      title: "YouTube Shorts 트렌드 예시",
      summary: "에이전트가 트렌드를 수집한 뒤 스크립트·이미지·영상을 생성합니다.",
      source: "manual",
      score: 60,
    });
  }

  return topics.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

/** 아바타 프리셋 ID로 imagePromptHint 반환 */
function defaultAvatarHint(): string {
  return getAvatarPromptHint("shortsbot");
}

/** 2) 주제 1개 선정 + 스크립트(연변) + 유일 캐릭터 생성. avatarPresetId 있으면 해당 힌트 사용 */
export function generateScriptForTopic(topic: TrendTopic, avatarPresetId?: string): ShortsScript {
  const imagePromptHint = getAvatarPromptHint(avatarPresetId) || defaultAvatarHint();
  const character: ShortsCharacter = {
    name: "쇼츠봇",
    description: "미니멀 일러스트 캐릭터, 한 줄 요약 톤",
    tone: "친근한 반말",
    imagePromptHint,
  };
  const hook = `${topic.title.slice(0, 30)}${topic.title.length > 30 ? "…" : ""} 지금 이슈에요.`;
  const scenes: ShortsScriptScene[] = [
    { sceneIndex: 1, text: hook, imagePrompt: `${character.imagePromptHint}, text: "${hook.slice(0, 20)}"`, durationSeconds: 3 },
    { sceneIndex: 2, text: topic.summary.slice(0, 80), imagePrompt: `${character.imagePromptHint}, topic summary`, durationSeconds: 4 },
    { sceneIndex: 3, text: "더 자세한 내용은 링크에서 확인해 주세요.", imagePrompt: `${character.imagePromptHint}, CTA`, durationSeconds: 2 },
  ];
  return {
    topicId: topic.id,
    topicTitle: topic.title,
    hook,
    character,
    scenes,
    totalDurationSeconds: scenes.reduce((s, sc) => s + sc.durationSeconds, 0),
  };
}

/** 3) 이미지 생성: shortsImageService 사용 (OpenAI 있으면 DALL·E, 없으면 placeholder) */
export async function generateImagesForScript(script: ShortsScript, avatarPresetId?: string): Promise<{ sceneIndex: number; imageUrl: string }[]> {
  const result = await generateImagesFromService(script, avatarPresetId);
  return result.map((r) => ({ sceneIndex: r.sceneIndex, imageUrl: r.imageUrl }));
}

/** 4) 영상 조립 (스텁: 실제 파일 생성 없이 메타만 반환, 추후 FFmpeg 등 연동) */
export async function assembleVideo(
  _script: ShortsScript,
  _sceneImages: { sceneIndex: number; imageUrl: string }[]
): Promise<{ videoPath: string; thumbnailPath: string; durationSeconds: number }> {
  return {
    videoPath: "/tmp/shorts-stub.mp4",
    thumbnailPath: "/tmp/shorts-stub-thumb.jpg",
    durationSeconds: _script.totalDurationSeconds,
  };
}

/** 5) YouTube 업로드: 계정 연동 시 실업로드, 아니면 스텁 반환 */
export async function uploadToYouTube(videoPath: string, meta: { title: string; description?: string }, youtubeKey: string = "default"): Promise<{ videoId: string; url: string }> {
  const { connected } = getYoutubeConnectionStatus(youtubeKey);
  if (connected) {
    const result = await youtubeUploadVideo(videoPath, meta, youtubeKey);
    if ("error" in result) {
      throw new Error(result.error);
    }
    return { videoId: result.videoId, url: result.url };
  }
  return {
    videoId: "stub-video-id",
    url: "https://www.youtube.com/shorts/stub-video-id",
  };
}

export interface RunPipelineOptions {
  avatarPresetId?: string;
  youtubeKey?: string;
  enableTts?: boolean;
}

/** 파이프라인 1회 실행: 수집 → 스크립트 → 이미지 → TTS → 영상 → 업로드 */
export async function runPipelineOnce(keywords: string[], options?: RunPipelineOptions): Promise<ShortsPipelineJob> {
  const { avatarPresetId, youtubeKey = "default", enableTts = true } = options ?? {};
  const jobId = `job-${Date.now()}-${simpleHash(keywords.join(","))}`;
  const now = new Date().toISOString();
  const job: ShortsPipelineJob = {
    jobId,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  JOBS.set(jobId, job);

  try {
    job.status = "collecting";
    job.updatedAt = new Date().toISOString();
    const topics = await collectTrendTopics(keywords.length ? keywords : ["YouTube Shorts", "트렌드"]);
    const topic = topics[0];
    job.topic = topic;

    job.status = "script";
    job.updatedAt = new Date().toISOString();
    const script = generateScriptForTopic(topic, avatarPresetId);
    job.script = script;

    job.status = "images";
    job.updatedAt = new Date().toISOString();
    const sceneImages = await generateImagesForScript(script, avatarPresetId);

    let sceneAudios: { sceneIndex: number; audioPath: string | null }[] = [];
    if (enableTts) {
      sceneAudios = await generateAudioForScript(script.scenes);
    }

    job.status = "video";
    job.updatedAt = new Date().toISOString();
    const videoMeta = await assembleVideo(script, sceneImages);

    job.status = "upload";
    job.updatedAt = new Date().toISOString();
    const uploadResult = await uploadToYouTube(
      videoMeta.videoPath,
      {
        title: script.topicTitle.slice(0, 100),
        description: script.hook + "\n\n" + script.scenes.map((s) => s.text).join("\n"),
      },
      youtubeKey
    );

    job.status = "done";
    job.videoUrl = uploadResult.url;
    job.updatedAt = new Date().toISOString();
  } catch (err) {
    job.status = "failed";
    job.error = err instanceof Error ? err.message : String(err);
    job.updatedAt = new Date().toISOString();
  }

  return job;
}

/** 작업 목록 조회 */
export function listJobs(limit = 20): ShortsPipelineJob[] {
  return Array.from(JOBS.values())
    .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
    .slice(0, limit);
}

/** 작업 1건 조회 */
export function getJob(jobId: string): ShortsPipelineJob | undefined {
  return JOBS.get(jobId);
}
