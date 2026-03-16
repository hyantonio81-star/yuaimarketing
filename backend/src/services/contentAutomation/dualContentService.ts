/**
 * Gemini 1.5 Flash 이중 출력: 도미니카 현지인용 SNS 문구 + AdSense 대비 블로그 상세 리뷰.
 * 전문성·독창성·구조화(H1/H2/표) 반영. SNS 출력은 Meta Community Standards 준수.
 */

import type { CommerceProduct } from "../threadsCommerce/types.js";
import type { DualContentResult, DualContentOptions, ContentLanguageCode, TargetCountryCode } from "./types.js";
import { META_COMPLIANCE_SHORT } from "../../lib/metaContentPolicy.js";

const SNS_PERSONA_ES_DO = `Eres una influencer de moda dominicana en sus 20s que recomienda productos con estilo caribeño.
Usa expresiones como "¡Qué lo qué!", "Vaina", "Nítido", "Envío Gratis", "Exento de Impuestos" cuando aplique.
Si el producto es de Shein (o similar), enfatiza el beneficio de envío sin impuestos hasta $200 USD para RD.
Tono cercano y casual, emojis moderados. Máximo 300 caracteres. Incluye al final "[BLOG_LINK]" como placeholder para el enlace del blog.`;

const BLOG_SYSTEM_ES_DO = `Eres un redactor de reseñas para un blog orientado a República Dominicana. Objetivo: contenido que pueda ser aprobado por Google AdSense.

REGLAS OBLIGATORIAS:
1. Experticia: Incluye información concreta local (ej: clima dominicano, ventilación en días calurosos, envío a RD, aduanas, envío gratis a Santo Santiago). Si es Shein o tienda similar, menciona el beneficio de $200 USD sin impuestos para RD.
2. Originalidad: Crea una introducción y una conclusión ÚNICAS para este artículo. No uses plantillas repetidas.
3. Estructura: Usa exactamente un H1 (título del artículo), después varios H2 para secciones (ej: "¿Por qué conviene en RD?", "Especificaciones", "Conclusión"). Incluye una tabla o lista con especificaciones/precio cuando tenga sentido.
4. Estilo: Mezcla un tono personal (experiencia propia o de alguien en RD) con datos útiles. Usa expresiones como "Nítido" si encaja. Añade un tip corto de envío o compra en Dominicana al final.
5. Longitud: 400-700 palabras. Formato HTML (usa <h1>, <h2>, <p>, <ul>, <table>).
6. NO repitas la misma frase de inicio en todos los artículos. NO uses imágenes de baja calidad o con watermark (no incluyas etiquetas img en el texto; las imágenes se insertarán aparte).`;

const BLOG_SYSTEM_KO = `당신은 블로그 리뷰 작성자입니다. Google AdSense 승인을 염두에 둔 콘텐츠를 씁니다.

필수: 전문성(구체적 정보), 독창성(이 글만의 서론·결론), 구조화(H1, H2, 표/리스트). 400-700단어, HTML. 개인 경험담 스타일을 섞고, 이미지 태그는 넣지 마세요.`;

function productDesc(product: CommerceProduct | { title: string; category: string; price?: number; priceDropPercent?: number; marketplace?: string }): string {
  return `${product.title} (${product.category})${product.price != null ? ` - $${product.price}` : ""}${product.priceDropPercent != null ? ` - ${product.priceDropPercent}% descuento` : ""} [${(product as { marketplace?: string }).marketplace ?? "product"}]`;
}

function getSnsPersona(lang: ContentLanguageCode, country: TargetCountryCode): string {
  if (lang === "es-DO" || lang === "es-MX" || country === "DO" || country === "MX") return SNS_PERSONA_ES_DO;
  return `Write a short SNS promo (max 300 chars), casual tone. End with "[BLOG_LINK]" as placeholder for blog link.`;
}

function getBlogSystem(lang: ContentLanguageCode, country: TargetCountryCode): string {
  if (lang === "es-DO" || country === "DO") return BLOG_SYSTEM_ES_DO;
  if (lang === "es-MX" || country === "MX") return BLOG_SYSTEM_ES_DO.replace("República Dominicana", "México").replace("Dominicana", "México").replace("Santo Santiago", "CDMX");
  return BLOG_SYSTEM_KO;
}

export async function generateDualContent(
  product: CommerceProduct | { id: string; title: string; url: string; imageUrl: string; category: string; price?: number; priceDropPercent?: number; marketplace?: string; collectedAt?: string },
  options: DualContentOptions = {}
): Promise<DualContentResult> {
  const lang = options.contentLanguage ?? "es-DO";
  const country = options.targetCountry ?? "DO";
  const productStr = productDesc(product);
  const geminiKey = (process.env.GEMINI_API_KEY ?? "").trim();

  const snsCopyPromise = (async (): Promise<string> => {
    if (!geminiKey) return fallbackSns(product, lang);
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const persona = getSnsPersona(lang, country);
      const result = await model.generateContent(`${persona}\n\n${META_COMPLIANCE_SHORT}\n\nProducto:\n${productStr}\n\nGenera el texto SNS en un solo párrafo, terminando con [BLOG_LINK].`);
      const text = result.response.text?.()?.trim() ?? fallbackSns(product, lang);
      return text.slice(0, 500);
    } catch {
      return fallbackSns(product, lang);
    }
  })();

  const blogPromise = (async (): Promise<{ body: string; title?: string }> => {
    if (!geminiKey) return { body: fallbackBlog(product, lang), title: product.title };
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const system = getBlogSystem(lang, country);
      const result = await model.generateContent(`${system}\n\nEscribe la reseña en HTML para este producto:\n${productStr}`);
      const text = result.response.text?.()?.trim() ?? fallbackBlog(product, lang);
      const titleMatch = text.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      return { body: text.slice(0, 15000), title: titleMatch ? titleMatch[1].trim() : product.title };
    } catch {
      return { body: fallbackBlog(product, lang), title: product.title };
    }
  })();

  const [snsCopy, blog] = await Promise.all([snsCopyPromise, blogPromise]);
  const blogLink = options.blogUrlPlaceholder ?? "[BLOG_LINK]";
  const snsFinal = snsCopy.replace("[BLOG_LINK]", blogLink).trim();

  return {
    snsCopy: snsFinal,
    blogReview: blog.body,
    blogTitle: blog.title,
    model: geminiKey ? "gemini" : undefined,
  };
}

function fallbackSns(product: { title: string; category: string }, _lang: string): string {
  return `¡Qué lo qué! Esta vaina está buena 😭 ${product.title} — ${product.category}. Envío disponible. Más en el blog 🔗 [BLOG_LINK]`;
}

function fallbackBlog(product: { title: string; category: string }, _lang: string): string {
  return `<h1>${product.title}</h1><p>Reseña útil para República Dominicana: ${product.category}. Incluye datos locales de envío y consejos.</p><h2>Especificaciones</h2><p>Revisa el enlace del producto para detalles actualizados.</p>`;
}
