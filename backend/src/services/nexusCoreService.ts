/**
 * YuantO Core: 4 Pillar 오케스트레이션
 * - daily_routine: 매일 자동 실행 스케줄
 * - handle_user_request: 의도 분류 → Pillar 라우팅 → 응답 포맷
 * - proactive_alerts: 시장 기회 / 재고 / 입찰 마감 / 부정 리뷰 알림
 */

import {
  recordRoutineRunStart,
  recordRoutineRunFinish,
} from "./nexusRoutineRunsService.js";

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
  "00:00": "autonomous_shorts_production",
  "01:00": "autonomous_shorts_production",
  "02:00": "market_intel_update, autonomous_shorts_production",
  "03:00": "competitor_monitoring, autonomous_shorts_production",
  "04:00": "inventory_sync, autonomous_shorts_production",
  "05:00": "price_optimization, autonomous_shorts_production",
  "06:00": "tender_monitoring, autonomous_shorts_production",
  "07:00": "generate_daily_report, autonomous_shorts_production",
  "08:00": "autonomous_shorts_production",
  "09:00": "churn_prevention_check, autonomous_shorts_production",
  "10:00": "autonomous_shorts_production",
  "11:00": "autonomous_shorts_production",
  "12:00": "midday_performance_check, autonomous_shorts_production",
  "13:00": "autonomous_shorts_production",
  "14:00": "autonomous_shorts_production",
  "15:00": "autonomous_shorts_production",
  "16:00": "autonomous_shorts_production",
  "17:00": "autonomous_shorts_production",
  "18:00": "eod_summary, autonomous_shorts_production",
  "19:00": "autonomous_shorts_production",
  "20:00": "autonomous_shorts_production",
  "21:00": "autonomous_shorts_production",
  "22:00": "autonomous_shorts_production",
  "23:00": "autonomous_shorts_production",
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

export async function getDailyRoutineAsync(): Promise<DailyRoutineResult & { last_runs?: Record<string, { status: string; finished_at?: string; message?: string }> }> {
  const { getLastRunsPerTask } = await import("./nexusRoutineRunsService.js");
  const lastRuns = await getLastRunsPerTask();
  const last_runs: Record<string, { status: string; finished_at?: string; message?: string }> = {};
  for (const [taskTime, run] of Object.entries(lastRuns)) {
    last_runs[taskTime] = {
      status: run.status,
      finished_at: run.finished_at,
      message: run.message,
    };
  }
  return {
    schedule: DAILY_SCHEDULE,
    last_run: new Date().toISOString(),
    run_results: undefined,
    last_runs,
  };
}

