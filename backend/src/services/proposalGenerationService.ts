/**
 * generate_proposal: 템플릿 선택 → 섹션별 자동 작성(회사소개/기술제안/이행계획/팀/예산) → 조립 → 품질검사 → 제출 체크리스트
 */

export interface TenderForProposal {
  id?: string;
  type?: string;
  scope_of_work?: string;
  contract_period?: string;
  technical_specs?: string;
  required_expertise?: string;
  submission_guidelines?: string;
}

export interface ProposalDocument {
  template: string;
  sections: Record<string, string | object>;
  summary: string;
}

export interface QCReport {
  score: number;
  issues: Array<{ section: string; message: string; severity: string }>;
  passed: boolean;
}

export interface GenerateProposalResult {
  document: ProposalDocument;
  file_formats: { docx: string; pdf: string };
  qc_report: QCReport;
  checklist: string[];
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function selectProposalTemplate(tenderType: string | undefined): string {
  const t = (tenderType || "").toLowerCase();
  if (t.includes("si") || t.includes("시스템")) return "government_si_standard";
  if (t.includes("용역") || t.includes("consulting")) return "government_consulting";
  return "government_standard";
}

function loadCompanyProfile(): string {
  return "설립 15년, 공공·민간 IT 사업 수행. ISO 9001/27001 보유.";
}

function filterRelevantProjects(_tender: TenderForProposal): string {
  return "행정기관 통합시스템 구축, 지자체 전자정부 플랫폼 유지보수 등 3건.";
}

function loadCertifications(): string {
  return "ISO 9001, ISO 27001, 소프트웨어사업자.";
}

function gpt4WriteSection(
  section: string,
  context: Record<string, unknown>,
  opts: { max_words?: number; include_diagrams?: boolean } = {}
): string {
  const parts = [section, JSON.stringify(context).slice(0, 100), opts.max_words ?? 500];
  const seed = simpleHash(parts.join(""));
  const words = Math.min(opts.max_words ?? 500, 100 + (seed % 400));
  let text = `[${section}] 본 섹션은 자동 생성된 초안입니다. (약 ${words}어 내외)`;
  if (opts.include_diagrams) text += " [다이어그램 삽입 예정]";
  return text;
}

function generateGanttChart(scope: string, duration: string): object {
  const months = parseInt(duration?.replace(/\D/g, "") || "12", 10) || 12;
  const phases = [
    { name: "요구사항 분석", start: 0, end: Math.ceil(months * 0.2) },
    { name: "설계", start: Math.ceil(months * 0.2), end: Math.ceil(months * 0.45) },
    { name: "구현·테스트", start: Math.ceil(months * 0.45), end: Math.ceil(months * 0.85) },
    { name: "이행·교육", start: Math.ceil(months * 0.85), end: months },
  ];
  return { type: "gantt", duration_months: months, phases, scope_preview: (scope || "").slice(0, 80) };
}

function autoSelectTeam(requiredSkills: string | undefined, duration: string | undefined): object {
  const skills = (requiredSkills || "PM,개발,QA").split(/[,/]/).map((s) => s.trim()).filter(Boolean);
  const months = duration?.replace(/\D/g, "") || "12";
  return {
    roles: skills.map((s, i) => ({ role: s || `역할${i + 1}`, fte: 1, duration_months: months })),
    total_fte: skills.length,
  };
}

function estimateProjectCostForProposal(tender: TenderForProposal): number {
  const scope = tender.scope_of_work ?? "";
  const duration = (tender.contract_period ?? "12").replace(/\D/g, "") || "12";
  const base = 80_000_000;
  const mult = 0.8 + (simpleHash(scope + duration) % 60) / 100;
  const months = parseInt(duration, 10) || 12;
  return Math.round(base * mult * (months / 12));
}

function createDetailedBudget(
  costEstimate: number,
  breakdownBy: string[]
): object {
  const labor = Math.round(costEstimate * 0.6);
  const materials = Math.round(costEstimate * 0.25);
  const overhead = costEstimate - labor - materials;
  return {
    total: costEstimate,
    breakdown: [
      { category: "labor", label: "인건비", amount: labor },
      { category: "materials", label: "재료·외주", amount: materials },
      { category: "overhead", label: "간접비", amount: overhead },
    ],
  };
}

function assembleDocument(
  template: string,
  sections: Record<string, string | object>,
  _formatting: string
): ProposalDocument {
  const summary = `제안서 (템플릿: ${template}). 섹션: ${Object.keys(sections).join(", ")}.`;
  return { template, sections, summary };
}

function qualityCheckProposal(
  document: ProposalDocument,
  guidelines: string | undefined
): QCReport {
  const issues: QCReport["issues"] = [];
  if (!document.sections.company_intro) issues.push({ section: "company_intro", message: "회사 소개 누락", severity: "high" });
  if (guidelines?.includes("서명") && !document.summary.includes("서명")) {
    issues.push({ section: "meta", message: "제출 가이드에 서명 요건 확인 필요", severity: "medium" });
  }
  const score = Math.max(0, 85 - issues.length * 10);
  return {
    score,
    issues,
    passed: issues.filter((i) => i.severity === "high").length === 0,
  };
}

function fixIssues(doc: ProposalDocument, _issues: QCReport["issues"]): ProposalDocument {
  return doc;
}

function generateSubmissionChecklist(tender: TenderForProposal): string[] {
  const list = [
    "제안서 본문 (공공 표준 형식)",
    "투입 인력 현황",
    "예산 명세서",
    "사업 수행 실적 증빙",
    "인증서 사본",
  ];
  if (tender.submission_guidelines) list.push("제출 가이드라인 준수 확인");
  return list;
}

export function generateProposal(tender: TenderForProposal): GenerateProposalResult {
  const template = selectProposalTemplate(tender.type);
  const sections: Record<string, string | object> = {};

  sections.company_intro = gpt4WriteSection(
    "company_introduction",
    {
      company_profile: loadCompanyProfile(),
      relevant_experience: filterRelevantProjects(tender),
      certifications: loadCertifications(),
    },
    { max_words: 500 }
  );

  sections.technical_proposal = gpt4WriteSection(
    "technical_approach",
    {
      tender_requirements: tender.technical_specs,
      our_methodology: "표준 PM/개발 방법론",
      similar_projects: "유사 사업 3건",
    },
    { max_words: 1500, include_diagrams: true }
  );

  sections.implementation_plan = generateGanttChart(
    tender.scope_of_work ?? "",
    tender.contract_period ?? ""
  );

  sections.team = autoSelectTeam(tender.required_expertise, tender.contract_period);

  const costEstimate = estimateProjectCostForProposal(tender);
  sections.budget = createDetailedBudget(costEstimate, ["labor", "materials", "overhead"]);

  let proposalDoc = assembleDocument(template, sections, "government_standard");
  const qc_report = qualityCheckProposal(proposalDoc, tender.submission_guidelines);

  if (qc_report.issues.length > 0) {
    proposalDoc = fixIssues(proposalDoc, qc_report.issues);
  }

  const checklist = generateSubmissionChecklist(tender);

  return {
    document: proposalDoc,
    file_formats: {
      docx: "/api/gov/proposal/download/docx", // placeholder; actual convert would return blob URL or base64
      pdf: "/api/gov/proposal/download/pdf",
    },
    qc_report,
    checklist,
  };
}
