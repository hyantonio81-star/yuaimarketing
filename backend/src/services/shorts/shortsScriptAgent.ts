import { getAvatarPromptHint } from "../shortsImageService.js";
import type { ShortsScript, ShortsScriptScene, ShortsCharacter, TrendTopic, ShortsFormat } from "./shortsTypes.js";
import { getPromoShortlist } from "../threadsCommerce/threadsCommerceService.js";

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

/** 
 * 시맨틱 제휴 상품 매칭: 뉴스 키워드와 상품 키워드 대조 (단순 구현)
 */
async function matchAffiliateItem(topic: TrendTopic, category: string): Promise<ShortsScript["affiliateItem"] | undefined> {
  try {
    const marketplace = "amazon"; // 기본값
    const { shortlist } = await getPromoShortlist(marketplace, { limit: 10, min_score: 50 });
    
    // 1. 키워드 매칭 (제목이나 요약에 상품 키워드 포함 여부)
    const topicText = (topic.title + " " + topic.summary).toLowerCase();
    const matched = shortlist.find(p => {
      const pTitle = p.title.toLowerCase();
      const pCat = (p.category || "").toLowerCase();
      return topicText.includes(pTitle.slice(0, 10)) || topicText.includes(pCat);
    });

    if (matched) {
      return {
        id: matched.id,
        name: matched.title.slice(0, 20),
        linkUrl: (matched as any).url || "https://yuanto.com/shop",
        displayTimingSeconds: 7, 
      };
    }

    // 2. 카테고리 기반 폴백
    if (category === "lifestyle" || category === "health") {
      return {
        id: "aff-001",
        name: "추천 건강/생활 템",
        linkUrl: "https://yuanto.com/shop/lifestyle",
        displayTimingSeconds: 7,
      };
    } else if (category === "k-culture") {
      return {
        id: "aff-kpop",
        name: "K-POP 공식 굿즈",
        linkUrl: "https://yuanto.com/shop/kpop",
        displayTimingSeconds: 7,
      };
    } else if (category === "silver") {
      return {
        id: "aff-silver",
        name: "실버 케어 필수템",
        linkUrl: "https://yuanto.com/shop/silver-care",
        displayTimingSeconds: 7,
      };
    }
  } catch {
    // ignore match errors
  }
  return undefined;
}

