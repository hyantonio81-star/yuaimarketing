import { describe, it, expect } from "vitest";
import {
  analyzeReviews,
  collectReviewsAllChannels,
  type ProductForReview,
} from "./reviewAnalysisService.js";

describe("reviewAnalysisService", () => {
  const product: ProductForReview = { sku: "REVIEW-SKU" };

  it("collectReviewsAllChannels returns array of reviews", () => {
    const reviews = collectReviewsAllChannels(product);
    expect(Array.isArray(reviews)).toBe(true);
    expect(reviews.length).toBeGreaterThan(0);
    reviews.forEach((r) => {
      expect(typeof r.text).toBe("string");
      expect(r.text.length).toBeGreaterThan(0);
    });
  });

  it("analyzeReviews returns required shape", () => {
    const result = analyzeReviews(product);
    expect(typeof result.overall_rating).toBe("number");
    expect(result.sentiment_distribution).toMatchObject({
      positive: expect.any(Number),
      neutral: expect.any(Number),
      negative: expect.any(Number),
    });
    expect(Array.isArray(result.positive_highlights)).toBe(true);
    expect(Array.isArray(result.improvement_areas)).toBe(true);
    expect(Array.isArray(result.action_items)).toBe(true);
    expect(result.review_volume_trend).toHaveProperty("direction");
    expect(result.review_volume_trend).toHaveProperty("change_pct");
    expect(result.review_volume_trend).toHaveProperty("period");
    expect(typeof result.total_reviews).toBe("number");
  });

  it("sentiment counts sum to total_reviews", () => {
    const result = analyzeReviews(product);
    const sum =
      result.sentiment_distribution.positive +
      result.sentiment_distribution.neutral +
      result.sentiment_distribution.negative;
    expect(sum).toBe(result.total_reviews);
  });
});
