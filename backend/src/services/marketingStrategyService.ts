/**
 * Module 1.2: AI 마케팅 전략 플래너 (10%)
 * Agent: Campaign Strategy Architect
 */

export interface StrategyInput {
  product: string;
  target: "B2B" | "B2C";
  budget: string;
  goal: "awareness" | "lead" | "revenue";
}

export interface StrategyOutput {
  product: string;
  target: string;
  budget: string;
  goal: string;
  summary: string;
  channels: { name: string; allocation: string; tactics: string[] }[];
  timeline: string;
  kpis: string[];
}

const GOAL_LABELS: Record<string, string> = {
  awareness: "인지도",
  lead: "리드 확보",
  revenue: "매출",
};

export function generateMarketingStrategy(input: StrategyInput): StrategyOutput {
  const product = (input?.product || "제품/서비스").trim() || "제품/서비스";
  const target = input?.target || "B2B";
  const budget = input?.budget || "미정";
  const goal = input?.goal || "lead";
  const goalLabel = GOAL_LABELS[goal] || goal;

  const isB2B = target === "B2B";
  const channels = isB2B
    ? [
        { name: "LinkedIn", allocation: "35%", tactics: ["스폰서드 콘텐츠", "InMail 캠페인", "리드 폼 광고"] },
        { name: "Google Search / Display", allocation: "30%", tactics: ["키워드 광고", "리타겟팅", "YouTube"] },
        { name: "이벤트 / 웨비나", allocation: "20%", tactics: ["온라인 세미나", "백서 다운로드", "데모 예약"] },
        { name: "이메일 / 마케팅 자동화", allocation: "15%", tactics: ["뉴스레터", "드립 시퀀스", "스코어링"] },
      ]
    : [
        { name: "Meta (FB/IG)", allocation: "40%", tactics: ["피드 광고", "스토리", "리타겟팅"] },
        { name: "Google / YouTube", allocation: "25%", tactics: ["검색 광고", "TrueView", "퍼포먼스 맥스"] },
        { name: "카카오 / 네이버", allocation: "25%", tactics: ["검색·디스플레이", "채널톡", "스마트플레이스"] },
        { name: "인플루언서 / UGC", allocation: "10%", tactics: ["마이크로 인플루언서", "UGC 캠페인"] },
      ];

  const summary =
    goal === "awareness"
      ? `"${product}"의 브랜드 인지도 확대를 위한 캠페인. 타겟 ${target}, 예산 ${budget}. 채널별 비중에 따라 단계적 노출을 확대합니다.`
      : goal === "revenue"
        ? `"${product}"의 매출 전환 중심 전략. ${target} 고객 대상 유료 채널 비중 확대, 전환 퍼널 최적화.`
        : `"${product}"의 리드 확보가 목표. ${target} 타겟, 예산 ${budget}. ${goalLabel} 중심 KPI로 설계되었습니다.`;

  const timeline =
    goal === "awareness"
      ? "1~2단계: 4주 인지도 캠페인 → 3단계: 4주 참여·리드 수집"
      : "1~4주: 트래픽·리드 확보 → 5~8주: 전환 최적화 → 9~12주: 스케일업";

  const kpis =
    goal === "awareness"
      ? ["도달률", "노출당 비용(CPM)", "브랜드 설문 인지도"]
      : goal === "revenue"
        ? ["CPA", "ROAS", "매출 기여도"]
        : ["CPL", "리드 수", "SQL 전환율"];

  return {
    product,
    target,
    budget,
    goal: goalLabel,
    summary,
    channels,
    timeline,
    kpis,
  };
}