/** 주제 1개 + 옵션 → 훅·장면 N개·캐릭터 힌트 (Generative AI 버전) */
export async function generateScriptForTopic(topic: TrendTopic, avatarPresetId?: string, scriptOptions?: ScriptOptions): Promise<ShortsScript> {
  const opts = scriptOptions ?? {};
  const presetId = opts.avatarPresetId ?? avatarPresetId;
  let imagePromptHint = getAvatarPromptHint(presetId) || defaultAvatarHint();
  const ageHint = opts.characterAge ? `, ${opts.characterAge} appearance` : "";
  const genderHint = opts.characterGender ? `, ${opts.characterGender}` : "";
  if (ageHint || genderHint) imagePromptHint = `${imagePromptHint}${genderHint}${ageHint}`;

  const targetLang = opts.languageOverride || "ko";
  const category = opts.category || "general";
  const format = opts.format ?? "shorts";
  const targetSec = opts.targetDurationSeconds ?? (format === "long" ? 90 : 9);

  // 캐릭터 설정
  let tone = "친근한 반말";
  let characterName = "쇼츠봇";
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

  // AI를 통한 스토리텔링 생성 시도
  const geminiKey = (process.env.GEMINI_API_KEY ?? "").trim();
  const openaiKey = (process.env.OPENAI_API_KEY ?? "").trim();
  
  let aiScript: { hook: string; scenes: { text: string; visual: string }[] } | null = null;

  const systemPrompt = `You are a viral vertical video creator. Create a script based on the news topic.
Format: JSON only.
Structure: { "hook": "short catchy hook", "scenes": [{ "text": "spoken text", "visual": "visual description for image gen" }] }
Language: ${targetLang === "ko" ? "Korean" : targetLang === "es" ? "Spanish" : "English"}.
Tone: ${tone}.
Target Duration: ${targetSec} seconds.
Constraints: Max 3 scenes for shorts, 6 scenes for long. Each scene text should be 1-2 short sentences.`;

  const userPrompt = `Topic Title: ${topic.title}\nSummary: ${topic.summary}`;

  if (geminiKey) {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
      const text = result.response.text();
      const cleaned = text.replace(/```json|```/g, "").trim();
      aiScript = JSON.parse(cleaned);
    } catch (e) {
      console.error("[Script AI Error] Gemini failed", e);
    }
  } else if (openaiKey && !aiScript) {
    try {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: openaiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        response_format: { type: "json_object" }
      });
      aiScript = JSON.parse(completion.choices[0].message.content || "");
    } catch (e) {
      console.error("[Script AI Error] OpenAI failed", e);
    }
  }

  // 제휴 아이템 매칭
  const affiliateItem = await matchAffiliateItem(topic, category);

  // AI 결과가 있으면 변환, 없으면 기존 슬라이싱 로직(fallback)
  if (aiScript && aiScript.scenes?.length > 0) {
    const scenes: ShortsScriptScene[] = aiScript.scenes.map((s, i) => ({
      sceneIndex: i + 1,
      text: s.text,
      imagePrompt: `${character.imagePromptHint}, ${s.visual}`,
      durationSeconds: Math.floor(targetSec / (aiScript!.scenes.length + (affiliateItem ? 1 : 0)))
    }));

    // 제휴 아이템이 있으면 전용 스포트라이트 장면 추가
    if (affiliateItem) {
      scenes.push({
        sceneIndex: scenes.length + 1,
        text: `오늘의 추천템: ${affiliateItem.name}! 자세한 정보는 링크를 확인하세요.`,
        imagePrompt: `${character.imagePromptHint}, product spotlight for ${affiliateItem.name}`,
        durationSeconds: 3
      });
    }

    return {
      topicId: topic.id,
      topicTitle: topic.title,
      hook: aiScript.hook,
      character,
      scenes,
      totalDurationSeconds: scenes.reduce((s, sc) => s + sc.durationSeconds, 0),
      affiliateItem
    };
  }

  // --- 기존 슬라이싱 로직 (Fallback) ---
  let intro = "";
  if (opts.sourceLanguage === "es" && targetLang === "ko") intro = "[중남미 현지 소식] ";
  else if (opts.category === "k-culture" && targetLang === "es") intro = "[Desde Corea] ";
  else if (opts.category === "silver") intro = targetLang === "ko" ? "[글로벌 실버 케어] " : "[Silver Care Global] ";

  const hook = `${intro}${topic.title.slice(0, 30)}${topic.title.length > 30 ? "…" : ""}!`;
  
  let scenes: ShortsScriptScene[] = [
    { sceneIndex: 1, text: hook, imagePrompt: `${character.imagePromptHint}, text: "${hook.slice(0, 20)}"`, durationSeconds: 3 },
    { sceneIndex: 2, text: topic.summary.slice(0, 80), imagePrompt: `${character.imagePromptHint}, topic summary`, durationSeconds: 4 },
  ];

  if (affiliateItem) {
    scenes.push({
      sceneIndex: 3,
      text: `오늘의 추천: ${affiliateItem.name}! 링크에서 만나보세요.`,
      imagePrompt: `${character.imagePromptHint}, product spotlight`,
      durationSeconds: 3
    });
  } else {
    scenes.push({
      sceneIndex: 3,
      text: targetLang === "es" ? "¡Mira el link para más!" : "더 자세한 내용은 링크에서 확인해 주세요.",
      imagePrompt: `${character.imagePromptHint}, CTA`,
      durationSeconds: 2
    });
  }

  return {
    topicId: topic.id,
    topicTitle: topic.title,
    hook,
    character,
    scenes,
    totalDurationSeconds: scenes.reduce((s, sc) => s + sc.durationSeconds, 0),
    affiliateItem
  };
}
