/**
 * Shein 상품 수집 스텁. 실제 연동 시 Shein API/파트너 링크로 교체.
 */

import type { CommerceProduct } from "./types.js";

const STUB: CommerceProduct[] = [
  {
    id: "SH-STUB-01",
    title: "Floral Summer Dress - Shein Best",
    url: "https://www.shein.com/stub-01",
    imageUrl: "https://via.placeholder.com/400?text=Shein",
    category: "Women",
    price: 24.99,
    priceDropPercent: 20,
    marketplace: "shein",
    collectedAt: new Date().toISOString(),
  },
  {
    id: "SH-STUB-02",
    title: "Wireless Earphones - Trend",
    url: "https://www.shein.com/stub-02",
    imageUrl: "https://via.placeholder.com/400?text=Shein",
    category: "Electronics",
    price: 15.99,
    marketplace: "shein",
    collectedAt: new Date().toISOString(),
  },
];

export async function fetchSheinProducts(
  options: { category?: string; limit?: number } = {}
): Promise<CommerceProduct[]> {
  const limit = Math.min(50, Math.max(1, options.limit ?? 10));
  let list = [...STUB];
  if (options.category) list = list.filter((p) => p.category === options.category);
  return list.slice(0, limit);
}
