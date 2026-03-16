/**
 * AliExpress 상품 수집 스텁. 실제 연동 시 AliExpress API/파트너 링크로 교체.
 */

import type { CommerceProduct } from "./types.js";

const STUB: CommerceProduct[] = [
  {
    id: "AE-STUB-01",
    title: "Smart Watch Fitness Tracker",
    url: "https://www.aliexpress.com/item/stub-01",
    imageUrl: "https://via.placeholder.com/400?text=AliExpress",
    category: "Electronics",
    price: 22.5,
    priceDropPercent: 15,
    marketplace: "aliexpress",
    collectedAt: new Date().toISOString(),
  },
  {
    id: "AE-STUB-02",
    title: "Soft Silicone Phone Case",
    url: "https://www.aliexpress.com/item/stub-02",
    imageUrl: "https://via.placeholder.com/400?text=AliExpress",
    category: "Accessories",
    price: 3.99,
    marketplace: "aliexpress",
    collectedAt: new Date().toISOString(),
  },
];

export async function fetchAliExpressProducts(
  options: { category?: string; limit?: number } = {}
): Promise<CommerceProduct[]> {
  const limit = Math.min(50, Math.max(1, options.limit ?? 10));
  let list = [...STUB];
  if (options.category) list = list.filter((p) => p.category === options.category);
  return list.slice(0, limit);
}
