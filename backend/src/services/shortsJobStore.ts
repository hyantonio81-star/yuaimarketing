/**
 * Shorts Job 영속화:
 * - 우선 Supabase `shorts_pipeline_jobs` (job 단위 행, 멀티 인스턴스 안전)
 * - 폴백/호환: `shorts_jobs` id=current JSON blob (SHORTS_JOBS_DUAL_WRITE_BLOB, 기본 true)
 * - 로컬: data/shorts_jobs.json (SHORTS_JOB_FILE_FALLBACK)
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShortsPipelineJob } from "./shorts/shortsTypes.js";
import { getSupabaseAdmin } from "../lib/supabaseServer.js";
import { getLocalDataDir } from "../lib/localDataDir.js";

const DEFAULT_JOBS_FILE = "shorts_jobs.json";
const UPSERT_CHUNK = 120;

function getJobsPath(): string {
  if (process.env.SHORTS_JOBS_FILE) {
    return join(process.cwd(), process.env.SHORTS_JOBS_FILE);
  }
  return join(getLocalDataDir(), DEFAULT_JOBS_FILE);
}

async function loadJobsFromFileFallback(): Promise<ShortsPipelineJob[]> {
  const path = getJobsPath();
  if (!existsSync(path)) return [];
  try {
    const raw = await readFile(path, "utf-8");
    const data = JSON.parse(raw);
    const list = Array.isArray(data?.jobs) ? data.jobs : [];
    return list.filter((j: unknown) => j && typeof (j as ShortsPipelineJob).jobId === "string");
  } catch {
    return [];
  }
}

async function loadJobsBlobFromSupabase(supabase: SupabaseClient): Promise<ShortsPipelineJob[]> {
  const { data, error } = await supabase
    .from("shorts_jobs")
    .select("jobs")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data || !Array.isArray(data.jobs)) return [];
  return data.jobs as ShortsPipelineJob[];
}

/**
 * 행 스토어에 데이터가 있으면 payload 목록 반환.
 * 행이 0건이면 null (레거시 blob 로드 시도).
 * 테이블 없음 등 오류 시 null.
 */
async function loadFromPipelineJobRows(supabase: SupabaseClient): Promise<ShortsPipelineJob[] | null> {
  const { count, error: countErr } = await supabase
    .from("shorts_pipeline_jobs")
    .select("*", { count: "exact", head: true });

  if (countErr) {
    if (/does not exist|relation/i.test(countErr.message)) return null;
    console.warn("[shortsJobStore] shorts_pipeline_jobs count:", countErr.message);
    return null;
  }

  if ((count ?? 0) === 0) return null;

  const limit = Math.min(
    10_000,
    Math.max(1, parseInt(process.env.SHORTS_JOBS_LOAD_LIMIT ?? "5000", 10) || 5000)
  );
  const { data, error } = await supabase
    .from("shorts_pipeline_jobs")
    .select("payload")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[shortsJobStore] shorts_pipeline_jobs select:", error.message);
    return null;
  }
  const list = (data ?? [])
    .map((r) => r.payload as ShortsPipelineJob)
    .filter((j) => j && typeof j.jobId === "string");
  return list;
}

async function upsertPipelineJobRows(supabase: SupabaseClient, jobs: ShortsPipelineJob[]): Promise<string | null> {
  const rows = jobs.map((j) => ({
    job_id: j.jobId,
    payload: j,
    status: j.status,
    owner_user_id: j.ownerUserId ?? null,
    created_at: j.createdAt,
    updated_at: j.updatedAt,
  }));

  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK);
    const { error } = await supabase.from("shorts_pipeline_jobs").upsert(chunk, { onConflict: "job_id" });
    if (error) return error.message;
  }
  return null;
}

/** job 목록 로드 (행 스토어 → 레거시 blob → 파일) */
export async function loadJobsFromFile(): Promise<ShortsPipelineJob[]> {
  const supabase = getSupabaseAdmin();
  const allowFileFallback =
    process.env.SHORTS_JOB_FILE_FALLBACK === "true" || process.env.NODE_ENV !== "production";

  if (supabase) {
    const fromRows = await loadFromPipelineJobRows(supabase);
    if (fromRows !== null) {
      if (fromRows.length > 0) return fromRows;
      /* 행 테이블은 있으나 비어 있음 → blob에서 초기 마이그레이션 */
    }

    const fromBlob = await loadJobsBlobFromSupabase(supabase);
    if (fromBlob.length > 0) return fromBlob;

    if (fromRows !== null) return [];

    const { error } = await supabase
      .from("shorts_jobs")
      .select("jobs")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && !allowFileFallback) {
      throw new Error(`[shorts_jobs] Supabase load failed (file fallback disabled): ${error.message}`);
    }
  }

  if (allowFileFallback) return loadJobsFromFileFallback();
  return [];
}

/** job 목록 저장 */
export async function saveJobsToFile(jobs: ShortsPipelineJob[]): Promise<void> {
  const now = new Date().toISOString();
  const payload = { jobs, updatedAt: now };

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const rowErr = await upsertPipelineJobRows(supabase, jobs);
    if (rowErr) console.warn("[shortsJobStore] shorts_pipeline_jobs upsert:", rowErr);

    const dualBlob = process.env.SHORTS_JOBS_DUAL_WRITE_BLOB !== "false";
    if (dualBlob || rowErr) {
      const { error: blobErr } = await supabase
        .from("shorts_jobs")
        .upsert({ id: "current", jobs, updated_at: now }, { onConflict: "id" });
      if (!blobErr && !rowErr) return;
      if (!rowErr) return;
    } else if (!rowErr) {
      return;
    }
  }

  const path = getJobsPath();
  const dir = join(path, "..");
  if (!existsSync(dir)) {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(dir, { recursive: true });
  }
  await writeFile(path, JSON.stringify(payload, null, 2), "utf-8");
}
