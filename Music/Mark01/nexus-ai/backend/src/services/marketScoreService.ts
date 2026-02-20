/**
 * 시장성 점수 계산 (0-100)
 * Market Score: 시장 규모·성장률, 경쟁 강도, 진입 장벽, 수익성, 트렌드 모멘텀
 */

export interface ScoreBreakdown {
  category: string;
  maxPoints: number;
  score: number;
  detail?: string;
}

export interface MarketScoreResult {
  item: string;
  total: number;
  breakdown: ScoreBreakdown[];
  formula: string;
}

// Stub: TAM/SAM/SOM → 시장 규모 (USD)
function getTamSamSom(item: string): number {
  const hash = simpleHash(item);
  return 500_000_000 + (hash % 15) * 200_000_000; // 0.5B ~ 3.5B
}

// Stub: 5년 예상 CAGR (decimal, e.g. 0.08 = 8%)
function predictCagr5Years(item: string): number {
  const hash = simpleHash(item + "cagr");
  return 0.03 + (hash % 12) / 100; // 3% ~ 15%
}

// Stub: 주요 경쟁사 수
function countMajorPlayers(item: string): number {
  const hash = simpleHash(item + "comp");
  return 2 + (hash % 8); // 2 ~ 10
}

// Stub: 초기 투자 추정 (USD)
function estimateInitialInvestment(item: string): number {
  const hash = simpleHash(item + "cap");
  return 50_000 + (hash % 20) * 25_000; // 50k ~ 550k
}

// Stub: 규제 복잡도 (0~3)
function checkRegulatoryComplexity(item: string): number {
  const hash = simpleHash(item + "reg");
  return hash % 4; // 0, 1, 2, 3
}

// Stub: 업종 평균 마진 (decimal, e.g. 0.2 = 20%)
function calculateIndustryMargin(item: string): number {
  const hash = simpleHash(item + "margin");
  return 0.08 + (hash % 25) / 100; // 8% ~ 32%
}

// Stub: Google 트렌드 모멘텀 (0~1)
function googleTrendsMomentum(item: string): number {
  const hash = simpleHash(item + "trend");
  return 0.3 + (hash % 70) / 100; // 0.3 ~ 1.0
}

// Stub: 소셜 미디어 성장 (0~1)
function socialMediaGrowth(item: string): number {
  const hash = simpleHash(item + "social");
  return 0.2 + (hash % 80) / 100; // 0.2 ~ 1.0
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * 시장성 점수 계산 (0-100)
 */
export function marketScore(item: string): MarketScoreResult {
  const trimItem = (item || "default").trim() || "default";

  // 1. 시장 규모 & 성장률 (25점)
  const marketSize = getTamSamSom(trimItem);
  const growthRate = predictCagr5Years(trimItem);
  const sizeScore = Math.min((marketSize / 1_000_000_000) * 15, 15);
  const growthScore = Math.min(growthRate * 100, 10);

  // 2. 경쟁 강도 (20점, 낮을수록 좋음)
  const competitors = countMajorPlayers(trimItem);
  const competitionScore = Math.max(20 - competitors * 2, 0);

  // 3. 진입 장벽 (15점, 낮을수록 좋음)
  const capitalReq = estimateInitialInvestment(trimItem);
  const regulation = checkRegulatoryComplexity(trimItem);
  let barrierScore =
    15 - (capitalReq / 100_000) * 5 - regulation * 5;
  barrierScore = Math.max(0, Math.min(15, barrierScore));

  // 4. 수익성 (25점)
  const avgMargin = calculateIndustryMargin(trimItem);
  const marginScore = Math.min(avgMargin * 100, 25);

  // 5. 트렌드 모멘텀 (15점)
  const searchTrend = googleTrendsMomentum(trimItem);
  const socialBuzz = socialMediaGrowth(trimItem);
  const momentumScore = ((searchTrend + socialBuzz) / 2) * 15;

  const total = Math.min(
    sizeScore + growthScore + competitionScore + barrierScore + marginScore + momentumScore,
    100
  );

  const breakdown: ScoreBreakdown[] = [
    {
      category: "시장 규모 & 성장률",
      maxPoints: 25,
      score: Math.round((sizeScore + growthScore) * 10) / 10,
      detail: `TAM ${(marketSize / 1e9).toFixed(2)}B, CAGR ${(growthRate * 100).toFixed(1)}%`,
    },
    {
      category: "경쟁 강도 (낮을수록 좋음)",
      maxPoints: 20,
      score: Math.round(competitionScore * 10) / 10,
      detail: `주요 경쟁사 ${competitors}개`,
    },
    {
      category: "진입 장벽 (낮을수록 좋음)",
      maxPoints: 15,
      score: Math.round(barrierScore * 10) / 10,
      detail: `초기투자 약 $${(capitalReq / 1000).toFixed(0)}k, 규제수준 ${regulation}`,
    },
    {
      category: "수익성",
      maxPoints: 25,
      score: Math.round(marginScore * 10) / 10,
      detail: `업종 마진 약 ${(avgMargin * 100).toFixed(1)}%`,
    },
    {
      category: "트렌드 모멘텀",
      maxPoints: 15,
      score: Math.round(momentumScore * 10) / 10,
      detail: `검색·소셜 트렌드 ${((searchTrend + socialBuzz) / 2 * 100).toFixed(0)}%`,
    },
  ];

  return {
    item: trimItem,
    total: Math.round(total * 10) / 10,
    breakdown,
    formula:
      "size_score(15) + growth_score(10) + competition(20) + barrier(15) + margin(25) + momentum(15) = 100",
  };
}
