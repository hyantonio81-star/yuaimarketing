export interface SeoTool {
  name: string;
  description: string;
}

export interface AutoAnalysisItem {
  label: string;
  sub: string;
}

export interface AiGenerationItem {
  label: string;
}

const TOOLS: SeoTool[] = [
  { name: "Ahrefs API", description: "키워드 난이도, 검색량" },
  { name: "SEMrush API", description: "경쟁사 키워드" },
  { name: "Google Search Console", description: "자체 성과" },
  { name: "Answer The Public", description: "롱테일 질문" },
];

const AUTO_ANALYSIS: AutoAnalysisItem[] = [
  { label: "공백 키워드 발견", sub: "경쟁 낮음 + 검색량 높음" },
  { label: "콘텐츠 기회", sub: "상위 노출 가능 주제" },
  { label: "백링크 기회", sub: "링크 가능 사이트" },
  { label: "계절성 트렌드 예측", sub: "시즌별 트렌드" },
];

const AI_GENERATION: AiGenerationItem[] = [
  { label: "SEO 최적화 콘텐츠 아웃라인" },
  { label: "메타 태그 자동 생성" },
  { label: "인포그래픽 주제 제안" },
];

export function getTools(): SeoTool[] {
  return TOOLS;
}

export function getAutoAnalysis(): AutoAnalysisItem[] {
  return AUTO_ANALYSIS;
}

export function getAiGeneration(): AiGenerationItem[] {
  return AI_GENERATION;
}
