/**
 * generate_recommendations: 협업 필터링 + 콘텐츠 기반 + 트렌딩 앙상블 → 개인화 피치(상위 5건)
 */

export interface RecommendationCustomer {
  id: string;
  order_history?: string[];
  favorite_category?: string;
}

export interface RecommendationProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  message?: string;
}

const PRODUCTS: RecommendationProduct[] = [
  { id: "P001", name: "무선 이어폰", category: "electronics", price: 89000 },
  { id: "P002", name: "스탠딩 데스크", category: "furniture", price: 189000 },
  { id: "P003", name: "보충제 세트", category: "health", price: 45000 },
  { id: "P004", name: "블루투스 스피커", category: "electronics", price: 65000 },
  { id: "P005", name: "요가 매트", category: "sports", price: 32000 },
  { id: "P006", name: "스마트워치", category: "electronics", price: 299000 },
  { id: "P007", name: "커피 그라인더", category: "lifestyle", price: 78000 },
  { id: "P008", name: "책상 정리함", category: "furniture", price: 25000 },
  { id: "P009", name: "비타민D", category: "health", price: 22000 },
  { id: "P010", name: "러닝화", category: "sports", price: 129000 },
];

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function findSimilarCustomers(customer: RecommendationCustomer): string[] {
  return ["C101", "C102", "C103", "C104", "C105"].slice(0, 3 + (simpleHash(customer.id) % 3));
}

function getPopularAmongSimilar(_similarCustomerIds: string[]): RecommendationProduct[] {
  return [PRODUCTS[0], PRODUCTS[1], PRODUCTS[5], PRODUCTS[3], PRODUCTS[6]].map((p) => ({ ...p }));
}

function findSimilarProducts(pastPurchases: string[]): RecommendationProduct[] {
  if (!pastPurchases?.length) return [PRODUCTS[2], PRODUCTS[4], PRODUCTS[8]].map((p) => ({ ...p }));
  const idx = simpleHash(pastPurchases.join(",")) % PRODUCTS.length;
  return [PRODUCTS[idx % PRODUCTS.length], PRODUCTS[(idx + 2) % PRODUCTS.length], PRODUCTS[(idx + 4) % PRODUCTS.length]].map(
    (p) => ({ ...p })
  );
}

function getTrendingProducts(timeframe: string, category?: string): RecommendationProduct[] {
  const filtered = category
    ? PRODUCTS.filter((p) => p.category === category)
    : PRODUCTS;
  const start = simpleHash(timeframe + (category ?? "")) % Math.max(1, filtered.length);
  return [filtered[start % filtered.length], filtered[(start + 1) % filtered.length], filtered[(start + 2) % filtered.length]].map(
    (p) => ({ ...p })
  );
}

function combineRecommendations(
  collaborative: RecommendationProduct[],
  content_based: RecommendationProduct[],
  trending: RecommendationProduct[],
  weights: number[]
): RecommendationProduct[] {
  const score = new Map<string, { product: RecommendationProduct; s: number }>();
  const add = (list: RecommendationProduct[], w: number) => {
    list.forEach((p, i) => {
      const key = p.id;
      const existing = score.get(key);
      const inc = w * (1 - i * 0.1);
      if (existing) {
        existing.s += inc;
      } else {
        score.set(key, { product: { ...p }, s: inc });
      }
    });
  };
  add(collaborative, weights[0]);
  add(content_based, weights[1]);
  add(trending, weights[2]);
  return Array.from(score.values())
    .sort((a, b) => b.s - a.s)
    .map((x) => x.product);
}

function gpt4GeneratePitch(
  product: RecommendationProduct,
  customer: RecommendationCustomer,
  context: string
): string {
  const cat = product.category === "electronics" ? "전자" : product.category === "health" ? "건강" : product.category === "sports" ? "스포츠" : "라이프";
  return `${customer.id}님, ${cat} 카테고리 인기 상품입니다. ${product.name} — 지금 만나보세요. (${context})`;
}

export function generateRecommendations(
  customer: RecommendationCustomer,
  context: string = "email"
): RecommendationProduct[] {
  const similarCustomers = findSimilarCustomers(customer);
  const collaborativeRecs = getPopularAmongSimilar(similarCustomers);
  const pastPurchases = customer.order_history ?? [];
  const contentRecs = findSimilarProducts(pastPurchases);
  const trending = getTrendingProducts("last_7_days", customer.favorite_category);
  const recommendations = combineRecommendations(
    collaborativeRecs,
    contentRecs,
    trending,
    [0.5, 0.3, 0.2]
  );
  const top5 = recommendations.slice(0, 5);
  for (const product of top5) {
    product.message = gpt4GeneratePitch(product, customer, context);
  }
  return recommendations;
}
