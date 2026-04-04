/**
 * Shorts 영상 저장: 업로드 완료 또는 video_ready 영상을 지정 경로에 보관.
 * - 업로드된 영상(done): 7일 보관 후 파일 삭제, 체크리스트(job 기록) 유지.
 * - 미업로드(video_ready): 10일 보관, 최대 10만 건 상한 후 오래된 것부터 파일 삭제.
 * SHORTS_STORAGE_PATH 환경변수 또는 backend/data/shorts 사용.
 */
import { mkdir, rm, readFile, writeFile } from "node:fs/promises";
import { existsSync, createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { basename, join } from "node:path";
import { getSupabaseAdmin } from "../lib/supabaseServer.js";
import { getLocalDataDir } from "../lib/localDataDir.js";
import { SHORTS_STUB_VIDEO_BYTES } from "./shorts/shortsEditAgent.js";

const DEFAULT_SUBDIR = "shorts";
const SUPABASE_BUCKET = "shorts-videos";

const safeJobSegment = (jobId: string) => jobId.replace(/[^a-zA-Z0-9-_]/g, "_");

/**
 * 조립용 중간 자산(mp3 등) 업로드 → 공개 URL (워커가 다운로드)
 */
export async function uploadAssemblyBuffer(
  jobId: string,
  relativePath: string,
  data: Buffer,
  contentType: string
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const key = `${safeJobSegment(jobId)}/assembly/${relativePath.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  try {
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(key, data, {
      contentType,
      upsert: true,
    });
    if (error) {
      console.error("[uploadAssemblyBuffer]", error.message);
      return null;
    }
    const { data: pub } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(key);
    return pub.publicUrl;
  } catch (e) {
    console.error("[uploadAssemblyBuffer]", e);
    return null;
  }
}

function getStorageRoot(): string {
  const root = (process.env.SHORTS_STORAGE_PATH ?? "").trim();
  if (root) return root;
  return join(getLocalDataDir(), DEFAULT_SUBDIR);
}

/** Supabase Storage에 파일 업로드 및 Public URL 반환 */
async function uploadToSupabase(jobId: string, filePath: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  try {
    const fileBuffer = await readFile(filePath);
    const fileName = `${jobId}/final.mp4`;

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (error) {
      console.error("[Supabase Storage Upload Error]:", error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (err) {
    console.error("[Supabase Storage error]:", err);
    return null;
  }
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
 * 소스 mp4를 저장 경로로 복사 및 Supabase 업로드.
 * @returns 저장된 로컬 경로, Supabase URL(있는 경우), 만료일
 */
export async function copyVideoToStorage(
  jobId: string,
  sourcePath: string,
  createdAt: string,
  retentionDays: number = RETENTION_DAYS_VIDEO_READY
): Promise<{ videoPath: string; supabaseUrl?: string; expiresAt: string }> {
  const dir = getJobDir(jobId);
  const destPath = getVideoPath(jobId);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  const isStubSource = basename(sourcePath) === "stub.mp4";

  async function writeMinimalStubAtDest(): Promise<void> {
    await rm(destPath, { force: true }).catch(() => {});
    await writeFile(destPath, Buffer.alloc(SHORTS_STUB_VIDEO_BYTES, 0));
  }

  /**
   * stub.mp4 는 2KB 수준 — copyFile/스트림 대신 read→write 또는 소스 없으면 곧바로 목적지 스텁.
   * (copyFile ENOENT 레이스·구버전 런타임 이슈 회피)
   */
  try {
    if (isStubSource) {
      if (existsSync(sourcePath)) {
        const buf = await readFile(sourcePath);
        await writeFile(destPath, buf);
      } else {
        console.warn("[copyVideoToStorage] stub source missing; writing minimal mp4 at", destPath);
        await writeMinimalStubAtDest();
      }
    } else {
      await pipeline(createReadStream(sourcePath), createWriteStream(destPath));
    }
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : "";
    console.warn("[copyVideoToStorage] copy failed:", sourcePath, "->", destPath, err);
    if (isStubSource || code === "ENOENT" || code === "ENOTDIR") {
      await writeMinimalStubAtDest();
    } else {
      throw err;
    }
  }

  // 백그라운드에서 Supabase Storage 업로드 시도
  const supabaseUrl = await uploadToSupabase(jobId, destPath).catch(() => null);

  const expiresAt = getExpiresAt(createdAt, retentionDays);
  return { 
    videoPath: destPath, 
    supabaseUrl: supabaseUrl || undefined, 
    expiresAt 
  };
}

/**
 * 해당 job의 저장 영상 파일(로컬 및 Supabase) 삭제.
 */
export async function deleteVideoFile(jobId: string): Promise<void> {
  // 로컬 삭제
  const dir = getJobDir(jobId);
  if (existsSync(dir)) {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }

  // Supabase 삭제
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const fileName = `${jobId}/final.mp4`;
    await supabase.storage.from(SUPABASE_BUCKET).remove([fileName]).catch(() => {});
  }
}
