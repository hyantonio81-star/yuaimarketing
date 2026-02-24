/**
 * 무역 시장성 점수: 수출국 → 수입국, 아이템/HS 기준 시장 도입 가능성 점수 + 간략 리뷰
 */

import { getCountryB2BMetadata, getSectorFromHsCode, type B2BSector } from "../data/b2bRegionMetadata.js";

export interface TradeScoreBreakdown {
  category: string;
  score: number;
  max_points: number;
  detail: string;
}

export interface TradeMarketScoreResult {
  origin_country: string;
  destination_country: string;
  item_or_hs: string;
  sector: string | null;
  total_score: number;
  breakdown: TradeScoreBreakdown[];
  /** 간략한 리뷰 (2~4문장) */
  review: string;
  recommendation: "recommended" | "neutral" | "cautious";
}

function simpleHash(str: string, seed = 0): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function scoreFtaAndTariff(origin: string, destination: string): { score: number; detail: string } {
  const destMeta = getCountryB2BMetadata(destination);
  const fta = destMeta?.fta_with_kr ?? false;
  const h = simpleHash(origin + destination) % 100;
  const tariffLevel = fta ? 2 + (h % 5) : 8 + (h % 10); // 0~25 점: FTA면 높게
  const score = fta ? 20 + Math.floor((100 - tariffLevel) / 4) : Math.max(0, 18 - tariffLevel);
  const detail = fta
    ? "한·FTA 또는 양자 협정 적용 가능. 관세 부담 낮음."
    : `양자 FTA 미체결. 추정 관세 수준 ${tariffLevel}% 전후.`;
  return { score: Math.min(25, Math.max(0, score)), detail };
}

function scoreDemandFit(destination: string, item: string): { score: number; detail: string } {
  const meta = getCountryB2BMetadata(destination);
  const h = simpleHash(destination + item) % 100;
  const base = meta?.key_industries?.length ? 12 : 8;
  const score = Math.min(20, base + Math.floor(h / 8));
  const detail = meta?.key_industries?.length
    ? `수입국 대표 산업과 연관. 수요 적합성 ${score}/20.`
    : "수입국 산업 데이터 기준 수요 적합성 중간.";
  return { score, detail };
}

function scoreLogistics(origin: string, destination: string): { score: number; detail: string } {
  const meta = getCountryB2BMetadata(destination);
  const diff = meta?.logistics_difficulty ?? "medium";
  const base = diff === "low" ? 18 : diff === "medium" ? 14 : 8;
  const h = simpleHash(origin + destination + "log") % 20;
  const score = Math.min(20, base + (h % 5));
  const detail = `물류 난이도: ${diff}. ${origin}→${destination} 구간 운송·통관 리스크 반영.`;
  return { score, detail };
}

function scoreSectorFit(destination: string, sector: B2BSector | null): { score: number; detail: string } {
  if (!sector) return { score: 10, detail: "HS/아이템 기준 산업 분류 없음. 중간 가정." };
  const meta = getCountryB2BMetadata(destination);
  const match = meta?.key_industries?.includes(sector) ?? false;
  const score = match ? 18 + (simpleHash(destination + sector) % 3) : 6 + (simpleHash(destination + sector) % 6);
  const detail = match
    ? `수입국 핵심 산업(${sector})과 일치. 시장 도입 적합성 높음.`
    : `수입국 대표 산업과 ${sector} 연관성 보통.`;
  return { score: Math.min(20, score), detail };
}

function scoreRegulationAndEntry(destination: string, item: string): { score: number; detail: string } {
  const meta = getCountryB2BMetadata(destination);
  const note = meta?.note ?? "";
  const strict = /FDA|FCC|규제|CE|REACH/i.test(note);
  const h = simpleHash(destination + item) % 15;
  const score = strict ? Math.max(0, 10 - h) : 10 + (h % 5);
  const detail = strict
    ? "규제·인증 요건 확인 필요. 진입 장벽 반영."
    : "규제 부담 보통. 현지 규격·인증 사전 검토 권장.";
  return { score: Math.min(15, Math.max(0, score)), detail };
}

