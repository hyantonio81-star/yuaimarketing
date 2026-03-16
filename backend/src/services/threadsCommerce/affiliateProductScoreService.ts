/**
 * 제휴(affiliate) 상품 홍보 가치 점수.
 * 인기 상품 해석 + 멀티 포맷·멀티 채널 홍보 기획의 "선정" 단계용.
 */

import type { CommerceProduct } from "./types.js";

export interface AffiliateProductScore {
  /** 시장 인기 (베스트셀러/무버스/소스 기반, 0~100) */
  popularity_score: number;
  /** AI 팀 평가 (마진·가격변동·키워드·규제 가정, 0~100) */
  ai_team_score: number;
  /** 종합 홍보 가치 (가중 평균, 0~100) */
  composite_score: number;
}

export interface ScoredCommerceProduct extends CommerceProduct {
  /** 홍보 가치 점수 (선정 shortlist용) */
  promo_scores: AffiliateProductScore;
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * 단일 제휴 상품에 대해 홍보 가치 점수 계산 (휴리스틱).
 * 실제 연동 시: 마진·경쟁강도·키워드 적합도·규제 리스크 등 외부 데이터로 대체 가능.
 */
export function scoreAffiliateProduct(product: CommerceProduct): AffiliateProductScore {
  const seed = simpleHash(product.id + product.title + (product.category ?? ""));
  const sourceBonus = (product.source === "bestsellers" ? 25 : product.source === "movers_shakers" ? 20 : 10) + (seed % 15);
  const popularity_score = Math.min(100, Math.max(0, sourceBonus + (seed % 30)));

  const priceDropBonus = (product.priceDropPercent ?? 0) >= 15 ? 15 : (product.priceDropPercent ?? 0) >= 10 ? 8 : 0;
  const titleLen = product.title?.length ?? 0;
  const titleScore = Math.min(20, Math.floor(titleLen / 5) + (seed % 10));
  const marginHint = product.price && product.price > 0 ? Math.min(25, 10 + Math.floor(50000 / product.price)) : 12;
  const ai_team_score = Math.min(100, Math.max(0, priceDropBonus + titleScore + marginHint + (seed % 25)));

  const composite_score = Math.min(100, Math.round(popularity_score * 0.4 + ai_team_score * 0.6));

  return { popularity_score, ai_team_score, composite_score };
}

/**
 * 제휴 상품 목록에 점수 부여 후 composite_score 내림차순 정렬.
 */
export function scoreAffiliateProducts(products: CommerceProduct[]): ScoredCommerceProduct[] {
  return products
    .map((p) => ({
      ...p,
      promo_scores: scoreAffiliateProduct(p),
    }))
    .sort((a, b) => b.promo_scores.composite_score - a.promo_scores.composite_score);
}

/**
 * 점수 부여된 목록에서 min_score 이상만 필터링해 shortlist 반환.
 */
export function filterPromoShortlist(
  scored: ScoredCommerceProduct[],
  minCompositeScore: number = 0
): ScoredCommerceProduct[] {
  return scored.filter((p) => p.promo_scores.composite_score >= minCompositeScore);
}
