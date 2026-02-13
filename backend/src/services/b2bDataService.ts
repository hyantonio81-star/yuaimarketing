export interface TrendSource {
  name: string;
  description: string;
}

export interface CollectionSchedule {
  frequency: string;
  time: string;
  timezone?: string;
}

export interface StorageConfig {
  database: string;
  extension: string;
  type: string;
}

const SOURCES: TrendSource[] = [
  { name: "Google Trends API", description: "실시간 검색 트렌드" },
  { name: "Statista API", description: "통계 데이터" },
  { name: "CB Insights", description: "스타트업/투자 트렌드" },
  { name: "PitchBook", description: "M&A, 펀딩 데이터" },
  { name: "UN Comtrade", description: "무역 통계" },
  { name: "World Bank Open Data", description: "경제 지표" },
];

const SCHEDULE: CollectionSchedule = {
  frequency: "일일 1회",
  time: "새벽 2시",
  timezone: "Asia/Seoul",
};

const STORAGE: StorageConfig = {
  database: "PostgreSQL",
  extension: "TimescaleDB",
  type: "시계열",
};

export function getTrendSources(): TrendSource[] {
  return SOURCES;
}

export function getCollectionSchedule(): CollectionSchedule {
  return SCHEDULE;
}

export function getStorageConfig(): StorageConfig {
  return STORAGE;
}
