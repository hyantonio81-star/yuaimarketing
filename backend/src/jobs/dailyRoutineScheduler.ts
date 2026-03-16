/**
 * 24/7 일과 루틴 스케줄러 (Asia/Seoul 기준).
 * DAILY_ROUTINE_ENABLED=true이고 Vercel이 아닐 때만 등록.
 * process.env.TZ=Asia/Seoul 권장.
 */
import cron from "node-cron";
import { runDailyRoutineTaskWithRetry } from "../services/nexusCoreService.js";

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

/** "HH:00" → cron "0 H * * *" (매일 해당 시 정각) */
function timeToCron(taskTime: string): string {
  const [hour] = taskTime.split(":");
  const h = hour?.trim() ?? "0";
  return `0 ${h} * * *`;
}

let running: Set<string> = new Set();

function isRunning(taskTime: string): boolean {
  return running.has(taskTime);
}

function setRunning(taskTime: string, value: boolean): void {
  if (value) running.add(taskTime);
  else running.delete(taskTime);
}

export function startDailyRoutineScheduler(log: { info: (o: unknown, msg?: string) => void; error: (o: unknown, msg?: string) => void }): void {
  const enabled = process.env.DAILY_ROUTINE_ENABLED !== "false";
  if (!enabled) {
    log.info("DAILY_ROUTINE_ENABLED is false, skipping routine scheduler");
    return;
  }
  if (process.env.VERCEL === "1") {
    log.info("VERCEL=1, skipping in-process routine scheduler (use external cron)");
    return;
  }

  const tz = process.env.TZ || process.env.ROUTINE_TIMEZONE || "Asia/Seoul";
  if (!process.env.TZ) process.env.TZ = tz;

  for (const [taskTime] of Object.entries(DAILY_SCHEDULE)) {
    const expression = timeToCron(taskTime);
    cron.schedule(expression, async () => {
      if (isRunning(taskTime)) {
        log.info({ taskTime }, "Routine task skipped (already running)");
        return;
      }
      setRunning(taskTime, true);
      try {
        const result = await runDailyRoutineTaskWithRetry(taskTime);
        log.info({ taskTime, status: result.status }, "Routine task finished");
      } catch (err) {
        log.error({ taskTime, err }, "Routine task failed");
      } finally {
        setRunning(taskTime, false);
      }
    });
  }

  log.info(
    { times: Object.keys(DAILY_SCHEDULE), TZ: process.env.TZ },
    "Daily routine scheduler started (24/7)"
  );
}

export { DAILY_SCHEDULE };
