/**
 * Shorts용 이미지 생성: 아바타/캐릭터 일관 프롬프트 + 장면별 이미지
 * OPENAI_API_KEY 있으면 DALL·E 3 (또는 2) 호출, 없으면 플레이스홀더 URL
 */
import type { ShortsScript } from "./shortsAgentService.js";

const OPENAI_KEY = (process.env.OPENAI_API_KEY ?? "").trim();

export interface AvatarPreset {
  id: string;
  name: string;
  imagePromptHint: string;
  description?: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "shortsbot", name: "쇼츠봇", imagePromptHint: "minimal flat illustration, friendly character, pastel background", description: "미니멀 일러스트" },
  { id: "vtuber", name: "VTuber 스타일", imagePromptHint: "anime style vtuber avatar, soft lighting, clean background", description: "애니메이션 스타일" },
  { id: "3d", name: "3D 캐릭터", imagePromptHint: "3D render cute character, soft shadows, gradient background", description: "3D 렌더" },
  { id: "comic", name: "만화 캐릭터", imagePromptHint: "comic book style character, bold outlines, dynamic pose", description: "만화 스타일" },
];

/** 프리셋 ID로 캐릭터용 imagePromptHint 반환 */
export function getAvatarPromptHint(presetId?: string): string {
  if (!presetId) return AVATAR_PRESETS[0].imagePromptHint;
  const p = AVATAR_PRESETS.find((a) => a.id === presetId);
  return p?.imagePromptHint ?? AVATAR_PRESETS[0].imagePromptHint;
}

/**
 * 단일 이미지 생성: API 있으면 OpenAI, 없으면 placeholder
 * size: 1024x1792 (세로 Shorts 비율에 가깝게)
 */
export async function generateImage(prompt: string, _options?: { size?: string }): Promise<{ url: string; fromApi: boolean }> {
  if (!OPENAI_KEY) {
    const safe = encodeURIComponent(prompt.slice(0, 50));
    return { url: `https://placehold.co/1080x1920/1a1a2e/eee?text=${safe}`, fromApi: false };
  }
  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: OPENAI_KEY });
    const res = await client.images.generate({
      model: "dall-e-3",
      prompt: prompt.slice(0, 4000),
      n: 1,
      size: "1024x1792",
      quality: "standard",
      response_format: "url",
    });
    const url = res.data?.[0]?.url;
    if (url) return { url, fromApi: true };
  } catch {
    // fallback
  }
  const safe = encodeURIComponent(prompt.slice(0, 50));
  return { url: `https://placehold.co/1080x1920/1a1a2e/eee?text=${safe}`, fromApi: false };
}

/** 스크립트 전체에 대해 장면별 이미지 생성 (캐릭터 힌트로 일관성 유지) */
export async function generateImagesForScript(
  script: ShortsScript,
  avatarPresetId?: string
): Promise<{ sceneIndex: number; imageUrl: string; fromApi: boolean }[]> {
  const hint = getAvatarPromptHint(avatarPresetId) || script.character.imagePromptHint;
  const out: { sceneIndex: number; imageUrl: string; fromApi: boolean }[] = [];
  for (const scene of script.scenes) {
    const fullPrompt = `${hint}. Scene: ${scene.imagePrompt}`;
    const { url, fromApi } = await generateImage(fullPrompt);
    out.push({ sceneIndex: scene.sceneIndex, imageUrl: url, fromApi });
  }
  return out;
}
