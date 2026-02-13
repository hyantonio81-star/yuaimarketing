/**
 * NEXUS Core: 4 Pillar 오케스트레이션
 * - daily_routine: 매일 자동 실행 스케줄
 * - handle_user_request: 의도 분류 → Pillar 라우팅 → 응답 포맷
 * - proactive_alerts: 시장 기회 / 재고 / 입찰 마감 / 부정 리뷰 알림
 */

export interface DailyRoutineResult {
  schedule: Record<string, string>;
  last_run?: string;
  run_results?: Record<string, { status: string; message?: string }>;
}

export interface Intent {
  category: "market_research" | "find_buyers" | "pricing" | "tender" | "other";
  confidence: number;
}

export interface HandleRequestInput {
  request: string;
  user?: { ui_style?: string };
}

export interface HandleRequestResult {
  intent: Intent;
  pillar: string;
  result: unknown;
  formatted_response: string;
}

export interface Alert {
  type: string;
  priority: string;
  message: string;
  action: string;
}

export interface ProactiveAlertsResult {
  alerts: Alert[];
  generated_at: string;
}

const DAILY_SCHEDULE: Record<string, string> = {
  "02:00": "market_intel_update",
  "03:00": "competitor_monitoring",
  "04:00": "inventory_sync",
  "05:00": "price_optimization",
  "06:00": "tender_monitoring",
  "07:00": "generate_daily_report",
  "09:00": "churn_prevention_check",
  "12:00": "midday_performance_check",
  "18:00": "eod_summary",
};

function classifyIntent(request: string): Intent {
  const r = (request || "").toLowerCase();
  if (r.includes("시장") || r.includes("market") || r.includes("리서치") || r.includes("경쟁")) {
    return { category: "market_research", confidence: 0.9 };
  }
  if (r.includes("바이어") || r.includes("buyer") || r.includes("구매자") || r.includes("매칭")) {
    return { category: "find_buyers", confidence: 0.85 };
  }
  if (r.includes("가격") || r.includes("price") || r.includes("입찰가") || r.includes("pricing")) {
    return { category: "pricing", confidence: 0.88 };
  }
  if (r.includes("입찰") || r.includes("tender") || r.includes("공고") || r.includes("제안서")) {
    return { category: "tender", confidence: 0.9 };
  }
  return { category: "other", confidence: 0.3 };
}

function formatResponse(result: unknown, _uiStyle?: string): string {
  if (typeof result === "string") return result;
  return JSON.stringify(result, null, 2);
}

export function getDailyRoutine(): DailyRoutineResult {
  return {
    schedule: DAILY_SCHEDULE,
    last_run: new Date().toISOString(),
    run_results: undefined,
  };
}

export function runDailyRoutineTask(taskKey: string): { status: string; message?: string } {
  const task = DAILY_SCHEDULE[taskKey];
  if (!task) return { status: "error", message: "Unknown task" };
  return { status: "ok", message: `Task ${task} executed (stub)` };
}

export function handleUserRequest(input: HandleRequestInput): HandleRequestResult {
  const intent = classifyIntent(input.request || "");
  let pillar = "nexus";
  let result: unknown = null;

  switch (intent.category) {
    case "market_research":
      pillar = "market_intel";
      result = { message: "Market analysis available at /market-intel", action: "process" };
      break;
    case "find_buyers":
      pillar = "b2b_trade";
      result = { message: "Use B2B Trade → Buyer Hunter / match-buyers", action: "find_buyers" };
      break;
    case "pricing":
      pillar = "b2b_trade";
      result = {
        message: "B2B/B2C pricing: use B2B landed-cost & B2C optimal-price",
        b2b: "/api/b2b/landed-cost",
        b2c: "/api/b2c/optimal-price",
      };
      break;
    case "tender":
      pillar = "gov_tender";
      result = { message: "Gov Tender: qualification, optimal-bid, generate-proposal", action: "evaluate_tender" };
      break;
    default:
      result = { message: "Request received. Specify market_research, find_buyers, pricing, or tender.", action: "clarify" };
  }

  return {
    intent,
    pillar,
    result,
    formatted_response: formatResponse(result, input.user?.ui_style),
  };
}

export function getProactiveAlerts(): ProactiveAlertsResult {
  const alerts: Alert[] = [];

  alerts.push({
    type: "opportunity",
    priority: "high",
    message: "New market opportunity: Emerging demand in APAC digital services",
    action: "Review market analysis report",
  });

  alerts.push({
    type: "inventory",
    priority: "urgent",
    message: "3 products low on stock (SKU-001, SKU-002, SKU-005)",
    action: "Reorder or adjust pricing",
  });

  alerts.push({
    type: "deadline",
    priority: "urgent",
    message: "Tender deadline in 2 days — 시스템 구축 용역",
    action: "Complete submission checklist",
  });

  alerts.push({
    type: "reputation",
    priority: "high",
    message: "Negative reviews increased this week on Coupang",
    action: "Investigate and respond",
  });

  return {
    alerts,
    generated_at: new Date().toISOString(),
  };
}
