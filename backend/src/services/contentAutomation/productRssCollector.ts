/**
 * 상품 RSS 수집 (알리/쉬인/테무 베스트셀러 등).
 * 실제 연동 시 각 플랫폼 공개 RSS 또는 파트너 피드 URL 사용.
 */

import Parser from "rss-parser";
import type { ProductRssItem } from "./types.js";

const RSS_FEEDS: { url: string; marketplace: string; source: string }[] = [
  // 알리익스프레스/쉬인/테무 공개 피드 예시 (실제 URL로 교체)
  { url: "https://rss.app/feed/placeholder-ali", marketplace: "aliexpress", source: "rss" },
  { url: "https://rss.app/feed/placeholder-shein", marketplace: "shein", source: "rss" },
];

const parser = new Parser({ timeout: 8000 });

export async function fetchProductRssItems(
  options: { marketplace?: string; limit?: number } = {}
): Promise<ProductRssItem[]> {
  const limit = Math.min(50, Math.max(1, options.limit ?? 10));
  const all: ProductRssItem[] = [];
  const feeds = options.marketplace
    ? RSS_FEEDS.filter((f) => f.marketplace === options.marketplace)
    : RSS_FEEDS;

  for (const feed of feeds) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const items = (parsed.items ?? []).slice(0, limit);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const link = item.link ?? "";
        const id = link ? new URL(link).pathname.replace(/\//g, "_").slice(1) || `item_${i}` : `item_${Date.now()}_${i}`;
        const imgMatch = typeof item.content === "string" && item.content.match(/<img[^>]+src="([^"]+)"/);
        all.push({
          id: id.slice(0, 64),
          title: (item.title ?? "").trim() || "Untitled",
          url: link,
          imageUrl: imgMatch ? imgMatch[1] : "https://via.placeholder.com/400?text=Product",
          category: (parsed.title ?? feed.marketplace).slice(0, 64),
          collectedAt: new Date().toISOString(),
          marketplace: feed.marketplace,
          source: feed.source,
        });
      }
    } catch {
      // 피드 실패 시 스텁 1건 추가해 파이프라인 테스트 가능
      if (all.length === 0 && feeds.length > 0) {
        all.push({
          id: `stub_${feed.marketplace}_${Date.now()}`,
          title: `Stub product (${feed.marketplace} RSS unavailable)`,
          url: "https://example.com/product",
          imageUrl: "https://via.placeholder.com/400?text=Product",
          category: "General",
          collectedAt: new Date().toISOString(),
          marketplace: feed.marketplace,
          source: "stub",
        });
      }
    }
  }

  return all.slice(0, limit);
}

/** CommerceProduct 호환 형태로 변환 (기존 파이프라인에서 사용) */
export function toCommerceProduct(item: ProductRssItem): {
  id: string;
  title: string;
  url: string;
  imageUrl: string;
  category: string;
  price?: number;
  priceDropPercent?: number;
  marketplace: "amazon" | "shein" | "temu" | "aliexpress";
  collectedAt: string;
  source?: string;
} {
  const m = item.marketplace as "amazon" | "shein" | "temu" | "aliexpress";
  return {
    id: item.id,
    title: item.title,
    url: item.url,
    imageUrl: item.imageUrl,
    category: item.category,
    price: item.price,
    priceDropPercent: item.priceDropPercent,
    marketplace: m ?? "aliexpress",
    collectedAt: item.collectedAt,
    source: item.source,
  };
}
