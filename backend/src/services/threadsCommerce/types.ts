/**
 * 공통 이커머스 상품 타입. Amazon / Shein / Temu / AliExpress 소스 통일.
 */
export type MarketplaceId = "amazon" | "shein" | "temu" | "aliexpress";

export interface CommerceProduct {
  id: string; // asin or platform sku
  title: string;
  url: string;
  imageUrl: string;
  category: string;
  price?: number;
  priceDropPercent?: number;
  marketplace: MarketplaceId;
  collectedAt: string;
  /** Amazon: bestsellers | movers_shakers | stub; others: stub */
  source?: string;
}
