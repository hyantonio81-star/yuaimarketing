/**
 * 콘텐츠 자동화 파이프라인: 수집 → Gemini 이중 생성 → Router(Blog / SNS) → Action.
 * Trigger: POST /api/content-automation/run (스케줄러 또는 수동).
 * 설정은 data/content-automation-settings.json 에 영속화 (배포 후 웹에서만 수정 가능).
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ContentAutomationResult, ContentAutomationSettings, ProductRssItem } from "./types.js";
import type { CommerceProduct } from "../threadsCommerce/types.js";
import { generateDualContent } from "./dualContentService.js";
import { runComplianceCheck, runOversightBoard } from "./complianceOverseerService.js";
import { fetchProductRssItems, toCommerceProduct } from "./productRssCollector.js";
import { fetchSheinAffiliateProducts } from "./sheinAffiliateFeedService.js";
import { prepareProductImageForPost } from "./imageService.js";
import { publishToBlogger } from "./bloggerService.js";
import { publishToThreads, canPublishNow } from "../threadsCommerce/threadsPublishService.js";
import { fetchProductsByMarketplace } from "../threadsCommerce/threadsCommerceService.js";
import { buildAffiliateProductUrl, type AffiliateConfig } from "../threadsCommerce/affiliateUrl.js";
import type { MarketplaceId } from "../threadsCommerce/types.js";

const defaultSettings: ContentAutomationSettings = {
  enableBlog: false,
  enableSns: true,
  blogUrlPlaceholder: "",
  contentLanguage: "es-DO",
  targetCountry: "DO",
  marketplace: "aliexpress",
  threadAccountId: "default",
  useOversightBoard: false,
};

const SETTINGS_FILENAME = "content-automation-settings.json";

function getSettingsPath(): string {
  return join(process.cwd(), "data", SETTINGS_FILENAME);
}

const settingsStore = new Map<string, ContentAutomationSettings>();
let settingsLoaded = false;

async function loadSettingsFromFile(): Promise<void> {
  if (settingsLoaded) return;
  const path = getSettingsPath();
  if (!existsSync(path)) {
    settingsLoaded = true;
    return;
  }
  try {
    const raw = await readFile(path, "utf-8");
    const data = JSON.parse(raw);
    if (data && typeof data === "object" && !Array.isArray(data)) {
      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === "object") settingsStore.set(k, v as ContentAutomationSettings);
      }
    }
  } catch {
    // ignore
  }
  settingsLoaded = true;
}

async function saveSettingsToFile(): Promise<void> {
  const path = getSettingsPath();
  const dir = join(path, "..");
  if (!existsSync(dir)) {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(dir, { recursive: true });
  }
  const obj: Record<string, ContentAutomationSettings> = {};
  for (const [k, v] of settingsStore) obj[k] = v;
  await writeFile(path, JSON.stringify(obj, null, 2), "utf-8");
}

export function getContentAutomationSettings(key: string = "default"): ContentAutomationSettings {
  const stored = settingsStore.get(key);
  return stored ? { ...defaultSettings, ...stored } : { ...defaultSettings };
}

/** 설정 조회 (파일에서 로드 후 반환). API에서 사용 */
export async function getContentAutomationSettingsAsync(key: string = "default"): Promise<ContentAutomationSettings> {
  await loadSettingsFromFile();
  return getContentAutomationSettings(key);
}

export async function setContentAutomationSettings(
  key: string,
  settings: Partial<ContentAutomationSettings>
): Promise<ContentAutomationSettings> {
  await loadSettingsFromFile();
  const current = getContentAutomationSettings(key);
  const next = { ...current, ...settings };
  settingsStore.set(key, next);
  await saveSettingsToFile();
  return next;
}

export type ProductSource = "rss" | "marketplace" | "shein_affiliate";

/**
 * 1회 파이프라인 실행.
 * source "rss" → productRssCollector, "marketplace" → fetchProductsByMarketplace, "shein_affiliate" → 쉬인 제휴 피드.
 */