export async function runDailyRoutineTask(taskKey: string): Promise<{ status: string; message?: string; details?: Record<string, unknown> }> {
  const taskValue = DAILY_SCHEDULE[taskKey];
  if (!taskValue) return { status: "error", message: "Unknown task" };

  const tasks = taskValue.split(",").map(t => t.trim());
  const runId = await recordRoutineRunStart(taskKey, taskValue);
  
  try {
    const results: any[] = [];
    
    for (const task of tasks) {
      let result: { status: string; message?: string; details?: Record<string, unknown> };
      if (task === "inventory_sync") {
        const { runB2cInventorySyncTask } = await import("./b2cRoutineTasks.js");
        const out = await runB2cInventorySyncTask();
        result = { status: out.status, message: out.message, details: out.details };
      } else if (task === "price_optimization") {
        const { runB2cPriceOptimizationTask } = await import("./b2cRoutineTasks.js");
        const out = await runB2cPriceOptimizationTask();
        result = { status: out.status, message: out.message, details: out.details };
      } else if (task === "churn_prevention_check") {
        const { runB2cChurnPreventionTask } = await import("./b2cRoutineTasks.js");
        const out = await runB2cChurnPreventionTask();
        result = { status: out.status, message: out.message, details: out.details };
      } else if (task === "market_intel_update") {
        const { runDataRefreshBatch } = await import("./nexusRoutineBatches.js");
        const out = await runDataRefreshBatch();
        result = { status: out.status, message: out.message, details: out.details };
      } else if (task === "competitor_monitoring") {
        const { runMonitoringBatch } = await import("./nexusRoutineBatches.js");
        const out = await runMonitoringBatch();
        result = { status: out.status, message: out.message, details: out.details };
      } else if (task === "tender_monitoring") {
        const { runTenderCheckBatch } = await import("./nexusRoutineBatches.js");
        const out = await runTenderCheckBatch();
        result = { status: out.status, message: out.message, details: out.details };
      } else if (task === "generate_daily_report") {
        const { runDailyReportBatch } = await import("./nexusRoutineBatches.js");
        const out = await runDailyReportBatch();
        result = { status: out.status, message: out.message, details: out.details };
      } else if (task === "midday_performance_check") {
        const { runMiddayCheckBatch } = await import("./nexusRoutineBatches.js");
        const out = await runMiddayCheckBatch();
        result = { status: out.status, message: out.message, details: out.details };
      } else if (task === "eod_summary") {
        const { runEodSummaryBatch } = await import("./nexusRoutineBatches.js");
        const out = await runEodSummaryBatch();
        result = { status: out.status, message: out.message, details: out.details };
      } else if (task === "autonomous_shorts_production") {
        const { runAutonomousShortsBatch } = await import("./nexusRoutineBatches.js");
        const out = await runAutonomousShortsBatch();
        result = { status: out.status, message: out.message, details: out.details };
      } else {
        result = { status: "ok", message: `Task ${task} executed (stub)` };
      }
      results.push(result);
    }

    const finalStatus = results.some(r => r.status === "error") ? "error" : "ok";
    const finalMessage = results.map(r => r.message).filter(Boolean).join(" | ");
    
    if (runId) {
      await recordRoutineRunFinish(
        runId,
        finalStatus === "error" ? "error" : "success",
        finalMessage,
        { tasks_count: results.length }
      );
    }
    return { status: finalStatus, message: finalMessage };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (runId) await recordRoutineRunFinish(runId, "error", message, undefined);
    throw err;
  }
}

/** 재시도 옵션 (스케줄러용) */
const ROUTINE_RETRY_ATTEMPTS = 3;
const ROUTINE_RETRY_BACKOFF_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 스케줄러에서 사용: 최대 3회 재시도 후 실패 시 기록·throw */
export async function runDailyRoutineTaskWithRetry(taskKey: string): Promise<{ status: string; message?: string; details?: Record<string, unknown> }> {
  let lastResult: { status: string; message?: string; details?: Record<string, unknown> } = { status: "error", message: "No attempt" };
  let lastError: unknown;
  for (let attempt = 1; attempt <= ROUTINE_RETRY_ATTEMPTS; attempt++) {
    try {
      const result = await runDailyRoutineTask(taskKey);
      lastResult = result;
      if (result.status !== "error") return result;
      lastError = new Error(result.message ?? "Task returned error");
    } catch (err) {
      lastError = err;
      lastResult = { status: "error", message: err instanceof Error ? err.message : String(err) };
    }
    if (attempt < ROUTINE_RETRY_ATTEMPTS) await sleep(ROUTINE_RETRY_BACKOFF_MS);
  }
  throw lastError ?? new Error(lastResult.message);
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

export async function getProactiveAlertsAsync(): Promise<ProactiveAlertsResult> {
  const base = getProactiveAlerts();
  const { getTodayFailedRuns } = await import("./nexusRoutineRunsService.js");
  const failed = await getTodayFailedRuns();
  const extra: Alert[] = failed.map((r) => ({
    type: "routine_failure",
    priority: "urgent",
    message: `Daily routine failed: ${r.task_time} ${r.task_name} — ${r.message ?? "error"}`,
    action: "Check run history or run again from Dashboard",
  }));
  return {
    alerts: [...extra, ...base.alerts],
    generated_at: base.generated_at,
  };
}
