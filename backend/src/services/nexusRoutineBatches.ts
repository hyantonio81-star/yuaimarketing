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

/** 자율 Shorts 생산 — 세계 뉴스 및 주요 이슈 탐색 후 상위 3개 자동 생산 (분야 로테이션 및 문화 교류 로직) */
export async function runAutonomousShortsBatch(): Promise<BatchResult> {
  try {
    const { getMarketNewsSummaryAsync } = await import("./marketIntelService.js");
    const { runPipelineOnce } = await import("./shortsAgentService.js");
    const { analyzePerformanceAndSuggest } = await import("./shorts/shortsStatsService.js");

    // 0. AI 자율 성과 분석 및 전략 수립
    const aiStrategy = await analyzePerformanceAndSuggest();
    console.log(`[AI Self-Optimization] Reasoning: ${aiStrategy.reasoning}`);

    // 1. 시간대별 카테고리 로테이션 설정 (AI 추천이 있으면 우선 사용)
    const categories = ["economy", "ai", "health", "lifestyle", "k-culture", "latam", "silver"];
    const hour = new Date().getHours();
    const currentCategory = aiStrategy.suggestedCategory || categories[hour % categories.length];

    // 2. 문화 교류 로직 (Source Language -> Target Language)
    // - LATAM 뉴스(스페인어) -> 한국어 Shorts
    // - K-Culture 뉴스(영어/한국어) -> 스페인어 Shorts
    // - Silver 뉴스(영어) -> 한국어/스페인어 교차
    let targetLanguage = "en";
    if (currentCategory === "latam") targetLanguage = "ko";
    else if (currentCategory === "k-culture") targetLanguage = "es";
    else if (currentCategory === "silver") {
      targetLanguage = hour % 2 === 0 ? "ko" : "es"; // 실버 정보는 한국과 중남미 양쪽으로 확산
    } else if (hour % 2 === 0) targetLanguage = "ko"; 

    // 3. 해당 카테고리 뉴스 수집
    const news = await getMarketNewsSummaryAsync("ALL", "en", { 
      categoryFilter: currentCategory 
    });
    
    // YuantO Ai 소스(스텁) 제외하고 실제 뉴스만 상위 3개 추출
    const topNews = news.filter((n) => n.source !== "YuantO Ai").slice(0, 3);

    if (topNews.length === 0) {
      // 카테고리 뉴스 없으면 전체 뉴스에서 가져오기
      const fallbackNews = await getMarketNewsSummaryAsync("ALL", "en");
      topNews.push(...fallbackNews.filter((n) => n.source !== "YuantO Ai").slice(0, 3));
    }

    const jobIds: string[] = [];
    const topics: string[] = [];

    // 4. 상위 3개 이슈에 대해 각각 Shorts 파이프라인 실행
    for (const topic of topNews) {
      // AI 부스트 키워드가 있으면 추가
      const keywords = [topic.title, ...(aiStrategy.boostKeywords || [])];
      
      const job = await runPipelineOnce(keywords, {
        uploadMode: "immediate",
        platforms: ["youtube"],
        // AI 전략 근거 전달
        reasoning: aiStrategy.reasoning,
        category: currentCategory,
        languageOverride: targetLanguage,
        sourceLanguage: (topic as any).language
      });
      jobIds.push(job.jobId);
      topics.push(topic.title);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    return {
      status: "ok",
      message: `Autonomous shorts [${currentCategory}] triggered for ${topNews.length} topics. Reasoning: ${aiStrategy.reasoning}`,
      details: { jobIds, topics, category: currentCategory, targetLanguage, aiReasoning: aiStrategy.reasoning },
    };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "autonomous_shorts failed",
    };
  }
}
