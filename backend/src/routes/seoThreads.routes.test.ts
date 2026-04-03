import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import Fastify from "fastify";
import { threadsCommerceRoutes } from "./threadsCommerce.js";

const mockProducts = [
  { id: "p1", asin: "ASIN-1", title: "Test Product", productId: "p1", marketplace: "amazon" },
];

vi.mock("../services/threadsCommerce/index.js", () => {
  return {
    fetchProductsByMarketplace: vi.fn(async () => mockProducts),
    getPromoShortlist: vi.fn(async () => ({ shortlist: [] })),
    getThreadsConnection: vi.fn(() => ({
      displayName: "Demo Threads",
      connectedAt: new Date("2026-01-01T00:00:00Z").toISOString(),
    })),
    setThreadsConnection: vi.fn((_accountId: string, _payload: any) => ({
      displayName: "Demo Threads",
      connectedAt: new Date("2026-01-01T00:00:00Z").toISOString(),
    })),
    disconnectThreads: vi.fn(),
    canPublishNow: vi.fn(() => ({ allowed: true })),
    getSettings: vi.fn(() => ({
      accountId: "default",
      landingPageUrl: "https://example.com",
      infoRatio: 0.7,
      priceDropThreshold: 15,
      source: "both",
      marketplace: "amazon",
      targetCountry: "KR",
      contentLanguage: "ko",
      amazonAssociateTag: "tag-123",
      aliexpressAffiliateParams: "",
      temuAffiliateParams: "",
      categories: [],
    })),
    setSettings: vi.fn((_accountId: string, payload: any) => payload),
    runPipelineOnce: vi.fn(async () => ({
      jobId: "tc_test_1",
      status: "done",
      product: { title: "Test Product", asin: "ASIN-1", productId: "p1", marketplace: "amazon" },
      product_id: "p1",
      published: true,
      postUrl: "https://threads.com/post/1",
      copy: "hello",
    })),
    getPublishRateLimit: vi.fn(() => ({ allowed: true })),
    getPostLog: vi.fn((_limit: number) => []),
  };
});

describe("SEO/Threads routes (contracts)", () => {
  let app: Awaited<ReturnType<typeof Fastify>>;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(threadsCommerceRoutes, { prefix: "/api/seo/threads-commerce" });
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /products returns products array", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/seo/threads-commerce/products?limit=5",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("products");
    expect(Array.isArray(body.products)).toBe(true);
    expect(body.products.length).toBeGreaterThan(0);
    expect(body.products[0]).toHaveProperty("title");
  });

  it("GET /settings returns settings object", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/seo/threads-commerce/settings",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("settings");
    expect(body.settings).toHaveProperty("marketplace");
  });

  it("GET /connection returns connected + displayName", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/seo/threads-commerce/connection",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.connected).toBe(true);
    expect(body).toHaveProperty("displayName");
  });

  it("POST /run returns pipeline result shape", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/seo/threads-commerce/run",
      payload: { usePriceDropOnly: false, contentType: "info" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("jobId");
    expect(body).toHaveProperty("status");
    expect(body.status).toBe("done");
    expect(body).toHaveProperty("postUrl");
  });
});

