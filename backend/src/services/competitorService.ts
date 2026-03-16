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

// --- 추적 경쟁사 (조직·국가 스코프) ---

export type TrackingType = "website" | "price" | "product" | "hiring" | "patent" | "ads";

export interface Competitor {
  id: string;
  name: string;
  url?: string;
  country_code: string;
  tracking_types: TrackingType[];
  added_at: string;
}

const competitorStore = new Map<string, Competitor[]>();

function storeKey(orgId: string, countryCode: string): string {
  return `${orgId}:${countryCode || "ALL"}`;
}

// --- 관심 스코프 (국가·업계·제품) — needs 파악 및 학습/추적용 ---

export interface TrackingProfile {
  country_code: string;
  industries: string[];
  product_focus: string[];
  /** 추가로 볼 국가 (해외 지사·다국가 사용자) */
  additional_countries: string[];
  updated_at: string;
}

const trackingProfileStore = new Map<string, TrackingProfile>();

export const INDUSTRY_OPTIONS: { id: string; label_ko: string; label_en: string; label_es: string }[] = [
  { id: "manufacturing", label_ko: "제조", label_en: "Manufacturing", label_es: "Manufactura" },
  { id: "trading", label_ko: "무역·유통", label_en: "Trading & distribution", label_es: "Comercio y distribución" },
  { id: "electronics", label_ko: "전자·IT", label_en: "Electronics & IT", label_es: "Electrónica e IT" },
  { id: "consumer_goods", label_ko: "소비재", label_en: "Consumer goods", label_es: "Bienes de consumo" },
  { id: "food_beverage", label_ko: "식품·음료", label_en: "Food & beverage", label_es: "Alimentos y bebidas" },
  { id: "healthcare", label_ko: "헬스케어", label_en: "Healthcare", label_es: "Salud" },
  { id: "automotive", label_ko: "자동차·부품", label_en: "Automotive & parts", label_es: "Automoción y piezas" },
  { id: "chemical", label_ko: "화학·소재", label_en: "Chemicals & materials", label_es: "Químicos y materiales" },
  { id: "services", label_ko: "서비스", label_en: "Services", label_es: "Servicios" },
  { id: "retail", label_ko: "리테일", label_en: "Retail", label_es: "Retail" },
  { id: "other", label_ko: "기타", label_en: "Other", label_es: "Otro" },
];

export function getIndustryOptions(lang: "ko" | "en" | "es" = "ko"): { id: string; label: string }[] {
  const key = lang === "es" ? "label_es" : lang === "en" ? "label_en" : "label_ko";
  return INDUSTRY_OPTIONS.map((o) => ({ id: o.id, label: o[key] }));
}

export function getTrackingProfile(orgId: string, countryCode: string): TrackingProfile | null {
  const key = storeKey(orgId, countryCode);
  return trackingProfileStore.get(key) ?? null;
}

export function setTrackingProfile(
  orgId: string,
  countryCode: string,
  payload: { industries?: string[]; product_focus?: string[]; additional_countries?: string[] }
): TrackingProfile {
  const key = storeKey(orgId, countryCode);
  const current = getTrackingProfile(orgId, countryCode);
  const now = new Date().toISOString();
  const industries = Array.isArray(payload.industries)
    ? payload.industries.filter((i) => typeof i === "string" && i.trim()).slice(0, 20)
    : current?.industries ?? [];
  const product_focus = Array.isArray(payload.product_focus)
    ? payload.product_focus.filter((p) => typeof p === "string").map((p) => String(p).slice(0, 200)).slice(0, 30)
    : current?.product_focus ?? [];
  const additional_countries = Array.isArray(payload.additional_countries)
    ? payload.additional_countries.filter((c) => typeof c === "string" && c.length === 2).slice(0, 20)
    : current?.additional_countries ?? [];
  const profile: TrackingProfile = {
    country_code: countryCode || "ALL",
    industries,
    product_focus,
    additional_countries,
    updated_at: now,
  };
  trackingProfileStore.set(key, profile);
  return profile;
}

export function getCompetitors(orgId: string, countryCode: string): Competitor[] {
  const key = storeKey(orgId, countryCode);
  return competitorStore.get(key) ?? [];
}

