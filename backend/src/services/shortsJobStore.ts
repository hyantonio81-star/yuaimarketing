/**
 * Shorts Job 영속화: data/shorts_jobs.json(폴백) 및 Supabase(shorts_jobs) 저장·로드.
 * 서버 재시작 시 복원, job 갱신 시 저장.
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ShortsPipelineJob } from "./shorts/shortsTypes.js";
import { getSupabaseAdmin } from "../lib/supabaseServer.js";

const DEFAULT_JOBS_FILE = "shorts_jobs.json";

function getJobsPath(): string {
  const dataDir = process.env.SHORTS_JOBS_FILE
    ? join(process.cwd(), process.env.SHORTS_JOBS_FILE)
    : join(process.cwd(), "data", DEFAULT_JOBS_FILE);
  return dataDir;
}

/** 파일에서 job 목록 로드 (폴백용) */
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

/** job 목록 로드 (Supabase 우선) */
export async function loadJobsFromFile(): Promise<ShortsPipelineJob[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("shorts_jobs")
      .select("jobs")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!error && data && Array.isArray(data.jobs)) {
      return data.jobs as ShortsPipelineJob[];
    }
  }
  return loadJobsFromFileFallback();
}

/** job 목록 저장 (Supabase 및 파일 폴백) */
export async function saveJobsToFile(jobs: ShortsPipelineJob[]): Promise<void> {
  const now = new Date().toISOString();
  const payload = { jobs, updatedAt: now };

  const supabase = getSupabaseAdmin();
  if (supabase) {
    // 단일 레코드에 전체 목록 저장 (upsert용 키가 없으면 organization_id 등 활용 가능하나 여기선 id=1 고정 방식 또는 유사 방식 가정)
    // 여기선 jobs_store 테이블에 id='current' 로 저장한다고 가정하거나 shorts_jobs 에 개별 insert가 아닌 통째 저장
    const { error } = await supabase
      .from("shorts_jobs")
      .upsert({ id: "current", jobs: jobs, updated_at: now }, { onConflict: "id" });
    
    if (!error) return;
  }

  const path = getJobsPath();
  const dir = join(path, "..");
  if (!existsSync(dir)) {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(dir, { recursive: true });
  }
  await writeFile(path, JSON.stringify(payload, null, 2), "utf-8");
}
