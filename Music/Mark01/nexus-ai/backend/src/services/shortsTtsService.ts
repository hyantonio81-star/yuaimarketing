/**
 * Shorts TTS: 스크립트 장면별 텍스트 → 음성 파일
 * google-tts-api 사용 (무료, API 키 불필요). 장문은 분할 후 합침.
 */
import type { ShortsScriptScene } from "./shortsAgentService.js";
import { mkdtemp, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const LANG = "ko";

/**
 * 텍스트를 TTS로 변환해 임시 파일로 저장하고 경로 반환
 */
export async function synthesizeToFile(text: string, options?: { lang?: string; sceneIndex?: number }): Promise<string | null> {
  const lang = options?.lang ?? LANG;
  const safeText = (text || "").trim().slice(0, 500);
  if (!safeText) return null;
  try {
    const gtts = await import("google-tts-api").catch(() => null);
    const getAudioUrl = (gtts as { getAudioUrl?: (text: string, opts: { lang: string; slow: boolean }) => string })?.getAudioUrl;
    if (!getAudioUrl) return null;
    const url = getAudioUrl(safeText, { lang, slow: false });
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const dir = await mkdtemp(join(tmpdir(), "shorts-tts-"));
    const name = `scene_${options?.sceneIndex ?? 0}.mp3`;
    const path = join(dir, name);
    await writeFile(path, buf);
    return path;
  } catch {
    return null;
  }
}

/**
 * 스크립트 전체 장면에 대해 TTS 생성 → 장면별 오디오 파일 경로 배열 (순서대로)
 */
export async function generateAudioForScript(scenes: ShortsScriptScene[]): Promise<{ sceneIndex: number; audioPath: string | null }[]> {
  const results: { sceneIndex: number; audioPath: string | null }[] = [];
  for (const scene of scenes) {
    const path = await synthesizeToFile(scene.text, { lang: LANG, sceneIndex: scene.sceneIndex });
    results.push({ sceneIndex: scene.sceneIndex, audioPath: path });
  }
  return results;
}
