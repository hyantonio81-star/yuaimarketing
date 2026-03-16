/**
 * 스레드용 '가볍고 친근한' 문구 생성 (Step 2). 문제 해결형 큐레이션.
 * GEMINI_API_KEY 있으면 Gemini 우선, 없으면 OpenAI. 로케일별 페르소나 지원.
 * Meta Community Standards 준수 지침 포함.
 */

import type { CommerceProduct, MarketplaceId } from "./types.js";
import { META_COMPLIANCE_SHORT } from "../../lib/metaContentPolicy.js";

export type ContentLanguageCode = "es-DO" | "es-MX" | "pt-BR" | "ko" | "en";
export type TargetCountryCode = "DO" | "MX" | "BR" | "KR" | "US" | "PA";

export interface CopyOptions {
  contentLanguage?: ContentLanguageCode;
  targetCountry?: TargetCountryCode;
  marketplace?: MarketplaceId;
}

const PERSONA_KO = `당신은 2030 자취생이 겪는 불편함을 해결해주는 꿀템을 소개하는 친구 같은 작성자입니다.
말투는 친구에게 말하듯 편하게, 이모지를 적절히 섞어서 300자 이내로 써주세요.
단순히 "이거 좋아요"가 아니라 "이 제품이 해결해주는 구체적인 불편함"을 강조해주세요.`;

const PERSONA_ES_DO = `Eres una influencer de moda dominicana en sus 20s que recomienda productos con estilo caribeño.
Usa expresiones como "¡Qué lo qué!", "Vaina", "Envío Gratis", "Exento de Impuestos" cuando aplique.
Tono cercano y casual, emojis moderados. Máximo 300 caracteres. Destaca por qué el producto le viene bien a tu audiencia.`;

const PERSONA_ES_MX = `Eres una influencer mexicana que recomienda productos con estilo cercano.
Menciona envío a México o ofertas locales cuando aplique. Tono casual, emojis moderados. Máximo 300 caracteres.`;

const PERSONA_PT_BR = `Você é uma influencer brasileira que recomenda produtos com linguagem informal.
Use "frete grátis", "promoção" quando fizer sentido. Tom casual, até 300 caracteres.`;

const PERSONA_EN = `You are a friendly curator who recommends useful products for young adults.
Keep tone casual and relatable, use emojis sparingly. Max 300 characters. Highlight the problem this product solves.`;

function getSystemInstruction(lang: ContentLanguageCode, country: TargetCountryCode): string {
  let persona: string;
  if (lang === "es-DO" || country === "DO") persona = PERSONA_ES_DO;
  else if (lang === "es-MX" || country === "MX") persona = PERSONA_ES_MX;
  else if (lang === "pt-BR" || country === "BR") persona = PERSONA_PT_BR;
  else if (lang === "en" || country === "US") persona = PERSONA_EN;
  else persona = PERSONA_KO;
  return `${persona}\n\n${META_COMPLIANCE_SHORT}`;
}

function getInfoPrompt(lang: ContentLanguageCode, marketplace: MarketplaceId): string {
  const platform = marketplace === "amazon" ? "Amazon" : marketplace === "shein" ? "Shein" : marketplace === "temu" ? "Temu" : "AliExpress";
  if (lang === "es-DO" || lang === "es-MX") {
    return `Escribe un tip útil sobre compras en ${platform} (envío, ofertas, cupones) en una línea, casual. Máximo 200 caracteres.`;
  }
  if (lang === "pt-BR") {
    return `Escreva uma dica útil sobre compras no ${platform} em uma linha, casual. Máximo 200 caracteres.`;
  }
  if (lang === "en") {
    return `Write a short useful tip about shopping on ${platform} (shipping, deals, coupons) in one line, casual. Max 200 chars.`;
  }
  return `${platform} 직구 팁이나 배송비 아끼는 법 같은 유용한 정보를 한 줄로 친근하게 써줘. 200자 이내.`;
}

export interface ThreadsCopyResult {
  text: string;
  contentType: "product" | "info";
  model?: string;
}

function productDesc(product: CommerceProduct): string {
  return `${product.title} (${product.category})${product.price != null ? ` - $${product.price}` : ""}${product.priceDropPercent != null ? ` 🔥 ${product.priceDropPercent}% 할인` : ""} [${product.marketplace}]`;
}

export async function generateThreadsCopy(
  product: CommerceProduct,
  contentType: "product" | "info" = "product",
  options: CopyOptions = {}
): Promise<ThreadsCopyResult> {
  const lang = options.contentLanguage ?? "ko";
  const country = options.targetCountry ?? "KR";
  const marketplace = options.marketplace ?? "amazon";
  const systemInstruction = getSystemInstruction(lang, country);
  const productDescStr = productDesc(product);

  const geminiKey = (process.env.GEMINI_API_KEY ?? "").trim();
  if (geminiKey) {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt =
        contentType === "info"
          ? getInfoPrompt(lang, marketplace)
          : `${systemInstruction}\n\n다음 상품을 스레드 포스팅용으로 소개해줘:\n${productDescStr}`;
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text?.()?.trim() ?? fallbackCopy(product, contentType, lang, marketplace);
      return { text: text.slice(0, 500), contentType, model: "gemini" };
    } catch {
      // fallback to OpenAI below
    }
  }

  const openaiKey = (process.env.OPENAI_API_KEY ?? "").trim();
  if (openaiKey) {
    try {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: openaiKey });
      const userPrompt =
        contentType === "info"
          ? getInfoPrompt(lang, marketplace)
          : `${systemInstruction}\n\nIntroduce this product for a Threads post:\n${productDescStr}`;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 400,
      });
      const text = completion.choices?.[0]?.message?.content?.trim() ?? fallbackCopy(product, contentType, lang, marketplace);
      return { text: text.slice(0, 500), contentType, model: "openai" };
    } catch {
      // fallback
    }
  }

  return { text: fallbackCopy(product, contentType, lang, marketplace), contentType };
}

function fallbackCopy(
  product: CommerceProduct,
  contentType: "product" | "info",
  lang: ContentLanguageCode = "ko",
  marketplace: MarketplaceId = "amazon"
): string {
  if (contentType === "info") {
    if (lang === "es-DO" || lang === "es-MX") return "💡 Envío gratis cuando juntas varias cosas en un solo pedido. ¡Aprovecha!";
    if (lang === "pt-BR") return "💡 Frete grátis em pedidos acima de um valor. Aproveita!";
    if (lang === "en") return "💡 Tip: bundle items for free shipping. Try it!";
    return "💡 아마존 직구할 때 배송비 아끼는 법: 여러 개 묶어서 한 번에 주문하거나, 프라임 체험 활용해보세요~";
  }
  if (lang === "es-DO" || lang === "es-MX") {
    return `¡Qué lo qué! Esta vaina está buena 😭 ${product.title} — Envío disponible. Link en la bio 🔗`;
  }
  if (lang === "pt-BR") {
    return `Esse produto é top 😭 ${product.title} — Frete grátis em alguns casos. Link na bio 🔗`;
  }
  if (lang === "en") {
    return `This one's a gem 😭 ${product.title} — ${product.category}. Link in bio for more~`;
  }
  return `이거 진짜 꿀템이에요 😭 ${product.title} — ${product.category}에서 인기많은데, 자취생한테 딱이에요. 더 궁금하면 댓글로요~`;
}
