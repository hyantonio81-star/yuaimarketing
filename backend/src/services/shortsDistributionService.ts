import { getSupabaseAdmin } from "../lib/supabaseServer.js";
import type { DistributionQueueItem, ShortsPipelineJob } from "./shorts/shortsTypes.js";
import { getJobAsync, persistJobs } from "./shortsAgentService.js";
import { deployToPlatforms, type DeployPlatform } from "./shorts/shortsDeployAgent.js";

const QUEUE_TABLE = "shorts_distribution_queue";

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

  const items: Partial<DistributionQueueItem>[] = platforms.map((platform, index) => {
    const randomOffset = Math.floor(Math.random() * 15 * 60000);
    const scheduledDate = options.scheduledAt 
      ? new Date(new Date(options.scheduledAt).getTime() + (index * 3600000) + randomOffset) 
      : new Date(Date.now() + ((index + 1) * 3600000) + randomOffset);

    return {
      jobId,
      platform: platform as any,
      status: "waiting",
      scheduledAt: scheduledDate.toISOString(),
      retryCount: 0,
      metadata: generatePlatformMetadata(job, platform),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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

    return data;
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
    .order("scheduledAt", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/** 
 * 배포 워커 (스케줄러에 의해 호출됨)
 */
export async function processDistributionQueue(): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const now = new Date().toISOString();
  const { data: items, error } = await supabase
    .from(QUEUE_TABLE)
    .select("*")
    .eq("status", "waiting")
    .lte("scheduledAt", now)
    .limit(5);

  if (error || !items) return;

  for (const item of items) {
    const job = await getJobAsync(item.jobId);
    if (!job || (!job.videoPath && !job.supabaseUrl)) {
      await supabase.from(QUEUE_TABLE).update({ 
        status: "failed", 
        error: "Video file not found",
        updatedAt: now 
      }).eq("id", item.id);
      continue;
    }

    try {
      await supabase.from(QUEUE_TABLE).update({ status: "processing", updatedAt: now }).eq("id", item.id);

      const videoSource = job.videoPath || job.supabaseUrl;
      
      console.log(`[Distribution Worker] Publishing job ${item.jobId} to ${item.platform}...`);
      
      const { results, errors } = await deployToPlatforms(
        videoSource!,
        {
          title: item.metadata?.title || job.script?.topicTitle || "AI Content",
          description: item.metadata?.description || job.script?.hook || "",
        },
        [item.platform as DeployPlatform],
        "default"
      );

      // TS7053 에러 방지를 위해 any 캐스팅 후 인덱싱
      const result = (results as any)[item.platform];
      const platformError = (errors as any)[item.platform];

      if (result) {
        await supabase.from(QUEUE_TABLE).update({ 
          status: "done", 
          publishedAt: new Date().toISOString(),
          metadata: { ...item.metadata, deployedUrl: result.url },
          updatedAt: new Date().toISOString() 
        }).eq("id", item.id);
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
        retryCount,
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        updatedAt: new Date().toISOString() 
      }).eq("id", item.id);
    }
  }
}

// 5분마다 대기열 체크
if (process.env.NODE_ENV !== "test") {
  setInterval(() => {
    processDistributionQueue().catch(err => console.error("[Distribution Interval Error]:", err));
  }, 300000); 
}
