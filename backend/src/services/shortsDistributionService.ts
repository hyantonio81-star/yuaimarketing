import { getSupabaseAdmin } from "../lib/supabaseServer.js";
import type { DistributionQueueItem, ShortsPipelineJob } from "./shorts/shortsTypes.js";
import { getJobAsync, persistJobs } from "./shortsAgentService.js";
import {
  deployToPlatforms,
  deployToPlatformsFromRemoteUrl,
  type DeployPlatform,
} from "./shorts/shortsDeployAgent.js";
import { YOUTUBE_LEGACY_USER_SENTINEL } from "./youtubeUploadService.js";

const QUEUE_TABLE = "shorts_distribution_queue";

/** Map a snake_case DB row to the camelCase DistributionQueueItem interface. */
function rowToCamel(row: Record<string, any>): DistributionQueueItem {
  return {
    id: row.id,
    jobId: row.job_id,
    platform: row.platform,
    status: row.status,
    scheduledAt: row.scheduled_at,
    publishedAt: row.published_at ?? undefined,
    error: row.error ?? undefined,
    retryCount: row.retry_count ?? 0,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 플랫폼별 맞춤 메타데이터 생성 (AI 에이전트 모사) */
function generatePlatformMetadata(job: ShortsPipelineJob, platform: string) {
  const baseTitle = job.script?.topicTitle || "AI Trend Video";
  const baseHook = job.script?.hook || "";
  
  switch(platform) {
    case "youtube":
      return {
        title: baseTitle.slice(0, 100),
        description: `${baseHook}\n\n#Shorts #AI #Trending`,
      };
    case "tiktok":
      return {
        title: baseTitle,
        description: `${baseHook} 🚀 #fyp #ai #trending #viral`,
      };
    case "instagram":
      return {
        title: baseTitle,
        description: `${baseHook}\n.\n.\n#ai #reels #trending #insight`,
      };
    default:
      return {
        title: baseTitle,
        description: baseHook,
      };
  }
}

/**
 * 작업을 배포 대기열에 추가
 */
export async function addToDistributionQueue(
  jobId: string, 
  platforms: string[], 
  options: { scheduledAt?: string } = {}
): Promise<DistributionQueueItem[]> {
  const supabase = getSupabaseAdmin();
  const job = await getJobAsync(jobId);
  if (!job) throw new Error("Job not found");

  // DB column names are snake_case; DistributionQueueItem uses camelCase for in-memory use.
  const items = platforms.map((platform, index) => {
    const randomOffset = Math.floor(Math.random() * 15 * 60000);
    const scheduledDate = options.scheduledAt 
      ? new Date(new Date(options.scheduledAt).getTime() + (index * 3600000) + randomOffset) 
      : new Date(Date.now() + ((index + 1) * 3600000) + randomOffset);

    return {
      job_id: jobId,
      platform: platform as DistributionQueueItem["platform"],
      status: "waiting" as const,
      scheduled_at: scheduledDate.toISOString(),
      retry_count: 0,
      metadata: generatePlatformMetadata(job, platform),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  if (supabase) {
    const { data, error } = await supabase
      .from(QUEUE_TABLE)
      .insert(items)
      .select();
    
    if (error) throw error;

    job.status = "queued";
    job.updatedAt = new Date().toISOString();
    await persistJobs();

    // Map snake_case DB rows back to camelCase interface
    return (data as any[]).map(rowToCamel);
  } else {
    console.log(`[Distribution Queue] Added ${jobId} to ${platforms.join(", ")}`);
    return [];
  }
}

/** 대기열 목록 조회 */
export async function getDistributionQueue(limit = 50): Promise<DistributionQueueItem[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(QUEUE_TABLE)
    .select("*")
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data as any[] ?? []).map(rowToCamel);
}

/** 
 * 배포 워커 (스케줄러에 의해 호출됨)
 */
export async function processDistributionQueue(opts: { limit?: number } = {}): Promise<{
  processed: number;
  success: number;
  failed: number;
}> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { processed: 0, success: 0, failed: 0 };

  const now = new Date().toISOString();
  const limit = Math.min(50, Math.max(1, opts.limit ?? 5));
  const { data: rows, error } = await supabase
    .from(QUEUE_TABLE)
    .select("*")
    .eq("status", "waiting")
    .lte("scheduled_at", now)
    .limit(limit);

  if (error || !rows) return { processed: 0, success: 0, failed: 0 };

  const items = (rows as any[]).map(rowToCamel);
  let processed = 0;
  let success = 0;
  let failed = 0;

  for (const item of items) {
    processed += 1;
    const job = await getJobAsync(item.jobId);
    if (!job || (!job.videoPath && !job.supabaseUrl)) {
      await supabase.from(QUEUE_TABLE).update({ 
        status: "failed", 
        error: "Video file not found",
        updated_at: now 
      }).eq("id", item.id);
      failed += 1;
      continue;
    }

    try {
      await supabase.from(QUEUE_TABLE).update({ status: "processing", updated_at: now }).eq("id", item.id);

      const videoSource = job.videoPath || job.supabaseUrl;
      
      console.log(`[Distribution Worker] Publishing job ${item.jobId} to ${item.platform}...`);
      
      const ytKey =
        typeof item.metadata?.youtubeKey === "string" && item.metadata.youtubeKey.trim()
          ? item.metadata.youtubeKey.trim()
          : "default";
      const ownerId = (job.ownerUserId ?? "").trim() || YOUTUBE_LEGACY_USER_SENTINEL;

      const ytPreset = job.pipelineFormat === "long" ? "long" : "shorts";
      const meta = {
        title: item.metadata?.title || job.script?.topicTitle || "AI Content",
        description: item.metadata?.description || job.script?.hook || "",
      };
      const platforms = [item.platform as DeployPlatform];
      const isRemote =
        videoSource!.startsWith("http://") || videoSource!.startsWith("https://");
      const { results, errors } = isRemote
        ? await deployToPlatformsFromRemoteUrl(videoSource!, meta, platforms, ytKey, ownerId, ytPreset)
        : await deployToPlatforms(videoSource!, meta, platforms, ytKey, ownerId, ytPreset);

      const result = (results as any)[item.platform];
      const platformError = (errors as any)[item.platform];

      if (result) {
        await supabase.from(QUEUE_TABLE).update({ 
          status: "done", 
          published_at: new Date().toISOString(),
          metadata: { ...item.metadata, deployedUrl: result.url },
          updated_at: new Date().toISOString() 
        }).eq("id", item.id);
        success += 1;
      } else {
        throw new Error(platformError || "Deployment failed");
      }

    } catch (err) {
      console.error(`[Distribution Worker Error] Item ${item.id}:`, err);
      const retryCount = (item.retryCount || 0) + 1;
      const nextStatus = retryCount >= 3 ? "failed" : "waiting";
      
      await supabase.from(QUEUE_TABLE).update({ 
        status: nextStatus, 
        error: String(err),
        retry_count: retryCount,
        scheduled_at: new Date(Date.now() + 3600000).toISOString(),
        updated_at: new Date().toISOString() 
      }).eq("id", item.id);
      failed += 1;
    }
  }

  return { processed, success, failed };
}

// 5분마다 대기열 처리. 주의: Vercel 등 서버리스에서는 프로세스가 상주하지 않아 이 타이머가 사실상 동작하지 않을 수 있음 → 상시 백엔드 또는 Cron 필요.
if (process.env.NODE_ENV !== "test") {
  setInterval(() => {
    processDistributionQueue().catch((err) => console.error("[Distribution Interval Error]:", err));
  }, 300000);
}
