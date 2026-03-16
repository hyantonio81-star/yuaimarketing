import { describe, it, expect } from "vitest";
import { calculateOptimalPrice, type ProductInput } from "./optimalPriceService.js";

describe("optimalPriceService", () => {
  const product: ProductInput = {
    sku: "TEST-SKU-001",
    cost: 10000,
    target_margin: 0.3,
    current_price: 15000,
  };

  it("returns recommended_price within min/max bounds", () => {
    const result = calculateOptimalPrice(product, "shopify");
    expect(result.recommended_price).toBeGreaterThanOrEqual(result.factors.min_price);
    expect(result.recommended_price).toBeLessThanOrEqual(result.factors.max_price);
  });

  it("returns expected_sales, expected_revenue, expected_profit", () => {
    const result = calculateOptimalPrice(product, "Coupang");
    expect(typeof result.expected_sales).toBe("number");
    expect(result.expected_sales).toBeGreaterThanOrEqual(0);
    expect(result.expected_revenue).toBe(result.recommended_price * result.expected_sales);
    expect(typeof result.expected_profit).toBe("number");
  });

  it("returns price_updated boolean", () => {
    const result = calculateOptimalPrice(product, "Amazon");
    expect(typeof result.price_updated).toBe("boolean");
  });

  it("returns factors with required shape", () => {
    const result = calculateOptimalPrice(product, "Naver SmartStore");
    expect(result.factors).toHaveProperty("base_cost", product.cost);
    expect(result.factors).toHaveProperty("target_margin", product.target_margin);
    expect(typeof result.factors.avg_competitor_price).toBe("number");
    expect(typeof result.factors.inventory_ratio).toBe("number");
    expect(result.factors.time_factors).toHaveProperty("season");
    expect(result.factors.time_factors).toHaveProperty("days_to_event");
  });
});