export function addCompetitor(
  orgId: string,
  countryCode: string,
  payload: { name: string; url?: string; tracking_types?: TrackingType[] }
): Competitor {
  const key = storeKey(orgId, countryCode);
  const list = competitorStore.get(key) ?? [];
  const id = `comp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const competitor: Competitor = {
    id,
    name: String(payload.name).slice(0, 200),
    url: payload.url ? String(payload.url).slice(0, 500) : undefined,
    country_code: countryCode || "ALL",
    tracking_types: Array.isArray(payload.tracking_types) ? payload.tracking_types : [],
    added_at: new Date().toISOString(),
  };
  list.push(competitor);
  competitorStore.set(key, list);
  return competitor;
}

export function deleteCompetitor(orgId: string, countryCode: string, competitorId: string): boolean {
  const key = storeKey(orgId, countryCode);
  const list = competitorStore.get(key) ?? [];
  const idx = list.findIndex((c) => c.id === competitorId);
  if (idx === -1) return false;
  list.splice(idx, 1);
  competitorStore.set(key, list);
  return true;
}

// --- 최근 알림/이벤트 (스텁) ---

export type EventType = "website" | "price" | "product" | "hiring" | "patent" | "ads";

export interface CompetitorEvent {
  id: string;
  competitor_id: string;
  competitor_name: string;
  type: EventType;
  title: string;
  summary: string;
  source: string;
  occurred_at: string;
  url?: string;
}

function buildStubEvents(orgId: string, countryCode: string, limit: number): CompetitorEvent[] {
  const base = new Date();
  const events: CompetitorEvent[] = [
    { id: "ev1", competitor_id: "stub1", competitor_name: "Sample Competitor A", type: "website", title: "홈페이지 메인 배너 변경", summary: "메인 페이지 히어로 섹션 문구 및 CTA 버튼이 변경되었습니다.", source: "Visualping", occurred_at: new Date(base.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), url: "https://example.com" },
    { id: "ev2", competitor_id: "stub2", competitor_name: "Sample Competitor B", type: "price", title: "주요 상품 가격 인하", summary: "베스트셀러 3종 가격이 약 5% 인하되었습니다.", source: "Price monitoring", occurred_at: new Date(base.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "ev3", competitor_id: "stub3", competitor_name: "Sample Competitor C", type: "hiring", title: "R&D 채용 공고 등록", summary: "선행 개발 포지션 신규 채용이 LinkedIn에 등록되었습니다.", source: "LinkedIn", occurred_at: new Date(base.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "ev4", competitor_id: "stub1", competitor_name: "Sample Competitor A", type: "product", title: "신제품 라인업 공개", summary: "제품 페이지에 2025 봄 라인업이 추가되었습니다.", source: "Product Hunt", occurred_at: new Date(base.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "ev5", competitor_id: "stub2", competitor_name: "Sample Competitor B", type: "ads", title: "신규 광고 캠페인 감지", summary: "Facebook Ad Library에서 새 캠페인이 확인되었습니다.", source: "Facebook Ad Library", occurred_at: new Date(base.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString() },
  ];
  return events.slice(0, Math.max(1, limit));
}

export function getCompetitorEvents(orgId: string, countryCode: string, limit = 20): CompetitorEvent[] {
  return buildStubEvents(orgId, countryCode, limit);
}

// --- 리포트 (1회 / 주간 / 월간 동향) ---

export type ReportSchedule = "once" | "weekly" | "monthly";

export interface CompetitorReport {
  id: string;
  period: string;
  schedule: ReportSchedule;
  generated_at: string;
  download_url: string | null;
  status: "completed" | "pending" | "failed";
}

const reportStore = new Map<string, CompetitorReport[]>();

function reportStoreKey(orgId: string, countryCode: string): string {
  return `${orgId}:${countryCode || "ALL"}`;
}

export function getCompetitorReports(orgId: string, countryCode: string): CompetitorReport[] {
  const key = reportStoreKey(orgId, countryCode);
  const list = reportStore.get(key) ?? [];
  return list
    .slice()
    .map((r) => ({ ...r, schedule: (r as CompetitorReport & { schedule?: ReportSchedule }).schedule ?? "once" as ReportSchedule }))
    .sort((a, b) => b.generated_at.localeCompare(a.generated_at));
}

const VALID_SCHEDULES: ReportSchedule[] = ["once", "weekly", "monthly"];

export function generateCompetitorReport(
  orgId: string,
  countryCode: string,
  options?: { schedule?: ReportSchedule }
): CompetitorReport {
  const key = reportStoreKey(orgId, countryCode);
  const list = reportStore.get(key) ?? [];
  const now = new Date();
  const schedule: ReportSchedule =
    options?.schedule && VALID_SCHEDULES.includes(options.schedule) ? options.schedule : "once";
  const period =
    schedule === "monthly"
      ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      : `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7)}`;
  const id = `rep_${Date.now()}`;
  const report: CompetitorReport = {
    id,
    period,
    schedule,
    generated_at: now.toISOString(),
    download_url: null,
    status: "pending",
  };
  list.push(report);
  reportStore.set(key, list);
  return report;
}

// --- 알림 수신 설정 (Email / Slack / WhatsApp 등) ---

export type AlertChannelType = "email" | "slack" | "whatsapp";

export interface AlertSettings {
  instant_alerts_email: boolean;
  instant_alerts_slack: boolean;
  instant_alerts_whatsapp: boolean;
  weekly_report_enabled: boolean;
  /** 주간/월간 리포트 수신 채널 (복수 선택) */
  weekly_report_channels: AlertChannelType[];
}

const defaultAlertSettings: AlertSettings = {
  instant_alerts_email: true,
  instant_alerts_slack: false,
  instant_alerts_whatsapp: false,
  weekly_report_enabled: true,
  weekly_report_channels: ["email"],
};

const alertSettingsStore = new Map<string, AlertSettings>();

function alertSettingsKey(orgId: string, countryCode: string): string {
  return `${orgId}:${countryCode || "ALL"}`;
}

export function getAlertSettings(orgId: string, countryCode: string): AlertSettings {
  const key = alertSettingsKey(orgId, countryCode);
  const stored = alertSettingsStore.get(key) as Partial<AlertSettings> & { weekly_report_channel?: string } | undefined;
  if (!stored) return { ...defaultAlertSettings };
  const base = { ...defaultAlertSettings, ...stored };
  if (!base.weekly_report_channels && (stored as { weekly_report_channel?: string }).weekly_report_channel) {
    const ch = (stored as { weekly_report_channel: string }).weekly_report_channel;
    base.weekly_report_channels = ch === "both" ? ["email", "slack"] : ch === "slack" ? ["slack"] : ["email"];
  }
  if (base.instant_alerts_whatsapp === undefined) base.instant_alerts_whatsapp = false;
  return base as AlertSettings;
}

const VALID_CHANNELS: AlertChannelType[] = ["email", "slack", "whatsapp"];

function sanitizeChannels(arr: unknown): AlertChannelType[] {
  if (!Array.isArray(arr)) return defaultAlertSettings.weekly_report_channels;
  return arr.filter((c): c is AlertChannelType => typeof c === "string" && VALID_CHANNELS.includes(c as AlertChannelType));
}

export function setAlertSettings(orgId: string, countryCode: string, settings: Partial<AlertSettings>): AlertSettings {
  const key = alertSettingsKey(orgId, countryCode);
  const current = getAlertSettings(orgId, countryCode);
  const weekly_report_channels = settings.weekly_report_channels !== undefined
    ? sanitizeChannels(settings.weekly_report_channels)
    : current.weekly_report_channels;
  const next: AlertSettings = {
    instant_alerts_email: settings.instant_alerts_email ?? current.instant_alerts_email,
    instant_alerts_slack: settings.instant_alerts_slack ?? current.instant_alerts_slack,
    instant_alerts_whatsapp: settings.instant_alerts_whatsapp ?? current.instant_alerts_whatsapp,
    weekly_report_enabled: settings.weekly_report_enabled ?? current.weekly_report_enabled,
    weekly_report_channels: weekly_report_channels.length ? weekly_report_channels : ["email"],
  };
  alertSettingsStore.set(key, next);
  return next;
}
