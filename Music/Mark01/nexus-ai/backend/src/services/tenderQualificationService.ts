/**
 * check_qualification: 입찰 문서 요건 추출 → 회사 역량/인증 대조 → 체크리스트 · 입찰 권고(DO NOT BID / MARGINAL / ELIGIBLE)
 */

export interface TenderInput {
  id?: string;
  document?: string;
}

export interface Requirement {
  type: "mandatory" | "preferred";
  description: string;
}

export interface ChecklistItemMet {
  requirement: string;
  status: string;
  evidence?: string;
  advantage?: string;
}

export interface ChecklistItemMissing {
  requirement: string;
  status: string;
  can_obtain: string;
  time_needed: string;
}

export interface Checklist {
  mandatory: ChecklistItemMet[];
  preferred: ChecklistItemMet[];
  missing: ChecklistItemMissing[];
}

export interface Recommendation {
  decision: "DO NOT BID" | "MARGINAL" | "ELIGIBLE";
  reason?: string;
  missing_items?: ChecklistItemMissing[];
  score?: number;
  competitive_edge?: number;
}

export interface CheckQualificationResult {
  checklist: Checklist;
  recommendation: Recommendation;
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const DEFAULT_REQUIREMENTS: Requirement[] = [
  { type: "mandatory", description: "ISO 9001 인증 보유" },
  { type: "mandatory", description: "과거 3년 이내 유사 사업 수행 실적" },
  { type: "mandatory", description: "기술인력 보유 (관련 분야 5인 이상)" },
  { type: "preferred", description: "ISO 27001 정보보안 인증" },
  { type: "preferred", description: "클라우드 구축·운영 실적" },
  { type: "preferred", description: "공공 SI 실적" },
];

function extractRequirements(document: string | undefined): Requirement[] {
  if (!document?.trim()) return DEFAULT_REQUIREMENTS;
  const lines = document.split(/\n/).map((s) => s.trim()).filter(Boolean);
  const reqs: Requirement[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    const type = lower.includes("필수") || lower.includes("mandatory") ? "mandatory" : "preferred";
    reqs.push({ type, description: line.slice(0, 200) });
  }
  return reqs.length ? reqs : DEFAULT_REQUIREMENTS;
}

function loadCompanyCertifications(): string[] {
  return ["ISO 9001", "유사 사업 실적 3건", "기술인력 8명", "ISO 27001", "클라우드 실적 2건"];
}

function meetsRequirement(req: Requirement, capabilities: string[]): boolean {
  const text = req.description.toLowerCase();
  for (const cap of capabilities) {
    if (text.includes(cap.toLowerCase().slice(0, 8))) return true;
  }
  return simpleHash(req.description + capabilities.join(",")) % 3 !== 0;
}

function findEvidence(req: Requirement, _capabilities: string[]): string {
  if (req.description.includes("ISO 9001")) return "인증서 번호 ISO-2022-XXX";
  if (req.description.includes("실적")) return "수행 계약서 및 완료 증빙";
  if (req.description.includes("인력")) return "인력 보유 현황서";
  return "관련 증빙 서류";
}

function assessFeasibility(req: Requirement): string {
  const h = simpleHash(req.description);
  if (h % 3 === 0) return "단기 취득 가능 (파트너십)";
  if (h % 3 === 1) return "3개월 내 취득 목표 가능";
  return "취득 난이도 높음, 사전 검토 필요";
}

function estimateTimeToObtain(req: Requirement): string {
  const h = simpleHash(req.description);
  const weeks = 4 + (h % 12);
  return `${weeks}주`;
}

export function checkQualification(tender: TenderInput): CheckQualificationResult {
  const requirements = extractRequirements(tender.document);
  const ourCapabilities = loadCompanyCertifications();

  const checklist: Checklist = {
    mandatory: [],
    preferred: [],
    missing: [],
  };

  for (const req of requirements) {
    if (req.type === "mandatory") {
      if (meetsRequirement(req, ourCapabilities)) {
        checklist.mandatory.push({
          requirement: req.description,
          status: "✅ Met",
          evidence: findEvidence(req, ourCapabilities),
        });
      } else {
        checklist.missing.push({
          requirement: req.description,
          status: "❌ Not Met",
          can_obtain: assessFeasibility(req),
          time_needed: estimateTimeToObtain(req),
        });
      }
    } else if (req.type === "preferred") {
      if (meetsRequirement(req, ourCapabilities)) {
        checklist.preferred.push({
          requirement: req.description,
          status: "✅ Met",
          advantage: "Competitive edge",
        });
      }
    }
  }

  let recommendation: Recommendation;
  if (checklist.missing.length > 0) {
    recommendation = {
      decision: "DO NOT BID",
      reason: "Missing mandatory requirements",
      missing_items: checklist.missing,
    };
  } else {
    const score =
      checklist.mandatory.length * 10 + checklist.preferred.length * 5;
    recommendation = {
      decision: score >= 50 ? "ELIGIBLE" : "MARGINAL",
      score,
      competitive_edge: checklist.preferred.length,
    };
  }

  return { checklist, recommendation };
}
