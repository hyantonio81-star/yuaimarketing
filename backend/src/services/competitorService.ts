export interface TrackingItem {
  label: string;
  tool: string;
}

export interface Algorithm {
  name: string;
  description: string;
}

export interface AlertChannel {
  label: string;
  channel: string;
}

const AUTO_TRACKING: TrackingItem[] = [
  { label: "경쟁사 웹사이트 변경", tool: "Visualping" },
  { label: "가격 변동", tool: "Price monitoring bots" },
  { label: "신제품 출시", tool: "Product Hunt, Crunchbase" },
  { label: "채용 공고", tool: "LinkedIn, Indeed" },
  { label: "특허 출원", tool: "USPTO, EPO API" },
  { label: "광고 캠페인", tool: "Facebook Ad Library, Pathmatics" },
];

const ALGORITHMS: Algorithm[] = [
  { name: "변화 감지", description: "Diff algorithms" },
  { name: "전략 패턴 인식", description: "ML classifier" },
  { name: "경쟁 우위 기회 자동 탐지", description: "Opportunity detection" },
];

const ALERTS: AlertChannel[] = [
  { label: "중요 변화 즉시 알림", channel: "Slack/Email" },
  { label: "주간 경쟁사 리포트", channel: "PDF" },
];

export function getAutoTracking(): TrackingItem[] {
  return AUTO_TRACKING;
}

export function getAlgorithms(): Algorithm[] {
  return ALGORITHMS;
}

export function getAlerts(): AlertChannel[] {
  return ALERTS;
}
