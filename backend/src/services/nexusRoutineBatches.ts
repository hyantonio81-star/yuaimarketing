/**
 * 24/7 일과 루틴용 배치 태스크 — 스텁 대신 실제 서비스 호출로 효율적 업무화.
 * 한 시각에 한 배치가 돌며, 배치 내에서 여러 단계를 순차 실행.
 */

const DEFAULT_ORG = "default";
const DEFAULT_COUNTRY = "KR";
const DEFAULT_LANG = "ko" as const;

export interface BatchResult {
  status: "ok" | "error";
  message: string;
  details?: Record<string, unknown>;
}

/** 02:00 — 시장 인텔 데이터 갱신: 뉴스 요약 수집 (가벼운 갱신) */
export async function runDataRefreshBatch(): Promise<BatchResult> {
  try {
    const { getMarketNewsSummaryAsync } = await import("./marketIntelService.js");
    const items = await getMarketNewsSummaryAsync(DEFAULT_COUNTRY, DEFAULT_LANG);
    return {
      status: "ok",
      message: "Data refresh completed",
      details: { news_items: items.length, country: DEFAULT_COUNTRY },
    };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "data_refresh failed",
      details: { step: "market_news" },
    };
  }
}

/** 03:00 — 경쟁사 모니터링: 이벤트 조회 (변동·신제품·광고 등) */
export async function runMonitoringBatch(): Promise<BatchResult> {
  try {
    const { getCompetitorEvents } = await import("./competitorService.js");
    const events = getCompetitorEvents(DEFAULT_ORG, DEFAULT_COUNTRY, 20);
    return {
      status: "ok",
      message: "Competitor monitoring completed",
      details: { events_count: events.length, org: DEFAULT_ORG, country: DEFAULT_COUNTRY },
    };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "competitor_monitoring failed",
      details: { step: "competitor_events" },
    };
  }
}

/** 06:00 — 입찰 모니터링: 키워드 기반 적합 공고 점검 */
export async function runTenderCheckBatch(): Promise<BatchResult> {
  try {
    const { monitorKoreaProcurement } = await import("./koreaProcurementService.js");
    const result = monitorKoreaProcurement();
    return {
      status: "ok",
      message: "Tender monitoring completed",
      details: {
        relevant_count: result.relevant.length,
        params_used: result.params_used,
        notification_sent: result.notification_sent?.count ?? 0,
      },
    };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "tender_monitoring failed",
      details: { step: "korea_procurement" },
    };
  }
}

/** 07:00 — 일일 리포트 생성: 시장 인텔 리포트 빌드·저장 (PDF/DOCX 등) */
export async function runDailyReportBatch(): Promise<BatchResult> {
  try {
    const { generateMarketReportAsync } = await import("./marketReportGenerator.js");
    const job = await generateMarketReportAsync(DEFAULT_ORG, DEFAULT_COUNTRY);
    return {
      status: job.status === "completed" ? "ok" : "error",
      message: job.message,
      details: {
        job_id: job.job_id,
        status: job.status,
        download_url: job.download_url ?? undefined,
        format: job.format,
      },
    };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "generate_daily_report failed",
      details: { step: "market_report" },
    };
  }
}

/** 12:00 — 오후 성과 점검: 뉴스 요약 + 경쟁사 이벤트 (가벼운 스냅샷) */
export async function runMiddayCheckBatch(): Promise<BatchResult> {
  try {
    const { getMarketNewsSummaryAsync } = await import("./marketIntelService.js");
    const { getCompetitorEvents } = await import("./competitorService.js");
    const [newsItems, events] = await Promise.all([
      getMarketNewsSummaryAsync(DEFAULT_COUNTRY, DEFAULT_LANG),
      Promise.resolve(getCompetitorEvents(DEFAULT_ORG, DEFAULT_COUNTRY, 10)),
    ]);
    return {
      status: "ok",
      message: "Midday performance check completed",
      details: { news_items: newsItems.length, events_count: events.length },
    };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "midday_performance_check failed",
      details: { step: "midday_check" },
    };
  }
}

/** 18:00 — EOD 요약: 프로액티브 알림 기반 요약 (실패 루틴·재고·입찰 등) */
export async function runEodSummaryBatch(): Promise<BatchResult> {
  try {
    const { getProactiveAlertsAsync } = await import("./nexusCoreService.js");
    const alerts = await getProactiveAlertsAsync();
    const urgent = alerts.alerts.filter((a) => a.priority === "urgent");
    return {
      status: "ok",
      message: "EOD summary completed",
      details: {
        alerts_total: alerts.alerts.length,
        alerts_urgent: urgent.length,
        generated_at: alerts.generated_at,
      },
    };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "eod_summary failed",
      details: { step: "proactive_alerts" },
    };
  }
}
