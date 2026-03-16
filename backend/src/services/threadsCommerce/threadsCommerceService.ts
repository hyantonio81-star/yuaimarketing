/**
 * 스레드 x 이커머스 자동화 오케스트레이션.
 * 10개 중 7개 정보형 / 3개 상품형 비율, 예약(골든타임), 30분 1건 게시.
 */

import type { CommerceProduct, MarketplaceId } from "./types.js";
import { fetchAmazonProducts } from "./amazonSourcingService.js";
import { fetchSheinProducts } from "./sheinSourcingService.js";
import { fetchTemuProducts } from "./temuSourcingService.js";
import { fetchAliExpressProducts } from "./aliexpressSourcingService.js";
import { generateThreadsCopy } from "./threadsCopyService.js";
import { prepareProductImage } from "./threadsImageService.js";
import { publishToThreads, canPublishNow } from "./threadsPublishService.js";
import { filterByPriceDrop } from "./priceDropService.js";
import { buildAffiliateProductUrl, type AffiliateConfig } from "./affiliateUrl.js";
import type { AmazonSourceType } from "./amazonSourcingService.js";
import { scoreAffiliateProducts, filterPromoShortlist, type ScoredCommerceProduct } from "./affiliateProductScoreService.js";

export const INFO_RATIO = 0.7; // 70% 정보형
export const GOLDEN_HOURS = [8, 13, 21]; // 오전 8시, 오후 1시, 오후 9시

export type TargetCountryCode = "DO" | "MX" | "BR" | "KR" | "US" | "PA";
export type ContentLanguageCode = "es-DO" | "es-MX" | "pt-BR" | "ko" | "en";

export interface ThreadsCommerceSettings {
  accountId?: string;
  landingPageUrl?: string; // Linktree/노션 등 (딥링크·제휴코드는 랜딩에서 관리)
  infoRatio?: number;     // 0~1, 기본 0.7
  priceDropThreshold?: number; // 15
  categories?: string[];
  source?: "bestsellers" | "movers_shakers" | "both"; // Amazon 전용
  marketplace?: MarketplaceId; // amazon | shein | temu | aliexpress
  targetCountry?: TargetCountryCode;
  contentLanguage?: ContentLanguageCode;
  /** 제휴(Tracking ID) — 상품별 링크에 자동 부착 */
  amazonAssociateTag?: string;
  aliexpressAffiliateParams?: string; // 예: aff_fcid=xxx
  temuAffiliateParams?: string;
}

const defaultSettings: ThreadsCommerceSettings = {
  accountId: "default",
  landingPageUrl: "",
  infoRatio: INFO_RATIO,
  priceDropThreshold: 15,
  source: "both",
  marketplace: "amazon",
  targetCountry: "KR",
  contentLanguage: "ko",
};

const settingsStore = new Map<string, ThreadsCommerceSettings>();

export function getSettings(accountId: string = "default"): ThreadsCommerceSettings {
  const stored = settingsStore.get(accountId);
  return stored ? { ...defaultSettings, ...stored } : { ...defaultSettings };
}

export function setSettings(accountId: string, settings: Partial<ThreadsCommerceSettings>): ThreadsCommerceSettings {
  const current = getSettings(accountId);
  const next = { ...current, ...settings };
  settingsStore.set(accountId, next);
  return next;
}

export interface PipelineResult {
  jobId: string;
  status: "sourcing" | "copy" | "publish" | "done" | "rate_limited" | "failed";
  product?: { title: string; asin: string; productId?: string; marketplace?: string };
  /** 제휴 상품 단위 연동용 — 영상·블로그·SNS job 연결 시 공통 키 */
  product_id?: string;
  copy?: string;
  published?: boolean;
  postUrl?: string;
  error?: string;
  nextAllowedAt?: number;
}

async function fetchProductsByMarketplace(
  marketplace: MarketplaceId,
  options: { category?: string; source?: AmazonSourceType; limit?: number }
): Promise<CommerceProduct[]> {
  const limit = options.limit ?? 10;
  if (marketplace === "amazon") {
    return fetchAmazonProducts({
      category: options.category,
      source: options.source ?? "both",
      limit,
    });
  }
  if (marketplace === "shein") return fetchSheinProducts({ category: options.category, limit });
  if (marketplace === "temu") return fetchTemuProducts({ category: options.category, limit });
  if (marketplace === "aliexpress") return fetchAliExpressProducts({ category: options.category, limit });
  return fetchAmazonProducts({ category: options.category, source: "both", limit });
}

