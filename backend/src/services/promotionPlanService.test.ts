import { describe, it, expect } from "vitest";
import {
  planPromotion,
  type ProductForPromo,
  type PromotionGoal,
} from "./promotionPlanService.js";

describe("promotionPlanService", () => {
  const product: ProductForPromo = { sku: "PROMO-SKU", name: "Test Product", base_price: 20000 };

  it("returns recommendation and execution_plan", () => {
    const result = planPromotion(product, "revenue");
    expect(result.recommendation).toBeDefined();
    expect(result.execution_plan).toBeDefined();
    expect(result.execution_plan.messaging).toBeTruthy();
    expect(result.execution_plan.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.execution_plan.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Array.isArray(result.execution_plan.channels)).toBe(true);
    expect(typeof result.execution_plan.budget).toBe("number");
  });

  it("returns all_scenarios array", () => {
    const result = planPromotion(product, "profit");
    expect(Array.isArray(result.all_scenarios)).toBe(true);
    expect(result.all_scenarios.length).toBeGreaterThan(0);
  });

  it("goal revenue selects by projected_revenue", () => {
    const result = planPromotion(product, "revenue");
    const best = result.all_scenarios.reduce((a, b) =>
      b.projected_revenue > a.projected_revenue ? b : a
    );
    expect(result.recommendation.projected_revenue).toBe(best.projected_revenue);
  });

  it("goal clearance selects by projected_units_sold", () => {
    const result = planPromotion(product, "clearance");
    const best = result.all_scenarios.reduce((a, b) =>
      b.projected_units_sold > a.projected_units_sold ? b : a
    );
    expect(result.recommendation.projected_units_sold).toBe(best.projected_units_sold);
  });
});
