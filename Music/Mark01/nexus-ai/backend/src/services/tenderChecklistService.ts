/**
 * 입찰 체크리스트 (자동 생성)
 * 필수 서류 3단계(자동준비/사용자확인/전문가) + AI 분석 요약 + 위험요소·완화전략
 */

export interface ChecklistDocument {
  label: string;
  note?: string;
  done: boolean;
}

export interface TenderChecklistResult {
  tenderTitle: string;
  deadline: string;
  documents: {
    auto_ready: ChecklistDocument[];
    user_confirm: ChecklistDocument[];
    expert_required: ChecklistDocument[];
  };
  ai_summary: {
    score: number;
    competitors_range: string;
    win_rate_percent: number;
    contract_amount: string;
    prep_cost: string;
    ev_formula: string;
    ev_value: string;
    recommendation: string;
  };
  risks: { text: string; level?: string }[];
  mitigation: string[];
}

export function generateTenderChecklist(
  tenderTitle?: string,
  country?: string,
  deadline?: string
): TenderChecklistResult {
  const title = (tenderTitle || "Solar Panel Procurement - Tanzania").trim() || "Solar Panel Procurement - Tanzania";
  const dl = deadline || "2026-03-15";
  const c = country || "Tanzania";

  return {
    tenderTitle: title,
    deadline: dl,
    documents: {
      auto_ready: [
        { label: "회사 소개서 (영문)", done: true },
        { label: "제품 카탈로그", done: true },
        { label: "견적서 (USD 기준)", done: true },
        { label: "납품 일정표", done: true },
        { label: "품질 인증서 (ISO, CE)", done: true },
      ],
      user_confirm: [
        { label: "은행 보증서", note: "신청 링크 제공", done: false },
        { label: "재무제표 (최근 3년, 회계사 서명)", done: false },
        { label: "레퍼런스 (3개 프로젝트)", done: false },
      ],
      expert_required: [
        { label: "법적 서류 공증", done: false },
        { label: "입찰 보증금 납부 ($50,000)", done: false },
      ],
    },
    ai_summary: {
      score: 68,
      competitors_range: "12-15개",
      win_rate_percent: 18,
      contract_amount: "$2.5M",
      prep_cost: "$8,500",
      ev_formula: "$450K × 18% = $81K",
      ev_value: "$81K",
      recommendation: "BID (기대값 > 준비 비용)",
    },
    risks: [
      { text: "정치적 리스크 (Tanzania stability: Medium)", level: "Medium" },
      { text: "환율 변동 (USD/TZS volatility)", level: "Medium" },
      { text: "물류 복잡도 (Dar es Salaam port)", level: "Medium" },
    ],
    mitigation: [
      "선급금 요구 (30%)",
      "환헤지 계약",
      "현지 파트너 활용",
    ],
  };
}
