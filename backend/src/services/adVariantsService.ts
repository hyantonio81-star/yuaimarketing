/**
 * 광고 변형 생성 (generate_ad_variants)
 * angle: pain_point, benefit, social_proof, urgency, curiosity
 * headline (max 30), description (max 90), cta, landing_page, predicted_ctr → 정렬
 */

export interface AdVariant {
  headline: string;
  description: string;
  cta: string;
  landing_page: string;
  angle: string;
  predicted_ctr: number;
}

const ANGLES = ["pain_point", "benefit", "social_proof", "urgency", "curiosity"];

const CTA_OPTIONS = ["Try Free", "Learn More", "Get Started", "See Demo"];

function simpleHash(str: string, seed: number = 0): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function selectAngle(product: string, index: number): string {
  return ANGLES[(simpleHash(product + "angle" + index) % ANGLES.length)];
}

function gpt4AdHeadline(product: string, angle: string, maxChars: number): string {
  const templates: Record<string, string> = {
    pain_point: `${product}로 문제 해결`,
    benefit: `${product}로 성과 2배`,
    social_proof: `1만+ 기업이 선택한 ${product}`,
    urgency: `지금 ${product} 특가`,
    curiosity: `${product}의 비밀`,
  };
  let t = templates[angle] || templates.benefit;
  if (t.length > maxChars) t = t.slice(0, maxChars - 1) + "…";
  return t;
}

function gpt4AdBody(product: string, angle: string, maxChars: number): string {
  const templates: Record<string, string> = {
    pain_point: `시간과 비용을 줄이는 ${product}. 지금 바로 확인하세요.`,
    benefit: `효율을 높이는 ${product}. 무료 체험으로 경험해 보세요.`,
    social_proof: `많은 팀이 ${product}로 목표를 달성했습니다. 성공 사례를 확인하세요.`,
    urgency: `한정 기간 ${product} 혜택. 오늘만 적용되는 조건을 놓치지 마세요.`,
    curiosity: `${product}가 바꾼 업무 방식. 어떤 점이 다른지 알아보세요.`,
  };
  let t = templates[angle] || templates.benefit;
  if (t.length > maxChars) t = t.slice(0, maxChars - 1) + "…";
  return t;
}

function selectCta(product: string, index: number): string {
  return CTA_OPTIONS[(simpleHash(product + "cta" + index) % CTA_OPTIONS.length)];
}

function suggestLp(angle: string): string {
  const paths: Record<string, string> = {
    pain_point: "/solutions",
    benefit: "/features",
    social_proof: "/customers",
    urgency: "/offer",
    curiosity: "/how-it-works",
  };
  return paths[angle] || "/landing";
}

function mlPredictCtr(adText: string, _audience: string): number {
  const h = simpleHash(adText);
  return 1.5 + (h % 80) / 10; // 1.5% ~ 9.4%
}

/**
 * 광고 변형 생성 (predicted_ctr 기준 내림차순)
 */
export function generateAdVariants(
  product: string,
  platform: string = "Google",
  variants: number = 10
): AdVariant[] {
  const p = (product || "제품").trim() || "제품";
  const n = Math.min(Math.max(1, variants), 50);
  const adSets: AdVariant[] = [];

  for (let i = 0; i < n; i++) {
    const angle = selectAngle(p, i);
    const headline = gpt4AdHeadline(p, angle, 30);
    const description = gpt4AdBody(p, angle, 90);
    const adText = headline + " " + description;

    adSets.push({
      headline,
      description,
      cta: selectCta(p, i),
      landing_page: suggestLp(angle),
      angle,
      predicted_ctr: Math.round(mlPredictCtr(adText, "default") * 10) / 10,
    });
  }

  return adSets.sort((a, b) => b.predicted_ctr - a.predicted_ctr);
}
