/**
 * Shorts TTS: 스크립트 장면별 텍스트 → 음성 파일
 * google-tts-api 사용 (무료). voice 옵션은 추후 ElevenLabs 등 연동 시 사용.
 */
import type { ShortsScriptScene } from "./shorts/shortsTypes.js";
import type { VoicePresetOption } from "./shorts/shortsTypes.js";
import { mkdtemp, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const LANG = "ko";

/**
 * 텍스트를 TTS로 변환해 임시 파일로 저장하고 경로 반환
 * options.voice: 추후 외부 TTS 연동 시 사용 (현재 google-tts-api는 단일 보이스)
 */
export async function synthesizeToFile(
  text: string,
  options?: { lang?: string; sceneIndex?: number; voice?: VoicePresetOption }
): Promise<string | null> {
  const lang = options?.lang ?? LANG;
  const safeText = (text || "").trim().slice(0, 500);
  if (!safeText) return null;
  try {
    const gtts = await import("google-tts-api").catch(() => null);
    const getAudioUrl = (gtts as { getAudioUrl?: (text: string, opts: { lang: string; slow: boolean }) => string })?.getAudioUrl;
    if (!getAudioUrl) return null;
    const slow = (options?.voice?.voiceSpeed ?? 1) < 0.95;
    const url = getAudioUrl(safeText, { lang, slow });
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
 * 스크립트 전체 장면에 대해 TTS 생성. voice 옵션 전달 가능.
 */
export async function generateAudioForScript(
  scenes: ShortsScriptScene[],
  options?: { lang?: string; voice?: VoicePresetOption }
): Promise<{ sceneIndex: number; audioPath: string | null }[]> {
  const results: { sceneIndex: number; audioPath: string | null }[] = [];
  for (const scene of scenes) {
    const path = await synthesizeToFile(scene.text, {
      lang: options?.lang ?? LANG,
      sceneIndex: scene.sceneIndex,
      voice: options?.voice,
    });
    results.push({ sceneIndex: scene.sceneIndex, audioPath: path });
  }
  return results;
}
