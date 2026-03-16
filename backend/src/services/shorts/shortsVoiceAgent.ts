/**
 * Shorts 보이스 에이전트: 스크립트 장면별 TTS → 오디오 파일 경로
 */
import { generateAudioForScript } from "../shortsTtsService.js";
import type { ShortsScriptScene } from "./shortsTypes.js";
import type { SceneAudioResult } from "./shortsTypes.js";
import type { VoicePresetOption } from "./shortsTypes.js";

/** 장면별 텍스트 → TTS mp3 파일 경로 배열. voice 옵션 전달 시 TTS에 반영 */
export async function generateSceneAudios(
  scenes: ShortsScriptScene[],
  options?: { voice?: VoicePresetOption; lang?: string }
): Promise<SceneAudioResult[]> {
  return generateAudioForScript(scenes, { voice: options?.voice, lang: options?.lang });
}
