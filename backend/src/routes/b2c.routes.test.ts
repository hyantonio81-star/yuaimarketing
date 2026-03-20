import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import Fastify from "fastify";
import { b2cRoutes } from "./b2c.js";

vi.mock("../lib/auth.js", () => ({
  requireUser: async () => ({ id: "test-user", role: "user" }),
}));

describe("B2C routes", () => {
  let app: Awaited<ReturnType<typeof Fastify>>;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(b2cRoutes, { prefix: "/api/b2c" });
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/b2c/optimal-price returns 200 and recommended_price", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/b2c/optimal-price",
      payload: {
        product: {
          sku: "TEST-001",
          cost: 10000,
          target_margin: 0.3,
          current_price: 15000,
        },
        channel: "Shopify",
      },
      headers: { "content-type": "application/json" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("recommended_price");
    expect(typeof body.recommended_price).toBe("number");
    expect(body).toHaveProperty("expected_sales");
    expect(body).toHaveProperty("factors");
  });

  it("POST /api/b2c/optimal-price 400 when product.sku missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/b2c/optimal-price",
      payload: {
        product: { cost: 10000, target_margin: 0.3, current_price: 15000 },
        channel: "Shopify",
      },
      headers: { "content-type": "application/json" },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body).toHaveProperty("error");
  });

  it("POST /api/b2c/promotion-plan returns 200 and execution_plan", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/b2c/promotion-plan",
      payload: {
        product: { sku: "PROMO-001", name: "Test", base_price: 18000 },
        goal: "revenue",
      },
      headers: { "content-type": "application/json" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("recommendation");
    expect(body).toHaveProperty("execution_plan");
    expect(body.execution_plan).toHaveProperty("messaging");
    expect(body.execution_plan).toHaveProperty("start_date");
    expect(body.execution_plan).toHaveProperty("end_date");
  });

  it("POST /api/b2c/promotion-plan 400 when product.sku missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/b2c/promotion-plan",
      payload: { product: {}, goal: "revenue" },
      headers: { "content-type": "application/json" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("POST /api/b2c/review-analysis returns 200 and overall_rating", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/b2c/review-analysis",
      payload: { product: { sku: "REV-001" } },
      headers: { "content-type": "application/json" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("overall_rating");
    expect(body).toHaveProperty("total_reviews");
    expect(body).toHaveProperty("sentiment_distribution");
  });
});
