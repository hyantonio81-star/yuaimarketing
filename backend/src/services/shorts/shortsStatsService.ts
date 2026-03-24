import { getSupabaseAdmin } from "../../lib/supabaseServer.js";
import { loadJobsFromFile } from "../shortsJobStore.js";
import type { ShortsPipelineJob } from "./shortsTypes.js";

/**
 * Shorts 성과(조회수, 좋아요 등)를 추적하고 AI의 주제 선정에 피드백을 주기 위한 서비스.
 * Job 메타데이터는 Supabase `shorts_jobs` 단일 행이 아니라 shortsJobStore(파일 또는 동일 테이블의 jobs 배열)와 동기화됩니다.
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

  // 2. job_id → topic (shortsJobStore: data/shorts_jobs.json 또는 Supabase id=current 행의 jobs 배열)
  const jobIds = [...new Set(data.map((d) => d.job_id))];
  const allJobs = await loadJobsFromFile();
  const byId = new Map(allJobs.map((j) => [j.jobId, j] as const));
  const keywords = jobIds
    .map((id) => (byId.get(id)?.topic as { keyword?: string } | undefined)?.keyword)
    .filter((k): k is string => !!k);

  // 빈도순 정렬
  const counts: Record<string, number> = {};
  keywords.forEach(k => counts[k] = (counts[k] || 0) + 1);

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(e => e[0])
    .slice(0, limit);
}

/**
 * [AI Self-Optimization Engine]
 * 성과 데이터를 LLM에 전달하여 다음 전략적 판단(카테고리 가중치, 개선 방향)을 도출합니다.
 */
export async function analyzePerformanceAndSuggest(): Promise<{
  suggestedCategory?: string;
  reasoning: string;
  boostKeywords?: string[];
}> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { reasoning: "Supabase not configured. Using default strategy." };

  try {
    // 1. 최근 30개 영상의 성과 데이터 수집 (views 기준 상위)
    const { data: stats, error: statsErr } = await supabase
      .from("shorts_stats")
      .select("job_id, views, likes, platform")
      .order("views", { ascending: false })
      .limit(30);

    if (statsErr || !stats || stats.length === 0) {
      return { reasoning: "Not enough performance data. Continuing exploratory phase." };
    }

    // 2. Job 메타데이터는 shortsJobStore와 매칭 (DB shorts_jobs는 id=current + jobs[] 구조)
    const allJobs = await loadJobsFromFile();
    const byId = new Map<string, ShortsPipelineJob>(allJobs.map((j) => [j.jobId, j]));

    // 3. LLM에 전달할 리포트 생성
    const performanceReport = stats.map((s) => {
      const job = byId.get(s.job_id);
      const topic = job?.topic as { title?: string; category?: string; keyword?: string } | undefined;
      return {
        title: topic?.title,
        category: topic?.category,
        keyword: topic?.keyword,
        views: s.views,
        likes: s.likes,
        platform: s.platform,
      };
    });

    const geminiKey = (process.env.GEMINI_API_KEY ?? "").trim();
    if (!geminiKey) return { reasoning: "AI Key missing. Static strategy only." };

    // 4. Gemini를 통한 전략 도출
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an AI Marketing Strategist. Analyze this performance report of recent AI Shorts and suggest the next best strategy.
    
    Performance Data (Recent Top 30):
    ${JSON.stringify(performanceReport, null, 2)}
    
    Available Categories: economy, ai, health, lifestyle, k-culture, latam, silver.
    
    Task:
    1. Identify the most successful category and why.
    2. Suggest 1 category to focus on for the NEXT video production.
    3. Suggest 3 keywords to boost.
    4. Provide a 1-sentence strategic reasoning (in Korean).
    
    Output Format (JSON only):
    {
      "suggestedCategory": "category_name",
      "reasoning": "AI의 전략적 판단 근거...",
      "boostKeywords": ["keyword1", "keyword2", "keyword3"]
    }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    const suggestion = JSON.parse(text);

    return {
      suggestedCategory: suggestion.suggestedCategory,
      reasoning: suggestion.reasoning,
      boostKeywords: suggestion.boostKeywords
    };
  } catch (err) {
    console.error("[Performance Analysis Error]", err);
    return { reasoning: "AI analysis failed. Falling back to default rotation." };
  }
}
