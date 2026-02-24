/**
 * B2B INDEX 뷰어: PMI, 운임 지수, 원자재·상품 지수, 경제 요약
 * 실데이터 연동 시 외부 API(ISM PMI, Baltic Exchange, SCFI, LME 등)로 교체 가능
 */

export interface PmiItem {
  country_code: string;
  country_name: string;
  manufacturing: number;
  services: number;
  trend: "expansion" | "contraction" | "neutral";
  updated_at: string;
}

export interface FreightIndexItem {
  id: string;
  name: string;
  value: number;
  unit: string;
  change_pct: number;
  description: string;
  updated_at: string;
}

export interface CommodityIndexItem {
  id: string;
  name: string;
  value: number;
  unit: string;
  change_pct: number;
  sector_hint: string;
  updated_at: string;
}

export interface EconomicSummaryItem {
  country_code: string;
  country_name: string;
  gdp_growth_yoy?: number;
  trade_balance_billion?: number;
  note?: string;
}

export interface B2bIndexViewerData {
  pmi: PmiItem[];
  freight: FreightIndexItem[];
  commodity: CommodityIndexItem[];
  economic_summary: EconomicSummaryItem[];
  as_of: string;
}

/** PMI: 50 초과 확장, 50 미만 위축. 스텁 데이터 */
function getPmiStub(): PmiItem[] {
  const now = new Date().toISOString().slice(0, 10);
  return [
    { country_code: "US", country_name: "미국", manufacturing: 52.3, services: 55.1, trend: "expansion", updated_at: now },
    { country_code: "DE", country_name: "독일", manufacturing: 48.2, services: 51.0, trend: "contraction", updated_at: now },
    { country_code: "JP", country_name: "일본", manufacturing: 49.8, services: 52.2, trend: "neutral", updated_at: now },
    { country_code: "CN", country_name: "중국", manufacturing: 50.5, services: 50.8, trend: "expansion", updated_at: now },
    { country_code: "KR", country_name: "한국", manufacturing: 49.5, services: 51.2, trend: "neutral", updated_at: now },
    { country_code: "VN", country_name: "베트남", manufacturing: 51.8, services: 53.0, trend: "expansion", updated_at: now },
    { country_code: "IN", country_name: "인도", manufacturing: 56.2, services: 58.1, trend: "expansion", updated_at: now },
    { country_code: "AE", country_name: "UAE", manufacturing: 55.0, services: 56.5, trend: "expansion", updated_at: now },
    { country_code: "MX", country_name: "멕시코", manufacturing: 52.1, services: 53.4, trend: "expansion", updated_at: now },
    { country_code: "BR", country_name: "브라질", manufacturing: 48.8, services: 50.2, trend: "contraction", updated_at: now },
  ];
}

/** 운임 지수: BDI, SCFI 등. 스텁 */
function getFreightStub(): FreightIndexItem[] {
  const now = new Date().toISOString().slice(0, 10);
  return [
    { id: "bdi", name: "Baltic Dry Index (BDI)", value: 1842, unit: "pts", change_pct: 2.3, description: "산재선 운임·수요 지표", updated_at: now },
    { id: "scfi", name: "Shanghai Containerized Freight Index (SCFI)", value: 1124, unit: "pts", change_pct: -1.2, description: "컨테이너 운임 (아시아→유럽 등)", updated_at: now },
    { id: "wci", name: "World Container Index (WCI)", value: 2841, unit: "USD/FEU", change_pct: 0.8, description: "종합 컨테이너 운임", updated_at: now },
    { id: "fbx", name: "Freightos Baltic Index (FBX)", value: 2456, unit: "USD/FEU", change_pct: -0.5, description: "글로벌 컨테이너 운임", updated_at: now },
  ];
}

/** 원자재·상품 지수. 스텁 */
function getCommodityStub(): CommodityIndexItem[] {
  const now = new Date().toISOString().slice(0, 10);
  return [
    { id: "steel_hrc", name: "열연코일 (HRC)", value: 582, unit: "USD/t", change_pct: -1.5, sector_hint: "steel", updated_at: now },
    { id: "copper", name: "구리 (LME)", value: 9420, unit: "USD/t", change_pct: 1.2, sector_hint: "raw_materials", updated_at: now },
    { id: "aluminum", name: "알루미늄 (LME)", value: 2480, unit: "USD/t", change_pct: 0.3, sector_hint: "raw_materials", updated_at: now },
    { id: "wheat", name: "밀 (시카고)", value: 568, unit: "USD/bu", change_pct: -2.1, sector_hint: "fruits_agri", updated_at: now },
    { id: "crude", name: "WTI 원유", value: 72.5, unit: "USD/bbl", change_pct: 0.8, sector_hint: "raw_materials", updated_at: now },
    { id: "rubber", name: "천연고무", value: 158, unit: "USD/100kg", change_pct: -0.6, sector_hint: "raw_materials", updated_at: now },
  ];
}

/** 경제 요약: GDP 성장률, 무역수지 등. 스텁 */
function getEconomicSummaryStub(): EconomicSummaryItem[] {
  return [
    { country_code: "US", country_name: "미국", gdp_growth_yoy: 2.5, trade_balance_billion: -98.5, note: "소비·고용 양호" },
    { country_code: "DE", country_name: "독일", gdp_growth_yoy: 0.2, trade_balance_billion: 248.0, note: "수출 주도" },
    { country_code: "CN", country_name: "중국", gdp_growth_yoy: 5.0, trade_balance_billion: 823.0, note: "무역 흑자 확대" },
    { country_code: "JP", country_name: "일본", gdp_growth_yoy: 1.2, trade_balance_billion: -12.0, note: "엔저 수출 호조" },
    { country_code: "KR", country_name: "한국", gdp_growth_yoy: 2.4, trade_balance_billion: 44.5, note: "반도체·자동차" },
    { country_code: "VN", country_name: "베트남", gdp_growth_yoy: 5.8, trade_balance_billion: 28.0, note: "생산 이전·FDI" },
    { country_code: "AE", country_name: "UAE", gdp_growth_yoy: 3.4, trade_balance_billion: 82.0, note: "에너지·물류 허브" },
    { country_code: "MX", country_name: "멕시코", gdp_growth_yoy: 3.2, trade_balance_billion: -18.0, note: "미국 근접 생산" },
  ];
}

export function getB2bIndexViewerData(countryCode?: string): B2bIndexViewerData {
  const asOf = new Date().toISOString().slice(0, 19).replace("T", " ");
  let pmi = getPmiStub();
  const economicSummary = getEconomicSummaryStub();

  if (countryCode) {
    const code = countryCode.toUpperCase().slice(0, 2);
    pmi = pmi.filter((p) => p.country_code === code);
  }

  return {
    pmi,
    freight: getFreightStub(),
    commodity: getCommodityStub(),
    economic_summary: economicSummary,
    as_of: asOf,
  };
}
