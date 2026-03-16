/**
 * 상품 이미지 URL 처리. 실제 연동 시 Cloudinary/Google Drive 업로드 후 공개 URL 반환.
 * Shein: URL 정규식으로 고해상도 옵션 추출.
 */

import type { ProductRssItem } from "./types.js";

export interface ImageResult {
  imageUrl: string;
  alt?: string;
  stored?: boolean; // true when uploaded to Drive/Cloudinary
}

/** Shein 이미지 URL을 고해상도용으로 정규화 (쿼리/경로 패턴 치환) */
export function normalizeSheinImageUrl(url: string): string {
  if (!url || !url.includes("shein") && !url.includes("sheincdn")) return url;
  // Shein CDN: 크기 파라미터 제거 또는 고해상도로 치환 (예: _220x220_ -> _1000x1000_)
  let out = url.replace(/_(\d{2,4})x(\d{2,4})_/gi, "_1000x1000_");
  out = out.replace(/thumbnail=\d+/i, "thumbnail=1000");
  out = out.replace(/width=\d+/i, "width=1000");
  out = out.replace(/height=\d+/i, "height=1000");
  return out;
}

/**
 * 상품 이미지 URL 반환. marketplace가 shein이면 고해상도로 정규화.
 * Phase 4: 다운로드 → 리사이즈/최적화 → Drive 또는 Cloudinary 업로드 후 URL 반환.
 */
export function prepareProductImageForPost(
  product: { imageUrl: string; title?: string; marketplace?: string } | ProductRssItem
): ImageResult {
  let imageUrl = product.imageUrl?.trim() || "https://via.placeholder.com/800x800?text=Product";
  const marketplace = (product as { marketplace?: string }).marketplace;
  if (marketplace === "shein") {
    imageUrl = normalizeSheinImageUrl(imageUrl);
  }
  return { imageUrl, alt: (product.title ?? "Product").slice(0, 100), stored: false };
}
