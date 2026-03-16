/**
 * Nexus 일과 루틴 실행 이력 (Supabase nexus_routine_runs).
 * 기록 없으면 메모리만 사용.
 */
import { getSupabaseAdmin } from "../lib/supabaseServer.js";

export interface RoutineRun {
  id: string;
  task_time: string;
  task_name: string;
  started_at: string;
  finished_at?: string;
  status: string;
  message?: string;
  details?: Record<string, unknown>;
}

const inMemoryRuns: RoutineRun[] = [];
const MAX_MEMORY = 200;

function rowToRun(row: {
  id: string;
  task_time: string;
  task_name: string;
  started_at: string;
  finished_at?: string | null;
  status: string;
  message?: string | null;
  details?: unknown;
}): RoutineRun {
  return {
    id: row.id,
    task_time: row.task_time,
    task_name: row.task_name,
    started_at: row.started_at,
    finished_at: row.finished_at ?? undefined,
    status: row.status,
    message: row.message ?? undefined,
    details: (row.details as Record<string, unknown>) ?? undefined,
  };
}

export async function recordRoutineRunStart(taskTime: string, taskName: string): Promise<string | null> {
  const startedAt = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("nexus_routine_runs")
      .insert({
        task_time: taskTime,
        task_name: taskName,
        started_at: startedAt,
        status: "running",
      })
      .select("id")
      .single();
    if (!error && data?.id) return String(data.id);
  }
  const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  inMemoryRuns.unshift({
    id,
    task_time: taskTime,
    task_name: taskName,
    started_at: startedAt,
    status: "running",
  });
  if (inMemoryRuns.length > MAX_MEMORY) inMemoryRuns.pop();
  return id;
}

export async function recordRoutineRunFinish(
  runId: string,
  status: "success" | "error",
  message?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const finishedAt = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  if (supabase && !runId.startsWith("mem-")) {
    await supabase
      .from("nexus_routine_runs")
      .update({ finished_at: finishedAt, status, message: message ?? null, details: details ?? null })
      .eq("id", runId);
    return;
  }
  const row = inMemoryRuns.find((r) => r.id === runId);
  if (row) {
    row.finished_at = finishedAt;
    row.status = status;
    row.message = message;
    row.details = details;
  }
}

export async function getRoutineRunHistory(limit = 50, taskTime?: string): Promise<RoutineRun[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    let q = supabase
      .from("nexus_routine_runs")
      .select("id, task_time, task_name, started_at, finished_at, status, message, details")
      .order("started_at", { ascending: false })
      .limit(limit);
    if (taskTime) q = q.eq("task_time", taskTime);
    const { data, error } = await q;
    if (!error && data) return data.map(rowToRun);
  }
  let list = [...inMemoryRuns];
  if (taskTime) list = list.filter((r) => r.task_time === taskTime);
  return list.slice(0, limit);
}

/** 시간대별 최근 1회 실행 (대시보드용) */
export async function getLastRunsPerTask(): Promise<Record<string, RoutineRun>> {
  const limit = 100;
  const list = await getRoutineRunHistory(limit);
  const byTask: Record<string, RoutineRun> = {};
  for (const run of list) {
    if (!byTask[run.task_time]) byTask[run.task_time] = run;
  }
  return byTask;
}

/** 오늘 실패한 루틴 실행만 조회 (프로액티브 알림용) */
export async function getTodayFailedRuns(): Promise<RoutineRun[]> {
  const today = new Date().toISOString().slice(0, 10);
  const list = await getRoutineRunHistory(200);
  return list.filter(
    (r) => r.status === "error" && r.started_at && r.started_at.startsWith(today)
  );
}
