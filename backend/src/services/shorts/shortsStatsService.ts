import { getSupabaseAdmin } from "../../lib/supabaseServer.js";

/**
 * Shorts 성과(조회수, 좋아요 등)를 추적하고 AI의 주제 선정에 피드백을 주기 위한 서비스.
 */
export interface VideoStats {
  jobId: string;
  platform: string;
  externalId: string; // 플랫폼별 영상 고유 ID
  views: number;
  likes: number;
  comments: number;
  updatedAt: string;
}

/**
 * 성과 데이터 저장 (Supabase 'shorts_stats' 테이블 가정)
 */
export async function updateVideoStats(stats: VideoStats): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const { error } = await supabase
    .from("shorts_stats")
    .upsert({
      job_id: stats.jobId,
      platform: stats.platform,
      external_id: stats.externalId,
      views: stats.views,
      likes: stats.likes,
      comments: stats.comments,
      updated_at: stats.updatedAt,
    }, { onConflict: "job_id,platform" });

  if (error) {
    console.error(`[Stats Update Error] ${stats.jobId}:`, error);
  }
}

/**
 * 가장 성과가 좋았던 카테고리/키워드 분석 (최근 7일)
 */
export async function getWinningTopics(limit = 5): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  // 1. 성과 데이터 조회
  const { data, error } = await supabase
    .from("shorts_stats")
    .select("job_id, views")
    .order("views", { ascending: false })
    .limit(20);

  if (error || !data) return [];

  // 2. 해당 job_id들의 주제/키워드 추출 (shorts_jobs 테이블 연동 필요)
  const jobIds = data.map(d => d.job_id);
  const { data: jobs, error: jobErr } = await supabase
    .from("shorts_jobs")
    .select("topic")
    .in("id", jobIds);

  if (jobErr || !jobs) return [];

  const keywords = jobs
    .map(j => (j.topic as any)?.keyword)
    .filter((k): k is string => !!k);

  // 빈도순 정렬
  const counts: Record<string, number> = {};
  keywords.forEach(k => counts[k] = (counts[k] || 0) + 1);

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(e => e[0])
    .slice(0, limit);
}
