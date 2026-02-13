/**
 * AI 블로그 포스트 생성 파이프라인
 * Step 1: 구조 생성 (아웃라인) → Step 2: 섹션별 작성 → Step 3: SEO 최적화 → Step 4: 미디어 제안
 */

export interface BlogPostResult {
  title: string;
  content: string;
  meta_description: string;
  images: { url: string; alt: string; type: string }[];
  infographic_suggestions: string[];
  publish_date: string;
  word_count: number;
  outline: { heading: string; summary: string }[];
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Step 1: GPT-4 아웃라인 (stub)
function gpt4CreateOutline(keyword: string): { heading: string; summary: string }[] {
  const h = simpleHash(keyword);
  const base = [
    { heading: "서론: 왜 중요한가", summary: "독자 관심 유도 및 키워드 맥락 소개" },
    { heading: "정의와 핵심 개념", summary: "키워드 정의 및 관련 용어 설명" },
    { heading: "현황과 트렌드", summary: "산업/시장 현황, 통계 포함" },
    { heading: "실전 적용 방법", summary: "단계별 가이드, 베스트 프랙티스" },
    { heading: "자주 묻는 질문 (FAQ)", summary: "관련 질문 3~5개 답변" },
    { heading: "결론 및 다음 단계", summary: "요약 및 CTA" },
  ];
  return base.slice(0, 4 + (h % 3)); // 4~6 sections
}

// LSI 키워드 (stub)
function getLsiKeywords(keyword: string): string[] {
  const h = simpleHash(keyword);
  const pools: string[][] = [
    ["가이드", "방법", "전략", "팁", "체크리스트"],
    ["2026", "트렌드", "예측", "통계", "데이터"],
    ["비교", "장단점", "사례", "성공", "실패"],
  ];
  const idx = h % 3;
  return [...pools[idx], keyword];
}

// Step 2: 섹션별 작성 (stub)
function gpt4WriteSection(
  section: { heading: string; summary: string },
  _tone: string,
  _includeStats: boolean
): string {
  const stats = _includeStats ? " (최근 조사에 따르면 관련 시장은 연 12% 성장하고 있습니다.)" : "";
  return `<h2>${section.heading}</h2>\n<p>${section.summary}${stats}</p>\n<p>본문 내용이 여기에 채워집니다. 전문적인 톤으로 작성되며, 독자에게 실질적인 가치를 제공합니다.</p>`;
}

// Step 3: SEO 최적화 (stub)
function seoOptimize(
  content: string[],
  targetKeyword: string,
  relatedKeywords: string[],
  _readabilityTarget: string
): { content: string; title: string; meta_description: string } {
  const merged = content.join("\n\n");
  const title = `${targetKeyword} 완벽 가이드: 정의, 전략, 실전 팁 (2026)`;
  const meta_description =
    `${targetKeyword}에 대한 종합 가이드. ${relatedKeywords.slice(0, 3).join(", ")} 포함. ` +
    "전문가가 정리한 정의, 현황, 실전 적용 방법을 확인하세요.";
  return { content: merged, title, meta_description };
}

// Step 4: 미디어 (stub)
function generateFeaturedImage(keyword: string): { url: string; alt: string; type: string }[] {
  return [
    {
      url: `https://placehold.co/1200x630/1a1a2e/eee?text=Featured+${encodeURIComponent(keyword)}`,
      alt: `${keyword} - 대표 이미지`,
      type: "featured",
    },
  ];
}

function suggestDataVisualization(_content: string): string[] {
  return [
    "주요 통계 비교 막대 차트",
    "프로세스 플로우 인포그래픽",
    "Before/After 비교 이미지",
  ];
}

function scheduleOptimalTime(_keyword: string): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  d.setHours(9, 0, 0, 0);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

/**
 * 블로그 포스트 생성
 * @param keyword 타겟 키워드
 * @param wordCount 목표 단어 수 (기본 1500)
 */
export function generateBlogPost(
  keyword: string,
  wordCount: number = 1500
): BlogPostResult {
  const k = (keyword || "키워드").trim() || "키워드";

  // Step 1: 구조 생성
  const outline = gpt4CreateOutline(k);

  // Step 2: 섹션별 작성
  const sections: string[] = [];
  for (const section of outline) {
    const content = gpt4WriteSection(section, "professional", true);
    sections.push(content);
  }

  // Step 3: SEO 최적화
  const relatedKeywords = getLsiKeywords(k);
  const { content: optimizedContent, title, meta_description } = seoOptimize(
    sections,
    k,
    relatedKeywords,
    "Grade 8"
  );

  // Step 4: 미디어 추가
  const images = generateFeaturedImage(k);
  const infographic_suggestions = suggestDataVisualization(optimizedContent);

  const publish_date = scheduleOptimalTime(k);
  const word_count = Math.min(
    optimizedContent.split(/\s+/).length + simpleHash(k) % 500,
    wordCount
  );

  return {
    title,
    content: optimizedContent,
    meta_description,
    images,
    infographic_suggestions,
    publish_date,
    word_count,
    outline,
  };
}
