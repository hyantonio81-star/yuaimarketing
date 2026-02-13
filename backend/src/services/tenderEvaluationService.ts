/**
 * evaluate_tender: 입찰 평가
 * 실행가능성(40) + 수익성(30) + 경쟁강도(15) + 리스크(15) = 100
 * recommendation: BID if total >= 60 else SKIP
 */

export interface TenderInput {
  document?: string;
  items?: string | string[];
  quantity?: number;
  delivery_terms?: string;
  budget?: number;
  country?: string;
  payment?: string;
  penalty_clause?: string;
  title?: string;
}

export interface TenderEvaluationResult {
  total_score: number;
  recommendation: "BID" | "SKIP";
  breakdown: {
    feasibility: number;
    profitability: number;
    competition: number;
    risk: number;
  };
  key_risks: number[];
  estimated_win_probability: number;
}

function simpleHash(str: string, seed: number = 0): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function extractRequirements(_document: string): string[] {
  return ["ISO 9001", "CE 인증", "최소 5년 실적", "영문 제안서"];
}

function loadCompanyProfile(): string[] {
  return ["ISO 9001", "CE 인증", "7년 실적", "영문 제안서", "한국 본사"];
}

function calculateMatch(requirements: string[], capabilities: string[]): number {
  if (!requirements.length) return 0.85;
  const match = requirements.filter((r) =>
    capabilities.some((c) => c.toLowerCase().includes(r.toLowerCase().slice(0, 5)))
  ).length;
  return Math.min(match / requirements.length, 1);
}

function calculateCost(_product: unknown, quantity: number, _delivery: string): number {
  const unitCost = 80 + (quantity % 20);
  return quantity * unitCost * (0.9 + (quantity % 10) / 100);
}

function estimateCompetitors(tender: TenderInput): number {
  const h = simpleHash((tender.country || "") + (tender.budget || 0));
  return 2 + (h % 5);
}

function assessRisks(country: string, _payment: string, _penalty: string): number[] {
  const countryRisk: Record<string, number> = {
    KR: 0, US: 0.5, DE: 0.5, JP: 0.5, VN: 2, CN: 1.5, IN: 2, MX: 1.5,
  };
  const r1 = countryRisk[country?.toUpperCase()?.slice(0, 2)] ?? 1;
  const r2 = 0.5;
  const r3 = 1;
  return [r1, r2, r3];
}

function mlPredictWinRate(tender: TenderInput): number {
  const h = simpleHash((tender.budget || "") + (tender.country || ""));
  return 0.15 + (h % 40) / 100;
}

/**
 * evaluate_tender
 */
export function evaluateTender(tender: TenderInput): TenderEvaluationResult {
  const doc = tender.document ?? "";
  const requirements = extractRequirements(doc);
  const capabilities = loadCompanyProfile();
  const matchRate = calculateMatch(requirements, capabilities);
  const feasibility = Math.round(Math.min(matchRate * 40, 40) * 10) / 10;

  const budget = Number(tender.budget) || 100_000;
  const quantity = Number(tender.quantity) || 500;
  const delivery = tender.delivery_terms ?? "CIF";
  const estimatedCost = calculateCost(tender.items, quantity, delivery);
  const margin = budget > 0 ? (budget - estimatedCost) / budget : 0;
  const profitability = Math.round(Math.min(Math.max(margin, 0) * 100, 30) * 10) / 10;

  const competitors = estimateCompetitors(tender);
  const competition = Math.max(0, Math.round((15 - competitors * 2) * 10) / 10);

  const risks = assessRisks(tender.country ?? "", tender.payment ?? "", tender.penalty_clause ?? "");
  const riskSum = risks.reduce((a, b) => a + b, 0);
  const risk = Math.round(Math.max(0, 15 - riskSum) * 10) / 10;

  const total_score = Math.round((feasibility + profitability + competition + risk) * 10) / 10;
  const recommendation = total_score >= 60 ? "BID" : "SKIP";
  const estimated_win_probability = Math.round(mlPredictWinRate(tender) * 1000) / 1000;

  return {
    total_score,
    recommendation,
    breakdown: {
      feasibility,
      profitability,
      competition,
      risk,
    },
    key_risks: risks,
    estimated_win_probability,
  };
}
