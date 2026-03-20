/**
 * KPI 감사원 AI 에이전트 — 1단계
 * 일과 루틴 실행 이력 + KPI 목표/실적 수집 → 감사 보고서 생성 (규칙 기반)
 */
import { getLastRunsPerTask } from "./nexusRoutineRunsService.js";
import { loadKpiGoals } from "./kpiGoalsService.js";
import { DAILY_SCHEDULE } from "../jobs/dailyRoutineScheduler.js";

export interface AuditorRoutineSummary {
  task_time: string;
  task_name: string;
  last_status: string;
  last_finished_at?: string;
  message?: string;
}

export interface AuditorKpiSummary {
  goal_id: string;
  name: string;
  target: number;
  current?: number;
  achievement_pct?: number;
  category?: string;
}

export interface AuditorAlert {
  type: "routine_failure" | "kpi_under" | "routine_stale";
  priority: "high" | "medium" | "low";
  message: string;
  action: string;
}

export interface AuditorRecommendation {
  id: string;
  title: string;
  description: string;
  for_agent?: string;
}

export interface AuditorReport {
  generated_at: string;
  routine_summary: AuditorRoutineSummary[];
  kpi_summary: AuditorKpiSummary[];
  alerts: AuditorAlert[];
  recommendations: AuditorRecommendation[];
  summary: {
    routine_total: number;
    routine_success: number;
    routine_error: number;
    kpi_goals_count: number;
    kpi_on_track: number;
    alerts_count: number;
  };
}

export async function generateAuditorReport(): Promise<AuditorReport> {
  const [lastRuns, kpiStore] = await Promise.all([
    getLastRunsPerTask(),
    loadKpiGoals(),
  ]);

  const scheduleEntries = Object.entries(DAILY_SCHEDULE);
  const routine_summary: AuditorRoutineSummary[] = scheduleEntries.map(([taskTime, taskName]) => {
    const run = lastRuns[taskTime];
    return {
      task_time: taskTime,
      task_name: taskName,
      last_status: run?.status ?? "never",
      last_finished_at: run?.finished_at,
      message: run?.message,
    };
  });

  const kpi_summary: AuditorKpiSummary[] = (kpiStore.goals ?? []).map((g) => {
    const target = Number(g.target) || 0;
    const current = g.current;
    const achievement_pct =
      target > 0 && typeof current === "number" ? Math.min(100, Math.round((current / target) * 100)) : undefined;
    return {
      goal_id: g.id,
      name: g.name,
      target,
      current,
      achievement_pct,
      category: g.category,
    };
  });

  const alerts: AuditorAlert[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const r of routine_summary) {
    if (r.last_status === "error") {
      alerts.push({
        type: "routine_failure",
        priority: "high",
        message: `일과 루틴 ${r.task_time} (${r.task_name}) 실행 실패`,
        action: "원인 확인 후 재실행 또는 스케줄 점검",
      });
    } else if (r.last_status !== "success" && r.last_status !== "running") {
      const lastDate = r.last_finished_at?.slice(0, 10);
      if (lastDate && lastDate < today) {
        alerts.push({
          type: "routine_stale",
          priority: "medium",
          message: `일과 루틴 ${r.task_time} (${r.task_name}) 오늘 미실행`,
          action: "수동 실행 또는 스케줄러 동작 확인",
        });
      }
    }
  }

  for (const k of kpi_summary) {
    if (k.achievement_pct != null && k.achievement_pct < 80 && k.target > 0) {
      alerts.push({
        type: "kpi_under",
        priority: k.achievement_pct < 50 ? "high" : "medium",
        message: `KPI "${k.name}" 달성률 ${k.achievement_pct}% (목표 대비 부족)`,
        action: "실적 점검 및 대응 방안 수립",
      });
    }
  }

  const recommendations: AuditorRecommendation[] = [];
  const routineErrors = routine_summary.filter((r) => r.last_status === "error");
  if (routineErrors.length > 0) {
    recommendations.push({
      id: "rec-routine-retry",
      title: "실패한 일과 루틴 재실행",
      description: `${routineErrors.length}건의 루틴이 실패했습니다. 대시보드에서 해당 시각 태스크를 수동 실행하거나 로그를 확인하세요.`,
      for_agent: "nexus_core",
    });
  }
  const kpiUnder = kpi_summary.filter((k) => k.achievement_pct != null && k.achievement_pct < 80);
  if (kpiUnder.length > 0) {
    recommendations.push({
      id: "rec-kpi-review",
      title: "KPI 목표·실적 검토",
      description: `${kpiUnder.length}개 KPI가 목표 대비 80% 미만입니다. 목표 조정 또는 실적 개선 방안을 검토하세요.`,
      for_agent: "dashboard_kpi",
    });
  }
  if (routine_summary.every((r) => r.last_status === "never" || r.last_status === "running")) {
    recommendations.push({
      id: "rec-routine-first",
      title: "일과 루틴 최초 실행",
      description: "아직 완료된 루틴 실행이 없습니다. DAILY_ROUTINE_ENABLED 및 스케줄러 설정을 확인하거나 수동 실행을 시도하세요.",
      for_agent: "nexus_core",
    });
  }

  const routine_success = routine_summary.filter((r) => r.last_status === "success").length;
  const routine_error = routine_summary.filter((r) => r.last_status === "error").length;
  const kpi_on_track = kpi_summary.filter(
    (k) => k.achievement_pct == null || k.achievement_pct >= 80
  ).length;

  return {
    generated_at: new Date().toISOString(),
    routine_summary,
    kpi_summary,
    alerts,
    recommendations,
    summary: {
      routine_total: routine_summary.length,
      routine_success,
      routine_error,
      kpi_goals_count: kpi_summary.length,
      kpi_on_track,
      alerts_count: alerts.length,
    },
  };
}
