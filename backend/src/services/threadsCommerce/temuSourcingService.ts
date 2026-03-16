/**
 * Temu 상품 수집 스텁. 실제 연동 시 Temu API/파트너 링크로 교체.
 */

import type { CommerceProduct } from "./types.js";

const STUB: CommerceProduct[] = [
  {
    id: "TM-STUB-01",
    title: "Mini LED Desk Lamp - Temu Pick",
    url: "https://www.temu.com/stub-01",
    imageUrl: "https://via.placeholder.com/400?text=Temu",
    category: "Home",
    price: 12.99,
    priceDropPercent: 25,
    marketplace: "temu",
    collectedAt: new Date().toISOString(),
  },
  {
    id: "TM-STUB-02",
    title: "Portable Power Bank 10000mAh",
    url: "https://www.temu.com/stub-02",
    imageUrl: "https://via.placeholder.com/400?text=Temu",
    category: "Electronics",
    price: 18.99,
    marketplace: "temu",
    collectedAt: new Date().toISOString(),
  },
];

export async function fetchTemuProducts(
  options: { category?: string; limit?: number } = {}
): Promise<CommerceProduct[]> {
  const limit = Math.min(50, Math.max(1, options.limit ?? 10));
  let list = [...STUB];
  if (options.category) list = list.filter((p) => p.category === options.category);
  return list.slice(0, limit);
}
