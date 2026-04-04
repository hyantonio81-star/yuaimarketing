import { getSupabaseAdmin } from "../lib/supabaseServer.js";

const ACTIVE_STATUSES = [
  "pending",
  "collecting",
  "script",
  "images",
  "voice",
  "video",
  "pending_assembly",
  "upload",
] as const;

function parseEnvInt(key: string, fallback: number): number {
  const v = parseInt(process.env[key] ?? "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

/** UTC YYYY-MM-DD */
function utcDayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * DB 기준 활성 파이프라인 수 (멀티 인스턴스 공유). 테이블 없으면 0.
 */
export async function countActivePipelineJobsFromDb(): Promise<number> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from("shorts_pipeline_jobs")
    .select("*", { count: "exact", head: true })
    .in("status", [...ACTIVE_STATUSES]);
  if (error) return 0;
  return count ?? 0;
}

/**
 * 일일 상한(UTC) + 동시 실행 상한. skip=true 이면 스킵(버퍼 리필 등).
 */
export async function assertCanStartShortsPipeline(opts: { skipLimits?: boolean } = {}): Promise<void> {
  if (opts.skipLimits) return;
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const maxConcurrent = parseEnvInt("SHORTS_MAX_CONCURRENT_PIPELINES", 0);
  if (maxConcurrent > 0) {
    const n = await countActivePipelineJobsFromDb();
    if (n >= maxConcurrent) {
      throw new Error(
        `Too many concurrent Shorts pipelines (${n}/${maxConcurrent}). Set SHORTS_MAX_CONCURRENT_PIPELINES or wait.`
      );
    }
  }

  const maxDaily = parseEnvInt("SHORTS_DAILY_MAX_PIPELINES", 0);
  if (maxDaily > 0) {
    const day = utcDayString();
    const { data, error } = await supabase.rpc("shorts_claim_daily_generation", {
      p_day: day,
      p_max: maxDaily,
    });
    if (error) {
      console.warn(
        "[shorts] shorts_claim_daily_generation RPC failed (apply migration 20260404130000?):",
        error.message
      );
      return;
    }
    if (data !== true) {
      throw new Error(
        `Daily Shorts generation limit reached for UTC ${day} (${maxDaily}). Increase SHORTS_DAILY_MAX_PIPELINES or try tomorrow.`
      );
    }
  }
}
