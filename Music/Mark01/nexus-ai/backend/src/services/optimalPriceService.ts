/**
 * calculate_optimal_price: 동적 가격 최적화
 * 경쟁사 가격, 수요 탄력성, 재고 수준, 시간 요인 → ML 예측 → 제약 적용 → (3% 이상 시) 가격 업데이트
 */

export interface ProductInput {
  sku: string;
  cost: number;
  target_margin: number;
  current_price: number;
}

export interface OptimalPriceResult {
  recommended_price: number;
  expected_sales: number;
  expected_revenue: number;
  expected_profit: number;
  price_updated: boolean;
  factors: {
    base_cost: number;
    target_margin: number;
    avg_competitor_price: number;
    demand_elasticity: number;
    inventory_ratio: number;
    time_factors: { day_of_week: number; hour: number; season: string; days_to_event: number };
    min_price: number;
    max_price: number;
  };
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getCompetitors(_product: ProductInput, channel: string): Array<{ url: string }> {
  const count = 3 + (simpleHash(channel + _product.sku) % 3);
  return Array.from({ length: count }, (_, i) => ({ url: `https://competitor-${i}.example.com/${_product.sku}` }));
}

function scrapeCompetitorPrice(_url: string): number {
  return 15000 + (simpleHash(_url) % 20000);
}

function getPriceSalesHistory(_product: ProductInput, _days: number): number[] {
  return Array.from({ length: 30 }, (_, i) => 50 + (simpleHash(_product.sku + i) % 100));
}

function calculateElasticity(historicalData: number[]): number {
  const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
  const variance = historicalData.reduce((s, x) => s + (x - mean) ** 2, 0) / historicalData.length;
  return Math.min(1.5, Math.max(-0.5, (variance / (mean || 1)) * 0.01));
}

function getInventory(sku: string): number {
  return 30 + (simpleHash(sku) % 70);
}

function calculateOptimalStock(_product: ProductInput): number {
  return 50 + (simpleHash(_product.sku) % 50);
}

function getSeason(): string {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

function daysUntilMajorEvent(): number {
  const now = new Date();
  const bf = new Date(now.getFullYear(), 10, 29);
  if (now > bf) bf.setFullYear(bf.getFullYear() + 1);
  return Math.ceil((bf.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

function pricingModelPredict(params: {
  base_price: number;
  competitor_avg: number;
  elasticity: number;
  stock_ratio: number;
  day_of_week: number;
  hour: number;
  season: string;
  days_to_event: number;
}): number {
  let p = params.base_price * 0.5 + params.competitor_avg * 0.4;
  if (params.stock_ratio < 0.5) p *= 0.95;
  if (params.stock_ratio > 1.2) p *= 1.05;
  if (params.day_of_week >= 5) p *= 0.98;
  if (params.hour >= 0 && params.hour < 6) p *= 0.97;
  if (params.days_to_event <= 14 && params.days_to_event >= 0) p *= 1.08;
  const seasonMult: Record<string, number> = { spring: 1, summer: 1.02, autumn: 1, winter: 1.03 };
  p *= seasonMult[params.season] ?? 1;
  return Math.round(p);
}

function predictSales(_product: ProductInput, price: number): number {
  return Math.max(10, Math.round(200 - (price / 200) + (simpleHash(_product.sku) % 30)));
}

/** @param _orgId scope for future DB/connected channels */
export function calculateOptimalPrice(product: ProductInput, channel: string, _orgId?: string, _countryCode?: string): OptimalPriceResult {
  const factors = {
    base_cost: product.cost,
    target_margin: product.target_margin,
    competitor_prices: [] as number[],
    demand_elasticity: 0,
    inventory_level: 0,
    time_factors: {} as { day_of_week: number; hour: number; season: string; days_to_event: number },
  };

  const competitors = getCompetitors(product, channel);
  for (const comp of competitors) {
    factors.competitor_prices.push(scrapeCompetitorPrice(comp.url));
  }
  const avg_competitor_price =
    factors.competitor_prices.length > 0
      ? factors.competitor_prices.reduce((a, b) => a + b, 0) / factors.competitor_prices.length
      : product.current_price * 1.1;

  const historicalData = getPriceSalesHistory(product, 90);
  factors.demand_elasticity = calculateElasticity(historicalData);

  const currentStock = getInventory(product.sku);
  const optimalStock = calculateOptimalStock(product);
  factors.inventory_level = optimalStock > 0 ? currentStock / optimalStock : 1;

  const now = new Date();
  factors.time_factors = {
    day_of_week: now.getDay(),
    hour: now.getHours(),
    season: getSeason(),
    days_to_event: daysUntilMajorEvent(),
  };

  const basePrice = product.cost * (1 + product.target_margin);
  const optimalPriceRaw = pricingModelPredict({
    base_price: basePrice,
    competitor_avg: avg_competitor_price,
    elasticity: factors.demand_elasticity,
    stock_ratio: factors.inventory_level,
    ...factors.time_factors,
  });

  const min_price = product.cost * 1.1;
  const max_price = avg_competitor_price * 1.15;
  const final_price = Math.round(Math.max(min_price, Math.min(max_price, optimalPriceRaw)));

  const changePct = product.current_price > 0 ? Math.abs(final_price - product.current_price) / product.current_price : 1;
  const price_updated = changePct > 0.03;

  const expected_sales = predictSales(product, final_price);
  const expected_revenue = expected_sales * final_price;
  const expected_profit = (final_price - product.cost) * expected_sales;

  return {
    recommended_price: final_price,
    expected_sales,
    expected_revenue,
    expected_profit,
    price_updated,
    factors: {
      base_cost: factors.base_cost,
      target_margin: factors.target_margin,
      avg_competitor_price: Math.round(avg_competitor_price),
      demand_elasticity: factors.demand_elasticity,
      inventory_ratio: Math.round(factors.inventory_level * 100) / 100,
      time_factors: factors.time_factors,
      min_price: Math.round(min_price),
      max_price: Math.round(max_price),
    },
  };
}
