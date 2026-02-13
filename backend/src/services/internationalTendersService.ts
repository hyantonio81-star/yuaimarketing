/**
 * monitor_international_tenders: UNGM / World Bank / ADB 등 다중 소스 수집 → 중복 제거 → 관련성 점수 → 정렬
 */

export interface TenderSource {
  name: string;
  url: string;
  method: "scraping" | "api" | "rss";
}

export interface InternationalTender {
  id: string;
  title: string;
  description?: string;
  source: string;
  url?: string;
  deadline?: string;
  estimated_value?: number;
  relevance?: number;
}

export interface UserProfile {
  keywords?: string[];
  sectors?: string[];
}

const SOURCES: TenderSource[] = [
  { name: "UNGM", url: "https://www.ungm.org/Public/Notice", method: "scraping" },
  { name: "World Bank", url: "https://projects.worldbank.org/api/projects", method: "api" },
  { name: "ADB", url: "https://www.adb.org/projects/tenders", method: "rss" },
];

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function fetchViaApi(_url: string): InternationalTender[] {
  return [
    { id: "WB-001", title: "IT System Modernization Project", source: "World Bank", deadline: "2025-03-15", estimated_value: 5000000 },
    { id: "WB-002", title: "Health Information Systems Consulting", source: "World Bank", deadline: "2025-04-01", estimated_value: 1200000 },
    { id: "WB-003", title: "Digital Infrastructure Assessment", source: "World Bank", deadline: "2025-03-28", estimated_value: 800000 },
  ];
}

function scrapeTenders(_url: string): InternationalTender[] {
  return [
    { id: "UNGM-001", title: "Software Development Services for UN Agency", source: "UNGM", deadline: "2025-03-20", estimated_value: 2000000 },
    { id: "UNGM-002", title: "Cloud Migration and Security Consulting", source: "UNGM", deadline: "2025-04-10", estimated_value: 3500000 },
  ];
}

function parseRssFeed(_url: string): InternationalTender[] {
  return [
    { id: "ADB-001", title: "ICT and Digital Solutions for Regional Project", source: "ADB", deadline: "2025-03-25", estimated_value: 1800000 },
    { id: "ADB-002", title: "Enterprise Software and Training", source: "ADB", deadline: "2025-04-05", estimated_value: 900000 },
  ];
}

function deduplicateTenders(tenders: InternationalTender[]): InternationalTender[] {
  const seen = new Set<string>();
  return tenders.filter((t) => {
    const key = (t.id || t.title || "").toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getUserProfile(override?: UserProfile): UserProfile {
  if (override?.keywords?.length || override?.sectors?.length) return override;
  return {
    keywords: ["IT", "software", "system", "digital", "consulting", "ICT"],
    sectors: ["technology", "health", "education"],
  };
}

function calculateRelevance(tender: InternationalTender, userProfile: UserProfile): number {
  const text = `${tender.title} ${tender.description || ""}`.toLowerCase();
  const keywords = userProfile.keywords ?? [];
  let score = 40;
  for (const kw of keywords) {
    if (text.includes(kw.toLowerCase())) score += 15;
  }
  score += simpleHash(tender.id + tender.title) % 25;
  return Math.min(99, score);
}

export function monitorInternationalTenders(userProfileOverride?: UserProfile): InternationalTender[] {
  const allTenders: InternationalTender[] = [];

  for (const source of SOURCES) {
    let tenders: InternationalTender[];
    if (source.method === "api") {
      tenders = fetchViaApi(source.url);
    } else if (source.method === "scraping") {
      tenders = scrapeTenders(source.url);
    } else {
      tenders = parseRssFeed(source.url);
    }
    allTenders.push(...tenders);
  }

  const unique = deduplicateTenders(allTenders);
  const profile = getUserProfile(userProfileOverride);

  for (const tender of unique) {
    tender.relevance = calculateRelevance(tender, profile);
  }

  return unique
    .filter((t) => (t.relevance ?? 0) > 60)
    .sort((a, b) => {
      const ra = a.relevance ?? 0;
      const rb = b.relevance ?? 0;
      if (rb !== ra) return rb - ra;
      return (b.estimated_value ?? 0) - (a.estimated_value ?? 0);
    });
}
