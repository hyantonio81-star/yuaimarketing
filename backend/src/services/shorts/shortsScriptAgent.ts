/**
 * Shorts 스크립트/캐릭터 에이전트: 주제 1개 → 대본·캐릭터 설계
 * format·targetDuration에 따라 장면 수·길이 조절 (shorts 3장면, long 6~8장면)
 */
import { getAvatarPromptHint } from "../shortsImageService.js";
import type { ShortsScript, ShortsScriptScene, ShortsCharacter, TrendTopic, ShortsFormat } from "./shortsTypes.js";

function defaultAvatarHint(): string {
  return getAvatarPromptHint("shortsbot");
}

export interface ScriptOptions {
  avatarPresetId?: string;
  format?: ShortsFormat;
  targetDurationSeconds?: number;
  characterAge?: "child" | "young" | "adult" | "mature";
  characterGender?: "female" | "male" | "neutral";
  /** 타겟 언어 (문화 교류용) */
  languageOverride?: string;
  /** 카테고리 (분야별 컨텍스트용) */
  category?: string;
  /** 원본 뉴스 언어 */
  sourceLanguage?: string;
}

/** 주제 1개 + 옵션 → 훅·장면 N개·캐릭터 힌트 (문화 교류 및 분야별 최적화) */
export function generateScriptForTopic(topic: TrendTopic, avatarPresetId?: string, scriptOptions?: ScriptOptions): ShortsScript {
  const opts = scriptOptions ?? {};
  const presetId = opts.avatarPresetId ?? avatarPresetId;
  let imagePromptHint = getAvatarPromptHint(presetId) || defaultAvatarHint();
  const ageHint = opts.characterAge ? `, ${opts.characterAge} appearance` : "";
  const genderHint = opts.characterGender ? `, ${opts.characterGender}` : "";
  if (ageHint || genderHint) imagePromptHint = `${imagePromptHint}${genderHint}${ageHint}`;

  // 언어 및 분야별 캐릭터 톤 조정
  let tone = "친근한 반말";
  let characterName = "쇼츠봇";
  const targetLang = opts.languageOverride || "ko";
  const category = opts.category || "general";

  if (targetLang === "es") {
    tone = "Informal y amable";
    characterName = "ShortsBot";
  } else if (targetLang === "en") {
    tone = "Friendly and casual";
    characterName = "ShortsBot";
  }

  const character: ShortsCharacter = {
    name: characterName,
    description: `${category} 분야 전문 AI 큐레이터`,
    tone,
    imagePromptHint,
  };

  // 문화 교류 컨텍스트 생성
  let intro = "";
  if (opts.sourceLanguage === "es" && targetLang === "ko") {
    intro = "[중남미 현지 소식] ";
  } else if (opts.category === "k-culture" && targetLang === "es") {
    intro = "[Desde Corea] ";
  }

  const hook = `${intro}${topic.title.slice(0, 30)}${topic.title.length > 30 ? "…" : ""}!`;
  const format = opts.format ?? "shorts";
  const targetSec = opts.targetDurationSeconds ?? (format === "long" ? 90 : 9);

  // 제휴 아이템 (카테고리별 매핑 - 추후 DB 연동 가능)
  let affiliateItem: ShortsScript["affiliateItem"];
  if (category === "lifestyle" || category === "health") {
    affiliateItem = {
      id: "aff-001",
      name: "추천 건강/생활 템",
      linkUrl: "https://yuanto.com/shop/lifestyle",
      displayTimingSeconds: targetSec - 3,
    };
  } else if (category === "k-culture") {
    affiliateItem = {
      id: "aff-kpop",
      name: "K-POP 공식 굿즈",
      linkUrl: "https://yuanto.com/shop/kpop",
      displayTimingSeconds: targetSec - 3,
    };
  }

  let scenes: ShortsScriptScene[];
  // ... (기존 장면 생성 로직 유지하되, 텍스트에 언어적 특성 반영 가능)
  // 현재는 단순 슬라이싱이므로, 실제 서비스에서는 AI API 호출 시 languageOverride를 프롬프트에 넣어야 함.
  if (format === "long" && targetSec >= 60) {
    const numScenes = Math.min(8, Math.max(6, Math.floor(targetSec / 15)));
    const perScene = Math.floor(targetSec / numScenes);
    const summaryChunk = Math.ceil(topic.summary.length / (numScenes - 2));
    scenes = [
      { sceneIndex: 1, text: hook, imagePrompt: `${character.imagePromptHint}, text: "${hook.slice(0, 20)}"`, durationSeconds: Math.min(5, perScene) },
      ...Array.from({ length: numScenes - 2 }, (_, i) => {
        const start = i * summaryChunk;
        const text = topic.summary.slice(start, start + summaryChunk) || topic.summary.slice(0, 60);
        return {
          sceneIndex: i + 2,
          text: text || "자세한 내용을 알려드려요.",
          imagePrompt: `${character.imagePromptHint}, topic part ${i + 1}`,
          durationSeconds: perScene,
        } as ShortsScriptScene;
      }),
      {
        sceneIndex: numScenes,
        text: "더 자세한 내용은 링크에서 확인해 주세요.",
        imagePrompt: `${character.imagePromptHint}, CTA`,
        durationSeconds: Math.min(5, perScene),
      },
    ];
  } else if (format === "shorts" && targetSec >= 15 && targetSec <= 45) {
    const numScenes = Math.min(5, Math.max(4, Math.floor(targetSec / 5)));
    const perScene = Math.floor(targetSec / numScenes);
    const summaryChunk = Math.ceil(topic.summary.length / (numScenes - 2));
    scenes = [
      { sceneIndex: 1, text: hook, imagePrompt: `${character.imagePromptHint}, text: "${hook.slice(0, 20)}"`, durationSeconds: Math.min(perScene + 1, 6) },
      ...Array.from({ length: numScenes - 2 }, (_, i) => {
        const start = i * summaryChunk;
        const text = topic.summary.slice(start, start + summaryChunk) || topic.summary.slice(0, 80);
        return {
          sceneIndex: i + 2,
          text: text || "자세한 내용을 알려드려요.",
          imagePrompt: `${character.imagePromptHint}, topic part ${i + 1}`,
          durationSeconds: perScene,
        } as ShortsScriptScene;
      }),
      {
        sceneIndex: numScenes,
        text: "더 자세한 내용은 링크에서 확인해 주세요.",
        imagePrompt: `${character.imagePromptHint}, CTA`,
        durationSeconds: Math.min(perScene, 5),
      },
    ];
  } else {
    scenes = [
      { sceneIndex: 1, text: hook, imagePrompt: `${character.imagePromptHint}, text: "${hook.slice(0, 20)}"`, durationSeconds: 3 },
      { sceneIndex: 2, text: topic.summary.slice(0, 80), imagePrompt: `${character.imagePromptHint}, topic summary`, durationSeconds: 4 },
      { sceneIndex: 3, text: "더 자세한 내용은 링크에서 확인해 주세요.", imagePrompt: `${character.imagePromptHint}, CTA`, durationSeconds: 2 },
    ];
  }

  return {
    topicId: topic.id,
    topicTitle: topic.title,
    hook,
    character,
    scenes,
    totalDurationSeconds: scenes.reduce((s, sc) => s + sc.durationSeconds, 0),
  };
}
