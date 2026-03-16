/**
 * Shorts 비주얼 에이전트: 캐릭터 1인 제작 + 장면별 이미지
 * 1) 아바타 힌트로 기준 캐릭터 이미지 1장 생성 (썸네일/1장면 활용)
 * 2) 동일 힌트로 장면별 이미지 생성
 */
import { generateImage, getAvatarPromptHint, generateImagesForScript } from "../shortsImageService.js";
import type { ShortsScript } from "./shortsTypes.js";
import type { SceneImageResult } from "./shortsTypes.js";

export interface VisualAgentResult {
  characterImageUrl: string | null;
  sceneImages: SceneImageResult[];
}

/**
 * 캐릭터 1장 + 장면별 이미지 생성
 */
export async function generateVisualAssets(
  script: ShortsScript,
  avatarPresetId?: string
): Promise<VisualAgentResult> {
  const hint = getAvatarPromptHint(avatarPresetId) || script.character.imagePromptHint;

  // 1) 캐릭터 1인 제작: 기준 이미지 1장
  const characterPrompt = `${hint}, full body character reference, simple background, consistent style`;
  const { url: characterImageUrl } = await generateImage(characterPrompt);

  // 2) 장면별 이미지 (기존 서비스 활용)
  const sceneResults = await generateImagesForScript(script, avatarPresetId);
  const sceneImages: SceneImageResult[] = sceneResults.map((r) => ({
    sceneIndex: r.sceneIndex,
    imageUrl: r.imageUrl,
  }));

  return {
    characterImageUrl: characterImageUrl || null,
    sceneImages,
  };
}
