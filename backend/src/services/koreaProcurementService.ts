/**
 * monitor_korea_procurement: 나라장터(G2B) 자동 모니터링
 * 공공데이터 API(입찰공고) → 키워드 필터 → 상세 분석(match_score>70) → 알림
 */

export interface Tender {
  id: string;
  title: string;
  description: string;
  bid_deadline: string;
  procuring_agency: string;
  notice_no?: string;
}

export interface TenderAnalysis {
  match_score: number;
  estimated_value: number;
  category?: string;
}

export interface RelevantTender {
  tender: Tender;
  analysis: TenderAnalysis;
  deadline: string;
  agency: string;
}

export interface MonitorKoreaProcurementResult {
  relevant: RelevantTender[];
  notification_sent: {
    title: string;
    count: number;
    priority: "high" | "normal";
  } | null;
  params_used: {
    inqryBgnDt: string;
    inqryEndDt: string;
  };
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function today(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function getTendersStub(inqryBgnDt: string, inqryEndDt: string): Tender[] {
  const titles = [
    "전자조달 시스템 유지보수 용역",
    "클라우드 인프라 구축 사업",
    "행정업무 소프트웨어 개발",
    "정보보안 강화 구매",
    "데이터베이스 정비 용역",
    "교육 플랫폼 구축",
    "시스템 통합 유지보수",
    "네트워크 장비 구매",
  ];
  const agencies = ["행정안전부", "과학기술정보통신부", "교육부", "중소벤처기업부", "한국인터넷진흥원"];
  return titles.map((title, i) => ({
    id: `T${inqryBgnDt}-${i + 1}`,
    title,
    description: `${title}에 관한 입찰공고입니다. 세부사항은 나라장터를 참조하세요.`,
    bid_deadline: `${inqryEndDt.slice(0, 4)}-${inqryEndDt.slice(4, 6)}-${inqryEndDt.slice(6, 8)}`,
    procuring_agency: agencies[i % agencies.length],
    notice_no: `N${1000 + i}`,
  }));
}

function getUserKeywords(override?: string[]): string[] {
  if (override?.length) return override;
  return ["시스템", "소프트웨어", "전자", "정보", "유지보수", "클라우드", "데이터"];
}

function analyzeTenderG2b(tender: Tender): TenderAnalysis {
  const seed = simpleHash(tender.id + tender.title);
  const match_score = 65 + (seed % 35);
  const estimated_value = 30000000 + (seed % 170000000);
  return {
    match_score,
    estimated_value,
    category: "IT·SW",
  };
}

export function monitorKoreaProcurement(userKeywords?: string[]): MonitorKoreaProcurementResult {
  const inqryBgnDt = yesterday();
  const inqryEndDt = today();

  const tenders = getTendersStub(inqryBgnDt, inqryEndDt);
  const keywords = getUserKeywords(userKeywords);

  const relevant: RelevantTender[] = [];
  for (const tender of tenders) {
    const matchKeyword = keywords.some(
      (kw) => tender.title.includes(kw) || tender.description.includes(kw)
    );
    if (!matchKeyword) continue;

    const analysis = analyzeTenderG2b(tender);
    if (analysis.match_score <= 70) continue;

    relevant.push({
      tender,
      analysis,
      deadline: tender.bid_deadline,
      agency: tender.procuring_agency,
    });
  }

  let notification_sent: MonitorKoreaProcurementResult["notification_sent"] = null;
  if (relevant.length > 0) {
    const hasHighValue = relevant.some((r) => r.analysis.estimated_value > 100_000_000);
    notification_sent = {
      title: `신규 입찰 ${relevant.length}건`,
      count: relevant.length,
      priority: hasHighValue ? "high" : "normal",
    };
  }

  return {
    relevant,
    notification_sent,
    params_used: { inqryBgnDt, inqryEndDt },
  };
}
