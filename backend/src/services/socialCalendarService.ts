/**
 * 소셜 캘린더 생성 (generate_social_calendar)
 * 템플릿: educational 30%, promotional 20%, engagement 25%, ugc_reshare 15%, behind_scenes 10%
 * 플랫폼별 글·해시태그·스케줄·CTA 생성 → CSV/시트 출력용
 */

export interface SocialPost {
  day: number;
  template: string;
  platform: string;
  text: string;
  hashtags: string[];
  image: string;
  schedule: string;
  cta: string;
}

const TEMPLATES = [
  { name: "educational", weight: 30 },
  { name: "promotional", weight: 20 },
  { name: "engagement", weight: 25 },
  { name: "ugc_reshare", weight: 15 },
  { name: "behind_scenes", weight: 10 },
];

const PLATFORMS = ["LinkedIn", "Twitter", "Facebook"];

const PLATFORM_LIMITS: Record<string, number> = {
  LinkedIn: 3000,
  Twitter: 280,
  Facebook: 63206,
};

function simpleHash(str: string, seed: number = 0): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function weightedRandom(product: string, day: number): string {
  const h = simpleHash(product + day);
  const roll = h % 100;
  let acc = 0;
  for (const t of TEMPLATES) {
    acc += t.weight;
    if (roll < acc) return t.name;
  }
  return TEMPLATES[0].name;
}

function gpt4GeneratePost(product: string, template: string, platform: string, maxChars: number): string {
  const snippets: Record<string, string> = {
    educational: `${product}에 대해 알아두면 좋은 3가지. 1) 기본 개념 2) 실무 적용 3) 사례 공유. 자세한 내용은 링크에서.`,
    promotional: `지금 ${product} 특별 오퍼 진행 중. 한정 수량, 먼저 경험해 보세요.`,
    engagement: `${product}를 사용해 보셨나요? 어떤 점이 좋았는지 댓글로 공유해 주세요.`,
    ugc_reshare: `고객님의 ${product} 후기를 공유합니다. "실제로 도움이 많이 됐어요" — 더 많은 스토리를 만나보세요.`,
    behind_scenes: `오늘은 ${product} 팀의 일상 한 컷. 어떤 작업을 하고 있을까요?`,
  };
  let text = snippets[template] || snippets.educational;
  if (text.length > maxChars) text = text.slice(0, maxChars - 3) + "...";
  return text;
}

function trendingHashtags(product: string, limit: number): string[] {
  const h = simpleHash(product);
  const pool = [
    "#B2B", "#마케팅", "#성장", "#SaaS", "#스타트업",
    "#리드젠", "#콘텐츠", "#브랜딩", "#트렌드", "#인사이트",
  ];
  const out: string[] = [];
  for (let i = 0; i < limit; i++) {
    out.push(pool[(h + i) % pool.length]);
  }
  return out;
}

function generateOrSuggestVisual(template: string, day: number): string {
  const types: Record<string, string> = {
    educational: "인포그래픽 또는 차트 제안",
    promotional: "프로모션 배너 이미지 생성",
    engagement: "질문 카드 또는 투표 이미지",
    ugc_reshare: "UGC 스크린샷 또는 인용 카드",
    behind_scenes: "팀/오피스 사진 또는 쇼츠",
  };
  return types[template] || `Day ${day} 시각 자산 제안`;
}

function optimalPostingTime(platform: string, _audience: string): string {
  const times: Record<string, string> = {
    LinkedIn: "09:00 KST (화~목)",
    Twitter: "12:00, 18:00 KST",
    Facebook: "19:00 KST",
  };
  return times[platform] || "09:00 KST";
}

function generateCta(template: string): string {
  const ctas: Record<string, string> = {
    educational: "블로그에서 더 읽기",
    promotional: "지금 할인 받기",
    engagement: "댓글에 의견 남기기",
    ugc_reshare: "나만의 스토리 공유하기",
    behind_scenes: "팔로우하고 소식 받기",
  };
  return ctas[template] || "자세히 보기";
}

/**
 * 소셜 캘린더 생성
 * @param product 제품/브랜드명
 * @param days 생성할 일수 (기본 90)
 */
export function generateSocialCalendar(product: string, days: number = 90): SocialPost[] {
  const p = (product || "제품").trim() || "제품";
  const totalDays = Math.min(Math.max(1, days), 365);
  const posts: SocialPost[] = [];

  for (let day = 1; day <= totalDays; day++) {
    const template = weightedRandom(p, day);
    const platform = PLATFORMS[simpleHash(p + "platform" + day) % PLATFORMS.length];
    const maxChars = PLATFORM_LIMITS[platform] ?? 280;

    const post: SocialPost = {
      day,
      template,
      platform,
      text: gpt4GeneratePost(p, template, platform, maxChars),
      hashtags: trendingHashtags(p + day, 5),
      image: generateOrSuggestVisual(template, day),
      schedule: optimalPostingTime(platform, "default"),
      cta: generateCta(template),
    };
    posts.push(post);
  }

  return posts;
}
