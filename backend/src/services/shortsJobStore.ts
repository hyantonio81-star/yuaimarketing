/**
 * Shorts Job 영속화: data/shorts_jobs.json에 저장·로드.
 * 서버 재시작 시 복원, job 갱신 시 저장.
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ShortsPipelineJob } from "./shorts/shortsTypes.js";

const DEFAULT_JOBS_FILE = "shorts_jobs.json";

function getJobsPath(): string {
  const dataDir = process.env.SHORTS_JOBS_FILE
    ? join(process.cwd(), process.env.SHORTS_JOBS_FILE)
    : join(process.cwd(), "data", DEFAULT_JOBS_FILE);
  return dataDir;
}

/** 파일에서 job 목록 로드 (직렬화 가능한 필드만) */
export async function loadJobsFromFile(): Promise<ShortsPipelineJob[]> {
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

/** job 목록을 파일에 저장 */
export async function saveJobsToFile(jobs: ShortsPipelineJob[]): Promise<void> {
  const path = getJobsPath();
  const dir = join(path, "..");
  if (!existsSync(dir)) {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(dir, { recursive: true });
  }
  const payload = { jobs, updatedAt: new Date().toISOString() };
  await writeFile(path, JSON.stringify(payload, null, 2), "utf-8");
}
