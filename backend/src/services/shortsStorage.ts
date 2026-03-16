/**
 * Shorts 영상 저장: 업로드 완료 또는 video_ready 영상을 지정 경로에 보관.
 * - 업로드된 영상(done): 7일 보관 후 파일 삭제, 체크리스트(job 기록) 유지.
 * - 미업로드(video_ready): 10일 보관, 최대 10만 건 상한 후 오래된 것부터 파일 삭제.
 * SHORTS_STORAGE_PATH 환경변수 또는 backend/data/shorts 사용.
 */
import { mkdir, copyFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_SUBDIR = "shorts";

function getStorageRoot(): string {
  const root = (process.env.SHORTS_STORAGE_PATH ?? "").trim();
  if (root) return root;
  const fromCwd = join(process.cwd(), "data", DEFAULT_SUBDIR);
  return fromCwd;
}

/** jobId별 디렉터리 경로 */
export function getJobDir(jobId: string): string {
  return join(getStorageRoot(), jobId.replace(/[^a-zA-Z0-9-_]/g, "_"));
}

/** 저장된 최종 mp4 경로 */
export function getVideoPath(jobId: string): string {
  return join(getJobDir(jobId), "final.mp4");
}

/** 보관 만료일: createdAt + retentionDays (업로드됨 7일, 미업로드 10일 등) */
export function getExpiresAt(createdAt: string, retentionDays: number = 30): string {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + retentionDays);
  return d.toISOString();
}

/** 업로드된 영상 보관 일수 (7일) */
export const RETENTION_DAYS_UPLOADED = 7;
/** 미업로드(video_ready) 영상 보관 일수 (10일) */
export const RETENTION_DAYS_VIDEO_READY = 10;

/** 만료 여부 */
export function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

/**
 * 소스 mp4를 저장 경로로 복사. 디렉터리 생성 후 복사.
 * @param retentionDays 업로드됨(done) 7일, 미업로드(video_ready) 10일 권장
 * @returns 저장된 경로와 만료일
 */
export async function copyVideoToStorage(
  jobId: string,
  sourcePath: string,
  createdAt: string,
  retentionDays: number = RETENTION_DAYS_VIDEO_READY
): Promise<{ videoPath: string; expiresAt: string }> {
  const dir = getJobDir(jobId);
  const destPath = getVideoPath(jobId);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await copyFile(sourcePath, destPath);
  const expiresAt = getExpiresAt(createdAt, retentionDays);
  return { videoPath: destPath, expiresAt };
}

/**
 * 해당 job의 저장 영상 파일(및 디렉터리) 삭제. 체크리스트용 job 메타는 호출측에서 유지.
 */
export async function deleteVideoFile(jobId: string): Promise<void> {
  const dir = getJobDir(jobId);
  if (!existsSync(dir)) return;
  await rm(dir, { recursive: true, force: true });
}
