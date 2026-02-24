/**
 * plan_promotion: AI 기반 프로모션 전략 수립
 * 시나리오: 할인율 변화(5~30%), BOGO, 번들 → 목표별 최적 선택 → 실행 계획(일정, 카피, 채널, 예산)
 */

export type PromotionGoal = "revenue" | "profit" | "clearance";

export interface ProductForPromo {
  sku: string;
  name?: string;
  base_price?: number;
}

export interface PromotionScenario {
  type: "percentage_off" | "bogo" | "bundle";
  value?: number | string;
  bundled_with?: string[];
  bundle_discount?: number;
  duration_days: number;
  projected_revenue: number;
  projected_profit: number;
  projected_units_sold: number;
  optimal_start_date: string;
  optimal_end_date: string;
}

export interface ExecutionPlan {
  start_date: string;
  end_date: string;
  messaging: string;
  channels: string[];
  budget: number;
}

export interface PromotionPlanResult {
  recommendation: PromotionScenario;
  all_scenarios: PromotionScenario[];
  execution_plan: ExecutionPlan;
  goal: PromotionGoal;
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function simulatePromotion(
  product: ProductForPromo,
  type: "percentage_off" | "bogo" | "bundle",
  opts: {
    value?: number | string;
    bundled_with?: string[];
    bundle_discount?: number;
    duration_days: number;
  }
): PromotionScenario {
  const basePrice = product.base_price ?? 15000;
  const seed = simpleHash(product.sku + type + JSON.stringify(opts));
  let projectedRevenue = 0;
  let projectedUnits = 0;

  if (type === "percentage_off") {
    const discount = typeof opts.value === "number" ? opts.value : 10;
    const salePrice = basePrice * (1 - discount / 100);
    projectedUnits = 50 + (seed % 150) + Math.round((30 - discount) * 2);
    projectedRevenue = salePrice * projectedUnits;
  } else if (type === "bogo") {
    projectedUnits = 80 + (seed % 120);
    projectedRevenue = basePrice * projectedUnits * 0.75;
  } else {
    const extra = (opts.bundled_with?.length ?? 1) * (opts.bundle_discount ?? 15);
    projectedUnits = 40 + (seed % 80);
    projectedRevenue = basePrice * projectedUnits * (1 - (opts.bundle_discount ?? 15) / 100) * 1.5;
  }

  const costPerUnit = basePrice * 0.6;
  const projectedProfit = projectedRevenue - costPerUnit * projectedUnits;
  const start = addDays(new Date(), 1);
  const end = addDays(start, opts.duration_days);

  return {
    type,
    value: opts.value,
    bundled_with: opts.bundled_with,
    bundle_discount: opts.bundle_discount,
    duration_days: opts.duration_days,
    projected_revenue: Math.round(projectedRevenue),
    projected_profit: Math.round(projectedProfit),
    projected_units_sold: projectedUnits,
    optimal_start_date: formatDate(start),
    optimal_end_date: formatDate(end),
  };
}

function findComplementary(product: ProductForPromo): string[] {
  const skus = ["SKU-ACC-01", "SKU-ACC-02", "SKU-KIT-B"];
  return skus.slice(0, 2 + (simpleHash(product.sku) % 2));
}

function generatePromoCopy(scenario: PromotionScenario): string {
  if (scenario.type === "percentage_off")
    return `${scenario.value}% 할인 — ${scenario.duration_days}일 한정. 지금 구매하세요.`;
  if (scenario.type === "bogo")
    return "1+1 이벤트 — 두 번째 상품 50% 할인. 한정 수량.";
  if (scenario.type === "bundle")
    return `번들 할인 ${scenario.bundle_discount}%. 함께 구매하면 더 저렴합니다.`;
  return "기간 한정 프로모션.";
}

function selectPromoChannels(_product: ProductForPromo): string[] {
  return ["이메일", "SNS", "메인 배너", "채널 푸시"];
}

function estimatePromoCost(scenario: PromotionScenario): number {
  const base = 500000;
  const perUnit = scenario.projected_units_sold * 2000;
  return Math.round(base + perUnit * 0.1);
}

/** @param _orgId scope for future org-specific campaigns */
export function planPromotion(product: ProductForPromo, goal: PromotionGoal = "revenue", _orgId?: string, _countryCode?: string): PromotionPlanResult {
  const scenarios: PromotionScenario[] = [];

  for (const discount of [5, 10, 15, 20, 25, 30]) {
    scenarios.push(
      simulatePromotion(product, "percentage_off", { value: discount, duration_days: 7 })
    );
  }

  scenarios.push(
    simulatePromotion(product, "bogo", { value: "50% off second item", duration_days: 7 })
  );

  const complementary = findComplementary(product);
  scenarios.push(
    simulatePromotion(product, "bundle", {
      bundled_with: complementary.slice(0, 2),
      bundle_discount: 15,
      duration_days: 7,
    })
  );

  let best: PromotionScenario;
  if (goal === "revenue") {
    best = scenarios.reduce((a, b) => (b.projected_revenue > a.projected_revenue ? b : a));
  } else if (goal === "profit") {
    best = scenarios.reduce((a, b) => (b.projected_profit > a.projected_profit ? b : a));
  } else {
    best = scenarios.reduce((a, b) => (b.projected_units_sold > a.projected_units_sold ? b : a));
  }

  const execution_plan: ExecutionPlan = {
    start_date: best.optimal_start_date,
    end_date: best.optimal_end_date,
    messaging: generatePromoCopy(best),
    channels: selectPromoChannels(product),
    budget: estimatePromoCost(best),
  };

  return {
    recommendation: best,
    all_scenarios: scenarios,
    execution_plan,
    goal,
  };
}
