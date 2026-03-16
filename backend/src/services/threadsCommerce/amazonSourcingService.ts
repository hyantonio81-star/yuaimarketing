/**
 * Amazon Best Sellers / Movers & Shakers 데이터 수집 (Step 1).
 * RSS 또는 스텁 데이터로 상품 목록 제공.
 */

import type { CommerceProduct } from "./types.js";

export type AmazonProduct = CommerceProduct & {
  id: string;
  asin: string;
  marketplace: "amazon";
  source: "bestsellers" | "movers_shakers" | "stub";
};

const STUB_PRODUCTS: AmazonProduct[] = [
  {
    id: "B0STUB01",
    asin: "B0STUB01",
    title: "Wireless Earbuds - Best Seller",
    url: "https://www.amazon.com/dp/B0STUB01",
    imageUrl: "https://m.media-amazon.com/images/I/71stub1.jpg",
    category: "Electronics",
    price: 29.99,
    priceDropPercent: 12,
    marketplace: "amazon",
    source: "bestsellers",
    collectedAt: new Date().toISOString(),
  },
  {
    id: "B0STUB02",
    asin: "B0STUB02",
    title: "Portable Blender - Movers & Shakers",
    url: "https://www.amazon.com/dp/B0STUB02",
    imageUrl: "https://m.media-amazon.com/images/I/72stub2.jpg",
    category: "Kitchen",
    price: 39.99,
    priceDropPercent: 18,
    marketplace: "amazon",
    source: "movers_shakers",
    collectedAt: new Date().toISOString(),
  },
  {
    id: "B0STUB03",
    asin: "B0STUB03",
    title: "Desk Organizer Set",
    url: "https://www.amazon.com/dp/B0STUB03",
    imageUrl: "https://m.media-amazon.com/images/I/73stub3.jpg",
    category: "Office",
    price: 24.99,
    marketplace: "amazon",
    source: "bestsellers",
    collectedAt: new Date().toISOString(),
  },
];

export type AmazonSourceType = "bestsellers" | "movers_shakers" | "both";

/**
 * 베스트셀러 또는 Movers & Shakers 스타일 목록 반환.
 * 실제 연동 시 RSS 또는 스크래핑으로 교체.
 */
export async function fetchAmazonProducts(
  options: { category?: string; source?: AmazonSourceType; limit?: number } = {}
): Promise<AmazonProduct[]> {
  const limit = Math.min(50, Math.max(1, options.limit ?? 10));
  const source = options.source ?? "both";
  let list = [...STUB_PRODUCTS];
  if (source === "bestsellers") list = list.filter((p) => p.source === "bestsellers");
  else if (source === "movers_shakers") list = list.filter((p) => p.source === "movers_shakers");
  if (options.category) list = list.filter((p) => p.category === options.category);
  return list.slice(0, limit);
}
