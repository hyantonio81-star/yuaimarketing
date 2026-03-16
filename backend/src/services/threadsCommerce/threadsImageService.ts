/**
 * 스레드 게시용 이미지 준비. 상품 이미지 URL 추출 또는 리사이즈.
 * Cloudinary/Canva 연동 시 여기서 처리.
 */

import type { CommerceProduct } from "./types.js";

export interface ThreadsImageResult {
  imageUrl: string;
  alt?: string;
}

/**
 * 상품 메인 이미지 URL 반환. 실제 연동 시 Cloudinary 업로드+리사이즈 가능.
 */
export function prepareProductImage(product: CommerceProduct): ThreadsImageResult {
  const imageUrl = product.imageUrl?.trim() || "https://via.placeholder.com/800x800?text=Product";
  return { imageUrl, alt: product.title?.slice(0, 100) ?? "Product" };
}