export { fetchProductsByMarketplace };

/**
 * 홍보 후보 shortlist: 수집 + AI 팀 점수 부여 + min_score 필터.
 * 인기 상품 해석 + 멀티 포맷 홍보 기획의 "선정" 단계.
 */
export async function getPromoShortlist(
  marketplace: MarketplaceId,
  options: {
    category?: string;
    source?: AmazonSourceType;
    limit?: number;
    min_score?: number;
  } = {}
): Promise<{ shortlist: ScoredCommerceProduct[] }> {
  const limit = Math.min(50, Math.max(1, options.limit ?? 20));
  const products = await fetchProductsByMarketplace(marketplace, {
    category: options.category,
    source: options.source ?? "both",
    limit,
  });
  const scored = scoreAffiliateProducts(products);
  const minScore = typeof options.min_score === "number" ? Math.max(0, Math.min(100, options.min_score)) : 0;
  const shortlist = filterPromoShortlist(scored, minScore);
  return { shortlist };
}

/**
 * 1회 파이프라인: 수집 → (가격 하락 필터 선택) → AI 문구 → 이미지 → 게시(30분 제한).
 */
export async function runPipelineOnce(
  accountId: string = "default",
  options: { usePriceDropOnly?: boolean; contentType?: "product" | "info" } = {}
): Promise<PipelineResult> {
  const jobId = `tc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const settings = getSettings(accountId);
  const marketplace = settings.marketplace ?? "amazon";
  const targetCountry = settings.targetCountry ?? "KR";
  const contentLanguage = settings.contentLanguage ?? "ko";

  try {
    let products = await fetchProductsByMarketplace(marketplace, {
      category: settings.categories?.[0],
      source: settings.source,
      limit: 10,
    });

    if (options.usePriceDropOnly && (settings.priceDropThreshold ?? 15) > 0) {
      const dropped = filterByPriceDrop(products, settings.priceDropThreshold);
      if (dropped.length > 0) products = dropped.map((d) => d.product);
    }

    const product = products[0];
    if (!product) {
      return { jobId, status: "failed", error: "no_products" };
    }

    const productId = "asin" in product ? (product as { asin: string }).asin : product.id;
    const contentType = options.contentType ?? (Math.random() < (settings.infoRatio ?? INFO_RATIO) ? "info" : "product");
    const copyResult = await generateThreadsCopy(product, contentType, {
      contentLanguage,
      targetCountry,
      marketplace,
    });
    const imageResult = prepareProductImage(product);
    const affiliateConfig: AffiliateConfig = {
      amazonAssociateTag: settings.amazonAssociateTag,
      aliexpressAffiliateParams: settings.aliexpressAffiliateParams,
      temuAffiliateParams: settings.temuAffiliateParams,
    };
    const productLinkUrl = buildAffiliateProductUrl(product, affiliateConfig);
    const linkParts: string[] = [];
    if (productLinkUrl?.trim()) linkParts.push(`🔗 ${productLinkUrl.trim()}`);
    if (settings.landingPageUrl?.trim()) linkParts.push(`📌 ${settings.landingPageUrl.trim()}`);
    const text = copyResult.text + (linkParts.length > 0 ? "\n\n" + linkParts.join("\n") : "");

    const publishResult = await publishToThreads(accountId, {
      text,
      imageUrl: imageResult.imageUrl,
      landingPageUrl: settings.landingPageUrl,
      productId,
      marketplace,
    });

    if (!publishResult.ok) {
      if (publishResult.error === "rate_limit_30min") {
        return {
          jobId,
          status: "rate_limited",
          product: { title: product.title, asin: productId, productId, marketplace },
          product_id: product.id,
          copy: copyResult.text,
          nextAllowedAt: publishResult.nextAllowedAt,
        };
      }
      if (publishResult.error === "threads_not_connected") {
        return { jobId, status: "failed", error: "threads_not_connected" };
      }
      return { jobId, status: "failed", error: publishResult.error };
    }

    return {
      jobId,
      status: "done",
      product: { title: product.title, asin: productId, productId, marketplace },
      product_id: product.id,
      copy: copyResult.text,
      published: true,
      postUrl: publishResult.url,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "pipeline_failed";
    return { jobId, status: "failed", error: message };
  }
}

export function getPublishRateLimit(): { allowed: boolean; nextAllowedAt?: number } {
  return canPublishNow();
}
