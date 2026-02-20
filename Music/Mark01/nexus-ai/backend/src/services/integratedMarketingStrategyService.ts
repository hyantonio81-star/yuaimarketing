/**
 * 통합 마케팅 전략 (Integrated Marketing Strategy)
 * - 고객 페르소나, 채널별 전략·예산, KPI, AI 자동 생성 에셋
 */

export interface Persona {
  name: string;
  title: string;
  age: string;
  role: string;
  salary: string;
  painPoints: string[];
  infoSources: string[];
  purchaseTriggers: string[];
}

export interface ChannelStrategy {
  name: string;
  percent: number;
  amount: string;
  bullets: string[];
  timeline: string;
  expectedResults?: string[];
}

export interface KpiMilestone {
  week: number;
  traffic: string;
  leads: number;
  trials: number;
  customers?: number;
  mrr?: string;
}

export interface IntegratedMarketingStrategy {
  productName: string;
  budget: string;
  period: string;
  personas: Persona[];
  channelStrategies: ChannelStrategy[];
  kpiMilestones: KpiMilestone[];
  aiAssets: string[];
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function generateIntegratedMarketingStrategy(
  product: string,
  budget: string,
  period: string
): IntegratedMarketingStrategy {
  const productName = (product || "제품명").trim() || "제품명";
  const budgetDisplay = budget?.trim() || "$50,000";
  const periodDisplay = period?.trim() || "3개월";
  const h = simpleHash(productName);

  const totalBudget = parseBudget(budgetDisplay);
  const p30 = Math.round(totalBudget * 0.3);
  const p40 = Math.round(totalBudget * 0.4);
  const p15 = Math.round(totalBudget * 0.15);
  const p10 = Math.round(totalBudget * 0.1);
  const p5 = Math.round(totalBudget * 0.05);

  const personas: Persona[] = [
    {
      name: "Tech-Savvy Manager",
      title: "Persona A: \"Tech-Savvy Manager\"",
      age: "35-45세",
      role: "중간 관리자 (IT/운영)",
      salary: "$80K-120K",
      painPoints: [
        "시간 부족 (주 60시간 근무)",
        "비효율적 도구",
        "상사 압박 (결과 증명 필요)",
      ],
      infoSources: [
        "LinkedIn (매일)",
        "Industry blogs (주 2회)",
        "Podcasts (출퇴근 시간)",
      ],
      purchaseTriggers: ["ROI 계산기", "무료 트라이얼", "케이스 스터디"],
    },
    {
      name: "Growth Hacker",
      title: "Persona B: \"Growth Hacker\"",
      age: "28-38세",
      role: "마케팅/성장 담당",
      salary: "$70K-100K",
      painPoints: [
        "리드 품질 vs 양",
        "예산 제한",
        "속도 있는 실험 필요",
      ],
      infoSources: [
        "Twitter/X (일일)",
        "Product Hunt, G2 (주 1회)",
        "뉴스레터 (일일)",
      ],
      purchaseTriggers: ["데모 영상", "벤치마크 리포트", "무료 오디트"],
    },
  ];

  const channelStrategies: ChannelStrategy[] = [
    {
      name: "SEO & Content",
      percent: 30,
      amount: `$${formatNum(p30)}`,
      bullets: [
        "블로그 포스트 20개 (키워드 최적화)",
        "인포그래픽 5개 (백링크 유도)",
        "케이스 스터디 3개 (전환 촉진)",
      ],
      timeline:
        "Week 1-2: 키워드 리서치 & 콘텐츠 캘린더\nWeek 3-8: 콘텐츠 제작 & 발행\nWeek 9-12: 백링크 빌딩 & 최적화",
      expectedResults: [
        "오가닉 트래픽: +150%",
        "리드: 50-80개/월",
        "비용/리드: $187-300",
      ],
    },
    {
      name: "Paid Ads",
      percent: 40,
      amount: `$${formatNum(p40)}`,
      bullets: [
        "Google Ads: $12K — Search (솔루션 키워드 CPC $3-8), Display 리타겟팅 (CPC $0.50-2)",
        "LinkedIn Ads: $8K — Sponsored Content (직책+산업 타겟), InMail (고가치 타겟)",
      ],
      timeline: "Week 1: 캠페인 셋업 & A/B 테스트\nWeek 2-12: 최적화 (주간 조정)",
      expectedResults: [
        "Impressions: 500K+",
        "Clicks: 8,000-12,000",
        "리드: 120-180개",
        "CAC: $111-167",
      ],
    },
    {
      name: "Email Marketing",
      percent: 15,
      amount: `$${formatNum(p15)}`,
      bullets: [
        "드립 캠페인 5개 시리즈",
        "뉴스레터 (격주)",
        "리드 너처링 자동화",
      ],
      timeline: "Week 1-2: 이메일 시퀀스 작성\nWeek 3-12: 자동 발송 & 최적화",
      expectedResults: [
        "Open Rate: 22-28%",
        "CTR: 3.5-5.5%",
        "전환율: 8-12%",
      ],
    },
    {
      name: "Social Media",
      percent: 10,
      amount: `$${formatNum(p10)}`,
      bullets: [
        "LinkedIn: 주 3회 포스팅",
        "Twitter: 일일 2회",
        "커뮤니티 참여 (Reddit, Quora)",
      ],
      timeline: "Week 1-12: 지속 발행 및 참여",
    },
    {
      name: "PR & Partnerships",
      percent: 5,
      amount: `$${formatNum(p5)}`,
      bullets: [
        "프레스 릴리스 2개",
        "게스트 포스팅 5개",
        "인플루언서 협업 3건",
      ],
      timeline: "Week 2-10: 배치 및 협의",
    },
  ];

  const baseTraffic = 2000 + (h % 3000);
  const kpiMilestones: KpiMilestone[] = [
    {
      week: 4,
      traffic: `2,000 → ${formatNum(baseTraffic)}/월`,
      leads: 25 + (h % 15),
      trials: 8 + (h % 5),
    },
    {
      week: 8,
      traffic: `${formatNum(baseTraffic * 1.8)}/월`,
      leads: 70 + (h % 25),
      trials: 22 + (h % 8),
      customers: 4 + (h % 4),
    },
    {
      week: 12,
      traffic: `${formatNum(baseTraffic * 2.5)}/월`,
      leads: 140 + (h % 30),
      trials: 40 + (h % 15),
      customers: 12 + (h % 8),
      mrr: `$${formatNum(5000 + (h % 5000))}`,
    },
  ];

  const aiAssets = [
    "블로그 포스트 아웃라인 20개",
    "소셜 미디어 캡션 100개 (3개월분)",
    "이메일 템플릿 15개",
    "광고 카피 50개 (A/B 테스트용)",
    "랜딩 페이지 카피 3개",
  ];

  return {
    productName,
    budget: budgetDisplay,
    period: periodDisplay,
    personas,
    channelStrategies,
    kpiMilestones,
    aiAssets,
  };
}

function parseBudget(s: string): number {
  const match = s.replace(/,/g, "").match(/\d+/);
  if (!match) return 50_000;
  return Math.min(Number(match[0]) || 50_000, 10_000_000);
}

function formatNum(n: number): string {
  if (n >= 1000)
    return Math.floor(n / 1000).toString() + "," + (n % 1000).toString().padStart(3, "0");
  return n.toString();
}
