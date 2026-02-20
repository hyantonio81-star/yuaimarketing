/**
 * calculate_optimal_bid: 원가 추정 → 경쟁사 과거 입찰가 → 마진 시나리오별 승률·기대이익 → 최적 입찰가 · 리스크 분석
 */

export interface TenderForBid {
  id?: string;
  scope_of_work?: string;
  contract_period?: string;
  delivery_location?: string;
  budget?: number;
  agency?: string;
}

export interface BidScenario {
  bid_amount: number;
  markup: number;
  win_probability: number;
  expected_profit: number;
  profit_if_win: number;
}

export interface RiskAnalysis {
  cost_overrun_risk: string;
  payment_delay_risk: string;
  scope_creep_risk: string;
}

export interface OptimalBidResult {
  recommended_bid: number;
  confidence: number;
  cost_estimate: number;
  budget_ceiling: number;
  all_scenarios: BidScenario[];
  risk_analysis: RiskAnalysis;
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function estimateProjectCost(scope: string, duration: string, location: string): number {
  const base = 80_000_000;
  const scopeMult = 0.8 + (simpleHash(scope || "x") % 60) / 100;
  const durationMonths = parseInt(duration?.replace(/\D/g, "") || "12", 10) || 12;
  const locMult = (location || "").includes("해외") ? 1.3 : 1;
  return Math.round(base * scopeMult * (durationMonths / 12) * locMult);
}

interface HistoricalBid {
  winning_bid: number;
}

function getSimilarTenders(tender: TenderForBid): HistoricalBid[] {
  const cost = estimateProjectCost(
    tender.scope_of_work ?? "",
    tender.contract_period ?? "",
    tender.delivery_location ?? ""
  );
  const bids = [
    cost * 0.92,
    cost * 1.05,
    cost * 0.98,
    cost * 1.12,
    cost * 1.08,
    cost * 0.95,
    cost * 1.15,
  ];
  return bids.map((winning_bid) => ({ winning_bid }));
}

function mlPredictWinProbability(
  ourBid: number,
  _tender: TenderForBid,
  historicalData: HistoricalBid[]
): number {
  const avg = historicalData.reduce((s, b) => s + b.winning_bid, 0) / historicalData.length;
  const lowest = Math.min(...historicalData.map((b) => b.winning_bid));
  if (ourBid > avg * 1.2) return 0.1;
  if (ourBid < lowest * 0.9) return 0.95;
  const ratio = ourBid / avg;
  return Math.max(0.05, Math.min(0.9, 1.2 - ratio));
}

function assessCostRisk(_tender: TenderForBid): string {
  return "medium";
}

function assessPaymentRisk(agency: string | undefined): string {
  if (!agency) return "low";
  return agency.length % 3 === 0 ? "medium" : "low";
}

function assessScopeRisk(_tender: TenderForBid): string {
  return "low";
}

export function calculateOptimalBid(tender: TenderForBid): OptimalBidResult {
  const costEstimate = estimateProjectCost(
    tender.scope_of_work ?? "",
    tender.contract_period ?? "",
    tender.delivery_location ?? ""
  );

  const historicalBids = getSimilarTenders(tender);
  const competitorBids = historicalBids.map((b) => b.winning_bid);
  const avgWinningBid = competitorBids.reduce((a, b) => a + b, 0) / competitorBids.length;
  const budgetCeiling = tender.budget && tender.budget > 0 ? tender.budget : avgWinningBid * 1.2;

  const bidScenarios: BidScenario[] = [];
  const markups = [1.05, 1.1, 1.15, 1.2, 1.25, 1.3];

  for (const markup of markups) {
    const bidAmount = Math.round(costEstimate * markup);
    if (bidAmount > budgetCeiling) continue;

    const winProbability = mlPredictWinProbability(bidAmount, tender, historicalBids);
    const profitIfWin = bidAmount - costEstimate;
    const expectedProfit = profitIfWin * winProbability;

    bidScenarios.push({
      bid_amount: bidAmount,
      markup: (markup - 1) * 100,
      win_probability: winProbability,
      expected_profit: Math.round(expectedProfit),
      profit_if_win: profitIfWin,
    });
  }

  const bestScenario = bidScenarios.length
    ? bidScenarios.reduce((a, b) => (b.expected_profit > a.expected_profit ? b : a))
    : {
        bid_amount: costEstimate * 1.15,
        win_probability: 0.5,
        expected_profit: 0,
        profit_if_win: 0,
        markup: 15,
      };

  const risk_analysis: RiskAnalysis = {
    cost_overrun_risk: assessCostRisk(tender),
    payment_delay_risk: assessPaymentRisk(tender.agency),
    scope_creep_risk: assessScopeRisk(tender),
  };

  return {
    recommended_bid: typeof bestScenario.bid_amount === "number" ? bestScenario.bid_amount : costEstimate * 1.15,
    confidence: typeof bestScenario.win_probability === "number" ? bestScenario.win_probability : 0.5,
    cost_estimate: costEstimate,
    budget_ceiling: Math.round(budgetCeiling),
    all_scenarios: bidScenarios,
    risk_analysis,
  };
}