export async function runContentAutomationPipeline(
  options: {
    settingsKey?: string;
    source?: ProductSource;
    marketplace?: MarketplaceId;
  } = {}
): Promise<ContentAutomationResult> {
  await loadSettingsFromFile();
  const jobId = `ca_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const settingsKey = options.settingsKey ?? "default";
  const settings = getContentAutomationSettings(settingsKey);
  const source = options.source ?? "marketplace";
  const marketplace = (options.marketplace ?? settings.marketplace ?? "aliexpress") as MarketplaceId;

  try {
    // 1) 수집
    let productForPipeline: CommerceProduct & { id: string };
    if (source === "shein_affiliate") {
      const items = await fetchSheinAffiliateProducts({ limit: 5 });
      const first = items[0];
      if (!first) return { jobId, status: "failed", error: "no_products_from_shein_affiliate" };
      productForPipeline = toCommerceProduct(first) as CommerceProduct & { id: string };
    } else if (source === "rss") {
      const items = await fetchProductRssItems({ marketplace, limit: 5 });
      const first = items[0];
      if (!first) return { jobId, status: "failed", error: "no_products_from_rss" };
      productForPipeline = toCommerceProduct(first) as CommerceProduct & { id: string };
    } else {
      const products = await fetchProductsByMarketplace(marketplace, { limit: 5 });
      const p = products[0];
      if (!p) return { jobId, status: "failed", error: "no_products" };
      productForPipeline = p as CommerceProduct & { id: string };
    }

    const productInfo = { title: productForPipeline.title, id: productForPipeline.id, marketplace: productForPipeline.marketplace };

    // 2) Gemini 이중 생성
    const dual = await generateDualContent(productForPipeline, {
      contentLanguage: settings.contentLanguage,
      targetCountry: settings.targetCountry,
      marketplace: productForPipeline.marketplace,
      blogUrlPlaceholder: settings.blogUrlPlaceholder,
    });

    const imageResult = prepareProductImageForPost(productForPipeline);
    let blogPostUrl: string | undefined;

    // 2.5) 감독관 검수 (ISO 42001) — 단일 감독관 또는 AI 감독 위원회(3인)
    const affiliateConfig: AffiliateConfig = {
      amazonAssociateTag: settings.amazonAssociateTag,
      aliexpressAffiliateParams: settings.aliexpressAffiliateParams,
      temuAffiliateParams: settings.temuAffiliateParams,
    };
    const productAffiliateUrl = buildAffiliateProductUrl(productForPipeline, affiliateConfig);
    const affiliateDisclaimer = '<p class="affiliate-disclaimer"><small>Este post contiene enlaces de afiliados. Si compras a través de estos enlaces podemos recibir una pequeña comisión sin costo adicional para ti.</small></p>';
    const productLinkHtml = productAffiliateUrl?.trim()
      ? `<p><a href="${productAffiliateUrl.replace(/"/g, "&quot;")}" rel="nofollow noopener">Comprar aquí / Buy here</a></p>`
      : "";
    const blogBodyForPublish = dual.blogReview + (imageResult.imageUrl ? `<p><img src="${imageResult.imageUrl}" alt="${(imageResult.alt ?? "").replace(/"/g, "&quot;")}" /></p>` : "") + productLinkHtml + affiliateDisclaimer;
    const complianceInput = {
      blogBodyForPublish,
      snsCopy: dual.snsCopy,
      targetCountry: settings.targetCountry ?? "DO",
      contentType: "b2c_affiliate" as const,
      productPrice: productForPipeline.price,
    };

    const useBoard = settings.useOversightBoard === true;
    let approved: boolean;
    let compliance: ContentAutomationResult["compliance"];
    let oversightBoard: ContentAutomationResult["oversightBoard"];

    if (useBoard) {
      const board = runOversightBoard(complianceInput);
      oversightBoard = board;
      approved = board.decision === "APPROVE";
      if (!approved) {
      return {
        jobId,
        status: "done",
        product: productInfo,
        product_id: productForPipeline.id,
        snsCopy: dual.snsCopy,
        blogReview: dual.blogReview,
        oversightBoard: board,
        error: board.decision === "DISCARD" ? "compliance_discarded" : "compliance_revised",
      };
      }
    } else {
      compliance = runComplianceCheck(complianceInput);
      approved = compliance.approved;
      if (!approved) {
      return {
        jobId,
        status: "done",
        product: productInfo,
        product_id: productForPipeline.id,
        snsCopy: dual.snsCopy,
        blogReview: dual.blogReview,
        compliance,
        error: "compliance_rejected",
      };
      }
    }

    // 3) Path A — Blogger
    if (settings.enableBlog) {
      const blogId = (process.env.BLOGGER_BLOG_ID ?? "").trim() || "stub";
      const bodyWithImg = blogBodyForPublish;
      const blogResult = await publishToBlogger(
        blogId,
        dual.blogTitle ?? productForPipeline.title,
        bodyWithImg,
        [imageResult.imageUrl]
      );
      if (blogResult.ok && blogResult.postUrl) blogPostUrl = blogResult.postUrl;
    } else {
      blogPostUrl = settings.blogUrlPlaceholder || undefined;
    }

    // 4) Path B — Threads (SNS)
    let snsText = blogPostUrl
      ? dual.snsCopy.replace(settings.blogUrlPlaceholder || "[BLOG_LINK]", blogPostUrl)
      : dual.snsCopy;
    if (productAffiliateUrl?.trim()) snsText += `\n\n🔗 ${productAffiliateUrl.trim()}`;
    let snsPostUrl: string | undefined;

    if (settings.enableSns) {
      const can = canPublishNow();
      if (can.allowed) {
        const threadResult = await publishToThreads(settings.threadAccountId ?? "default", {
          text: snsText,
          imageUrl: imageResult.imageUrl,
          landingPageUrl: blogPostUrl || settings.blogUrlPlaceholder,
          productId: productForPipeline.id,
          marketplace: productForPipeline.marketplace,
        });
        if (threadResult.ok && threadResult.url) snsPostUrl = threadResult.url;
      }
    }

    return {
      jobId,
      status: "done",
      product: productInfo,
      product_id: productForPipeline.id,
      snsCopy: dual.snsCopy,
      blogReview: dual.blogReview,
      blogPostUrl,
      snsPostUrl,
      compliance,
      oversightBoard,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "pipeline_failed";
    return { jobId, status: "failed", error: message };
  }
}
