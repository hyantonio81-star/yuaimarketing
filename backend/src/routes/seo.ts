import { FastifyInstance } from "fastify";
import {
  getTools,
  getAutoAnalysis,
  getAiGeneration,
} from "../services/seoService.js";
import { generateBlogPost, getSuggestions } from "../services/blogPostService.js";
import { generateSocialCalendar } from "../services/socialCalendarService.js";
import { generateAdVariants } from "../services/adVariantsService.js";

export async function seoRoutes(app: FastifyInstance) {
  app.get("/tools", async () => ({ tools: getTools() }));
  app.get("/analysis", async () => ({ analysis: getAutoAnalysis() }));
  app.get("/ai-generation", async () => ({ items: getAiGeneration() }));

  app.get<{
    Querystring: { keyword?: string; country?: string; locale?: string };
  }>("/suggestions", async (req) => {
    const q = req.query ?? {};
    return getSuggestions(q.keyword ?? "키워드");
  });

  app.get<{
    Querystring: { keyword?: string; word_count?: string; country?: string; locale?: string };
  }>("/generate-blog-post", async (req) => {
    const q = req.query ?? {};
    const wordCount = q.word_count ? parseInt(q.word_count, 10) : 1500;
    return generateBlogPost(q.keyword ?? "keyword", Number.isFinite(wordCount) ? wordCount : 1500);
  });

  app.get<{
    Querystring: { product?: string; days?: string; country?: string; locale?: string };
  }>("/social-calendar", async (req) => {
    const q = req.query ?? {};
    const days = q.days ? parseInt(q.days, 10) : 90;
    const totalDays = Number.isFinite(days) ? Math.min(Math.max(1, days), 365) : 90;
    return {
      product: (q.product || "제품").trim() || "제품",
      days: totalDays,
      posts: generateSocialCalendar(q.product ?? "제품", totalDays),
    };
  });

  app.get<{
    Querystring: { product?: string; platform?: string; variants?: string; country?: string; locale?: string };
  }>("/ad-variants", async (req) => {
    const q = req.query ?? {};
    const variants = q.variants ? parseInt(q.variants, 10) : 10;
    const n = Number.isFinite(variants) ? Math.min(Math.max(1, variants), 50) : 10;
    return {
      product: (q.product || "제품").trim() || "제품",
      platform: q.platform || "Google",
      variants: generateAdVariants(q.product ?? "제품", q.platform ?? "Google", n),
    };
  });
}
