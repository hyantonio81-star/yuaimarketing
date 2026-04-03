/**
 * dr-products.json 공유 스토어. 랜딩 Tienda 및 콘텐츠 자동화 파이프라인 연동용.
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getLocalDataDir } from "./localDataDir.js";
import type { CommerceProduct } from "../services/threadsCommerce/types.js";

export interface DrProduct {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  images?: string[];
  category: string;
  origin: string;
  stock_quantity: number;
  is_visible: boolean;
  partner?: string;
  contact_whatsapp?: string;
  contact_email?: string;
  created_at: string;
  updated_at: string;
}

const DATA_PATH = join(getLocalDataDir(), "dr-products.json");

export async function loadProducts(): Promise<DrProduct[]> {
  try {
    const raw = await readFile(DATA_PATH, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function saveProducts(products: DrProduct[]): Promise<void> {
  const dir = join(DATA_PATH, "..");
  if (!existsSync(dir)) {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(dir, { recursive: true });
  }
  await writeFile(DATA_PATH, JSON.stringify(products, null, 2), "utf-8");
}

export function sanitizeSlug(s: string): string {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

/**
 * CommerceProduct(제휴/RSS/마켓플레이스)를 DrProduct로 변환하여 1건 추가.
 * slug 중복 시 추가하지 않고 null 반환.
 */
export async function appendFromCommerce(commerce: CommerceProduct): Promise<DrProduct | null> {
  const slug = sanitizeSlug(commerce.id || commerce.title || "");
  if (!slug) return null;
  const products = await loadProducts();
  if (products.some((p) => p.slug === slug)) return null;
  const id = `dr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const product: DrProduct = {
    id,
    slug,
    title: String(commerce.title ?? "").trim() || "Untitled",
    description: "",
    price: Number(commerce.price) || 0,
    currency: "USD",
    image: String(commerce.imageUrl ?? "").trim(),
    category: String(commerce.category ?? "").trim(),
    origin: "Affiliate",
    stock_quantity: 0,
    is_visible: true,
    partner: commerce.marketplace,
    created_at: now,
    updated_at: now,
  };
  products.push(product);
  await saveProducts(products);
  return product;
}
