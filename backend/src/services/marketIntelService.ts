export interface DataSource {
  name: string;
  description: string;
}

export interface AnalysisTech {
  name: string;
  description: string;
}

export interface ResultOutput {
  id: string;
  title: string;
  period: string;
}

const SOURCES: DataSource[] = [
  { name: "Reddit API", description: "실시간 소비자 대화" },
  { name: "Twitter/X API", description: "브랜드 멘션" },
  { name: "Amazon Reviews", description: "제품 리뷰" },
  { name: "YouTube Comments", description: "영상 반응" },
  { name: "App Store/Play Store", description: "앱 리뷰" },
  { name: "Quora", description: "Q&A 패턴" },
];

const ANALYSIS: AnalysisTech[] = [
  { name: "GPT-4", description: "감정 분석, 테마 추출" },
  { name: "BERT", description: "토픽 모델링" },
  { name: "Custom NLP", description: "니즈 패턴 인식" },
];

const RESULTS: ResultOutput[] = [
  { id: "needs", title: "소비자 니즈 Top 10", period: "주간" },
  { id: "complaints", title: "불만 포인트 분석", period: "이슈별 집계" },
  { id: "intent", title: "구매 의도 신호 감지", period: "실시간" },
];

export function getSources(): DataSource[] {
  return SOURCES;
}

export function getAnalysisTech(): AnalysisTech[] {
  return ANALYSIS;
}

export function getResultOutputs(): ResultOutput[] {
  return RESULTS;
}
