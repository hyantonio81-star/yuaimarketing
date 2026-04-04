/**
 * FFmpeg 실행 파일 경로: PATH의 `ffmpeg` 또는 환경 변수 FFMPEG_PATH (절대 경로 권장).
 * @see https://www.ffmpeg.org/download.html
 */
import type { ExecOptions } from "node:child_process";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

export function resolveFfmpegExecutable(): string {
  const fromEnv = (process.env.FFMPEG_PATH ?? "").trim().replace(/^["']|["']$/g, "");
  if (fromEnv) {
    if (existsSync(fromEnv)) return fromEnv;
    return fromEnv;
  }
  return "ffmpeg";
}

export function isFfmpegAvailable(): boolean {
  const exe = resolveFfmpegExecutable();
  try {
    const r = spawnSync(exe, ["-version"], { stdio: "ignore" });
    return r.status === 0;
  } catch {
    return false;
  }
}

/**
 * shell exec 문자열 앞에 붙일 접두사 (공백·괄호 경로는 따옴표).
 */
export function ffmpegShellPrefix(): string {
  const exe = resolveFfmpegExecutable();
  if (exe === "ffmpeg") return "ffmpeg";
  const escaped = exe.replace(/"/g, '\\"');
  return escaped.includes(" ") || escaped.includes("(") ? `"${escaped}"` : escaped;
}

/** execAsync 공통 옵션: Windows에서 전체 경로 실행 시 shell 필요 */
export function ffmpegExecOptions(base?: { timeout?: number }): ExecOptions {
  return {
    shell: true,
    ...(base?.timeout != null ? { timeout: base.timeout } : {}),
  } as unknown as ExecOptions;
}
