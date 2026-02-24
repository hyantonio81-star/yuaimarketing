/**
 * match_buyers: 바이어 매칭
 * 1. 초기 필터링 (product_category, countries, import_volume_min, sector/region)
 * 2. 점수: 제품매칭(30) + 거래규모(25) + 신뢰도(20) + 지역(15) + 응답률(5) + 산업적합(5) = 100
 * 3. min_score 이상, 상위 50명
 */

import {
  getB2bCountryPool,
  getCountryB2BMetadata,
  getSectorFromHsCode,
  type B2BSector,
} from "../data/b2bRegionMetadata.js";

export interface MatchedBuyer {
  id: string;
  name: string;
  country: string;
  region?: string;
  annual_imports: number;
  match_score: number;
  score_breakdown: {
    product_match: number;
    volume: number;
    reputation: number;
    geo: number;
    response_prob: number;
    sector_fit: number;
  };
}

function simpleHash(str: string, seed: number = 0): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function queryBuyers(
  productCategory: string,
  countries: string[],
  importVolumeMin: number
): Array<{ id: string; name: string; country: string; annual_imports: number; imported_products: string[] }> {
  const count = 60;
  const buyers: Array<{ id: string; name: string; country: string; annual_imports: number; imported_products: string[] }> = [];
  const countriesFilter = countries.length > 0 ? countries : getB2bCountryPool();

  for (let i = 0; i < count; i++) {
    const h = simpleHash(productCategory + i);
    const country = countriesFilter[h % countriesFilter.length];
    const annualImports = importVolumeMin + (h % 50) * 50000 + (simpleHash(country + i) % 20) * 100000;
    buyers.push({
      id: `buyer-${i + 1}`,
      name: `Buyer ${String.fromCharCode(65 + (i % 26))} Corp ${i + 1}`,
      country,
      annual_imports: annualImports,
      imported_products: [productCategory, `HS-${(h % 99) + 1}`],
    });
  }
  return buyers.filter((b) => b.annual_imports >= importVolumeMin);
}

function calculateProductSimilarity(
  importedProducts: string[],
  product: { hs_code: string },
  buyerId: string
): number {
  if (!importedProducts?.length) return 0.5;
  const match = importedProducts.some((p) => p === product.hs_code || p.includes(product.hs_code));
  const h = simpleHash(buyerId + product.hs_code) % 100;
  return match ? 0.85 + h / 1000 : 0.3 + (h % 40) / 100;
}

function checkBuyerReputation(buyer: { id: string }): number {
  const h = simpleHash(buyer.id) % 100;
  return 0.5 + h / 100;
}

function calculateLogisticsEfficiency(origin: string, destination: string): number {
  const meta = getCountryB2BMetadata(destination);
  const base: Record<string, number> = {
    "KR-US": 0.9, "KR-DE": 0.85, "KR-JP": 0.95, "KR-VN": 0.88, "KR-CN": 0.82,
    "KR-GB": 0.87, "KR-NL": 0.86, "KR-SG": 0.92, "KR-IN": 0.75, "KR-MX": 0.78,
    "KR-AE": 0.88, "KR-SA": 0.82, "KR-PA": 0.85, "KR-GT": 0.72, "KR-BR": 0.75,
    "KR-EG": 0.78, "KR-ZA": 0.76,
  };
  const key = `${origin}-${destination}`;
  let score = base[key] ?? 0.7 + (simpleHash(key) % 20) / 100;
  if (meta?.logistics_difficulty === "high") score *= 0.95;
  if (meta?.logistics_difficulty === "low") score = Math.min(1, score * 1.05);
  return score;
}

function mlPredictResponseRate(buyerProfile: { id: string }, _outreachMethod: string): number {
  const h = simpleHash(buyerProfile.id + "response") % 100;
  return 0.2 + (h / 100) * 0.6;
}

/** 바이어 국가의 key_industries에 요청 sector가 있으면 산업적합 가산 */
function calculateSectorFit(buyerCountry: string, requestedSector: B2BSector | null): number {
  if (!requestedSector) return 2.5;
  const meta = getCountryB2BMetadata(buyerCountry);
  if (!meta?.key_industries?.length) return 2.5;
  const match = meta.key_industries.includes(requestedSector);
  return match ? 5 : 0;
}

/**
 * match_buyers
 * @param product { hs_code } or string (used as hs_code)
 * @param targetCountries 국가 코드 배열 (빈 배열이면 전체 풀)
 * @param minScore 최소 매칭 점수 (기본 70)
 * @param sector 산업 섹터 (steel, machinery, power_equipment, raw_materials, fruits_agri, electronics)
 */
export function matchBuyers(
  product: { hs_code?: string } | string,
  targetCountries: string[],
  minScore: number = 70,
  sector?: B2BSector | null
): MatchedBuyer[] {
  const hsCode = typeof product === "string" ? product : (product?.hs_code ?? "8504");
  const requestedSector = sector ?? getSectorFromHsCode(hsCode);
  const candidates = queryBuyers(hsCode, targetCountries, 10000);

  const scored: MatchedBuyer[] = candidates.map((buyer) => {
    const productMatch = calculateProductSimilarity(buyer.imported_products, { hs_code: hsCode }, buyer.id);
    const productMatchScore = Math.round(productMatch * 30 * 10) / 10;

    const volumeScore = Math.min(buyer.annual_imports / 1_000_000, 25);
    const volumeScoreR = Math.round(volumeScore * 10) / 10;

    const reputation = checkBuyerReputation(buyer);
    const reputationScore = Math.round(reputation * 20 * 10) / 10;

    const geoScore = calculateLogisticsEfficiency("KR", buyer.country);
    const geoScoreR = Math.round(geoScore * 15 * 10) / 10;

    const responseProb = mlPredictResponseRate(buyer, "email");
    const responseScore = Math.round(responseProb * 5 * 10) / 10;

    const sectorFitScore = calculateSectorFit(buyer.country, requestedSector);

    const matchScore = Math.round(
      (productMatchScore + volumeScoreR + reputationScore + geoScoreR + responseScore + sectorFitScore) * 10
    ) / 10;

    const meta = getCountryB2BMetadata(buyer.country);

    return {
      id: buyer.id,
      name: buyer.name,
      country: buyer.country,
      region: meta?.region,
      annual_imports: buyer.annual_imports,
      match_score: Math.min(100, matchScore),
      score_breakdown: {
        product_match: productMatchScore,
        volume: volumeScoreR,
        reputation: reputationScore,
        geo: geoScoreR,
        response_prob: responseScore,
        sector_fit: sectorFitScore,
      },
    };
  });

  return scored
    .filter((b) => b.match_score >= minScore)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 50);
}