function generateReview(
  origin: string,
  destination: string,
  item: string,
  sector: string | null,
  breakdown: TradeScoreBreakdown[],
  total: number
): { review: string; recommendation: "recommended" | "neutral" | "cautious" } {
  const ftaItem = breakdown.find((b) => b.category === "fta_tariff");
  const sectorItem = breakdown.find((b) => b.category === "sector_fit");
  const sentences: string[] = [];

  if (total >= 70) {
    sentences.push(`${origin}→${destination} 구간, '${item}' 품목의 무역 시장성 점수는 ${total}점으로 시장 도입 가능성이 높습니다.`);
    if (ftaItem && ftaItem.score >= 18) sentences.push("양자 FTA 또는 관세 우대가 적용되어 가격 경쟁력 확보에 유리합니다.");
    if (sectorItem && sectorItem.score >= 15) sentences.push("수입국 수요·산업 구조와 잘 맞아 현지 바이어 매칭을 적극 추천합니다.");
    sentences.push("물류·결제 조건만 현지 메타에 맞춰 설계하면 리스크를 줄일 수 있습니다.");
    return { review: sentences.join(" "), recommendation: "recommended" };
  }
  if (total >= 50) {
    sentences.push(`${origin}→${destination}, '${item}' 품목 무역 시장성은 ${total}점으로 보통 수준입니다.`);
    sentences.push("FTA·관세와 수입국 산업 적합성을 확인한 뒤 단계적 진출을 검토하세요.");
    sentences.push("규제·인증 요건과 물류 비용을 추가로 반영하면 의사결정에 도움이 됩니다.");
    return { review: sentences.join(" "), recommendation: "neutral" };
  }
  sentences.push(`${origin}→${destination} 구간 '${item}' 품목은 무역 시장성 ${total}점으로 신중한 접근이 필요합니다.`);
  sentences.push("관세·규제·물류 난이도가 높을 수 있으니, 현지 파트너 또는 수출진흥기관 상담 후 진출 여부를 결정하는 것을 권합니다.");
  return { review: sentences.join(" "), recommendation: "cautious" };
}

/**
 * 무역 시장성 점수 계산 (0-100) + 간략 리뷰
 * @param origin_country 수출국 코드 (예: KR)
 * @param destination_country 수입국 코드 (예: US)
 * @param item_or_hs 품목명 또는 HS 코드 (예: 8504, 전자부품)
 */
export function tradeMarketScore(
  origin_country: string,
  destination_country: string,
  item_or_hs: string
): TradeMarketScoreResult {
  const origin = (origin_country || "KR").toUpperCase().slice(0, 2);
  const dest = (destination_country || "US").toUpperCase().slice(0, 2);
  const item = (item_or_hs || "").trim() || "8504";

  const hsCode = /^\d{2,10}$/.test(item.replace(/\s/g, "")) ? item.replace(/\s/g, "").slice(0, 6) : null;
  const sector = hsCode ? getSectorFromHsCode(hsCode) : getSectorFromHsCode(item);

  const fta = scoreFtaAndTariff(origin, dest);
  const demand = scoreDemandFit(dest, item);
  const logistics = scoreLogistics(origin, dest);
  const sectorFit = scoreSectorFit(dest, sector);
  const regulation = scoreRegulationAndEntry(dest, item);

  const breakdown: TradeScoreBreakdown[] = [
    { category: "fta_tariff", score: fta.score, max_points: 25, detail: fta.detail },
    { category: "demand_fit", score: demand.score, max_points: 20, detail: demand.detail },
    { category: "logistics", score: logistics.score, max_points: 20, detail: logistics.detail },
    { category: "sector_fit", score: sectorFit.score, max_points: 20, detail: sectorFit.detail },
    { category: "regulation_entry", score: regulation.score, max_points: 15, detail: regulation.detail },
  ];

  const total_score = Math.min(100, Math.round(
    fta.score + demand.score + logistics.score + sectorFit.score + regulation.score
  ));

  const { review, recommendation } = generateReview(origin, dest, item, sector, breakdown, total_score);

  return {
    origin_country: origin,
    destination_country: dest,
    item_or_hs: item,
    sector: sector ?? null,
    total_score,
    breakdown,
    review,
    recommendation,
  };
}
