/**
 * 쉬인 제휴 포털 데이터 피드 (CSV/XML) 수집.
 * SHEIN_AFFILIATE_FEED_URL 환경 변수 또는 설정으로 피드 URL 지정.
 * 승인된 파트너만 접근 가능.
 */

import type { ProductRssItem } from "./types.js";
import type { CommerceProduct } from "../threadsCommerce/types.js";

const FEED_URL = (process.env.SHEIN_AFFILIATE_FEED_URL ?? "").trim();

export interface SheinAffiliateRow {
  name?: string;
  title?: string;
  product_name?: string;
  price?: string;
  sale_price?: string;
  original_price?: string;
  link?: string;
  url?: string;
  product_url?: string;
  image?: string;
  image_url?: string;
  img?: string;
  category?: string;
  id?: string;
  sku?: string;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === "," && !inQuotes) || c === "\t") {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

function csvToRows(csvText: string): SheinAffiliateRow[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const rows: SheinAffiliateRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    header.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row as unknown as SheinAffiliateRow);
  }
  return rows;
}

function rowToProductRssItem(row: SheinAffiliateRow, index: number): ProductRssItem {
  const title = row.name ?? row.title ?? row.product_name ?? "Product";
  const url = row.link ?? row.url ?? row.product_url ?? "";
  const imageUrl = row.image ?? row.image_url ?? row.img ?? "https://via.placeholder.com/400?text=Shein";
  const priceStr = row.sale_price ?? row.price ?? row.original_price ?? "";
  const price = priceStr ? parseFloat(priceStr.replace(/[^0-9.]/g, "")) : undefined;
  const id = row.id ?? row.sku ?? `shein_aff_${Date.now()}_${index}`;
  return {
    id: String(id).slice(0, 64),
    title: title.trim().slice(0, 256),
    url: url.trim(),
    imageUrl: imageUrl.trim(),
    category: (row.category ?? "Fashion").slice(0, 64),
    price,
    collectedAt: new Date().toISOString(),
    marketplace: "shein",
    source: "shein_affiliate",
  };
}

/**
 * 쉬인 제휴 피드에서 상품 목록 수집. URL이 없으면 빈 배열 또는 스텁 1건 반환.
 */
export async function fetchSheinAffiliateProducts(
  options: { feedUrl?: string; limit?: number } = {}
): Promise<ProductRssItem[]> {
  const url = options.feedUrl ?? FEED_URL;
  const limit = Math.min(50, Math.max(1, options.limit ?? 10));

  if (!url) {
    // 스텁 1건 반환해 파이프라인 테스트 가능
    return [
      {
        id: `shein_aff_stub_${Date.now()}`,
        title: "Shein Affiliate Feed (configure SHEIN_AFFILIATE_FEED_URL)",
        url: "https://www.shein.com",
        imageUrl: "https://via.placeholder.com/400?text=Shein",
        category: "Fashion",
        collectedAt: new Date().toISOString(),
        marketplace: "shein",
        source: "stub",
      },
    ];
  }

  try {
    const res = await fetch(url, { headers: { "User-Agent": "YuantO-ContentAutomation/1.0" }, signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    const isXml = text.trimStart().startsWith("<?xml") || text.trimStart().startsWith("<");
    let rows: SheinAffiliateRow[] = [];

    if (isXml) {
      // 간단 XML 파싱: <item> 또는 <product> 등
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>|<product[^>]*>([\s\S]*?)<\/product>/gi;
      const nameRegex = /<name[^>]*>([^<]+)<\/name>|<title[^>]*>([^<]+)<\/title>|<product_name[^>]*>([^<]+)<\/product_name>/i;
      const linkRegex = /<link[^>]*>([^<]+)<\/link>|<url[^>]*>([^<]+)<\/url>|<product_url[^>]*>([^<]+)<\/product_url>/i;
      const imgRegex = /<image[^>]*>([^<]+)<\/image>|<image_url[^>]*>([^<]+)<\/image_url>|<img[^>]*>([^<]+)<\/img>|src="([^"]+)"/i;
      const priceRegex = /<price[^>]*>([^<]+)<\/price>|<sale_price[^>]*>([^<]+)<\/sale_price>/i;
      let m: RegExpExecArray | null;
      while ((m = itemRegex.exec(text)) !== null) {
        const block = (m[1] ?? m[2] ?? "");
        rows.push({
          name: (nameRegex.exec(block) ?? [])[1]?.trim(),
          link: (linkRegex.exec(block) ?? [])[1]?.trim(),
          image_url: (imgRegex.exec(block) ?? [])[1]?.trim(),
          sale_price: (priceRegex.exec(block) ?? [])[1]?.trim(),
        });
      }
    } else {
      rows = csvToRows(text);
    }

    return rows.slice(0, limit).map((r, i) => rowToProductRssItem(r, i));
  } catch {
    return [
      {
        id: `shein_aff_err_${Date.now()}`,
        title: "Shein Affiliate (feed error)",
        url: "https://www.shein.com",
        imageUrl: "https://via.placeholder.com/400?text=Shein",
        category: "Fashion",
        collectedAt: new Date().toISOString(),
        marketplace: "shein",
        source: "stub",
      },
    ];
  }
}

/** CommerceProduct 호환 형태로 변환 */
export function sheinAffiliateToCommerceProduct(item: ProductRssItem): CommerceProduct {
  return {
    id: item.id,
    title: item.title,
    url: item.url,
    imageUrl: item.imageUrl,
    category: item.category,
    price: item.price,
    priceDropPercent: item.priceDropPercent,
    marketplace: "shein",
    collectedAt: item.collectedAt,
    source: item.source,
  };
}
