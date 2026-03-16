/**
 * Keepa 스타일 가격 변동 감지. 15% 이상 하락 시 트리거.
 * 실제 연동 시 Keepa API 또는 유사 데이터 소스 사용.
 */

import type { CommerceProduct } from "./types.js";

export interface PriceDropCandidate {
  product: CommerceProduct;
  dropPercent: number;
  triggeredAt: string;
}

/**
 * 가격 하락 임계치(%) 이상인 상품만 필터.
 */
export function filterByPriceDrop(
  products: CommerceProduct[],
  thresholdPercent: number = 15
): PriceDropCandidate[] {
  const now = new Date().toISOString();
  return products
    .filter((p) => (p.priceDropPercent ?? 0) >= thresholdPercent)
    .map((p) => ({
      product: p,
      dropPercent: p.priceDropPercent ?? 0,
      triggeredAt: now,
    }));
}
