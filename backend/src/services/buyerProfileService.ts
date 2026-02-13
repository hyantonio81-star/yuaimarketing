/**
 * Buyer Profile: 상세 바이어 프로필
 * 기본정보, 구매패턴, 매칭점수, AI 추천 전략, 이메일 초안
 */

export interface BuyerProfile {
  companyName: string;
  country: string;
  countryEmoji: string;
  founded: string;
  yearsActive: number;
  employees: string;
  website: string;
  purchasePattern: {
    mainImports: { name: string; hs: string; percent: number }[];
    annualImportUsd: string;
    avgOrderSize: string;
    orderFrequency: string;
    mainSupplyCountries: { country: string; emoji: string; percent: number }[];
  };
  matchScore: number;
  scoreBreakdown: {
    productFit: number;
    volume: number;
    reputation: number;
    logistics: number;
    responseRate: number;
  };
  strategy: {
    approach: string[];
    proposalPoints: { type: "do" | "caution"; text: string }[];
    expectedSuccessRate: string;
    rationale: string[];
  };
  emailDraft: {
    subject: string;
    body: string;
    trackingNote: string;
  };
}

const COUNTRY_EMOJI: Record<string, string> = {
  DE: "🇩🇪",
  US: "🇺🇸",
  CN: "🇨🇳",
  TW: "🇹🇼",
  KR: "🇰🇷",
  JP: "🇯🇵",
  GB: "🇬🇧",
  VN: "🇻🇳",
};

function getEmoji(countryCode: string): string {
  return COUNTRY_EMOJI[countryCode] ?? "🌐";
}

export function getBuyerProfile(buyerId?: string, companyName?: string, country?: string): BuyerProfile {
  const id = (buyerId || "").toLowerCase();
  const name = (companyName || "").trim();
  const isAbc = id.includes("abc") || name.toLowerCase().includes("abc") || name === "";

  if (isAbc || (!id && !name)) {
    return {
      companyName: "ABC Trading Co., Ltd.",
      country: "Germany",
      countryEmoji: "🇩🇪",
      founded: "2008년",
      yearsActive: 18,
      employees: "50-200명",
      website: "www.abc-trading.de",
      purchasePattern: {
        mainImports: [
          { name: "전자 부품", hs: "8542", percent: 45 },
          { name: "기계류", hs: "8479", percent: 30 },
          { name: "플라스틱 제품", hs: "3926", percent: 25 },
        ],
        annualImportUsd: "$5.2M",
        avgOrderSize: "$85,000",
        orderFrequency: "분기 1회",
        mainSupplyCountries: [
          { country: "China", emoji: "🇨🇳", percent: 60 },
          { country: "Taiwan", emoji: "🇹🇼", percent: 25 },
          { country: "South Korea", emoji: "🇰🇷", percent: 10 },
          { country: "Japan", emoji: "🇯🇵", percent: 5 },
        ],
      },
      matchScore: 87,
      scoreBreakdown: {
        productFit: 32,
        volume: 21,
        reputation: 18,
        logistics: 8,
        responseRate: 8,
      },
      strategy: {
        approach: [
          "📧 이메일 아웃리치 (가장 효과적)",
          "📞 전화 팔로업 (2주 후)",
          "🤝 전시회 미팅 (Hannover Messe 2026)",
        ],
        proposalPoints: [
          { type: "do", text: "한국 제조 품질 강조" },
          { type: "do", text: "중국 대비 납기 신뢰성" },
          { type: "do", text: "CE 인증 보유" },
          { type: "caution", text: "가격 경쟁력 필요 (중국 대비 +15% 허용)" },
        ],
        expectedSuccessRate: "23%",
        rationale: [
          "유사 케이스 15건 분석",
          "한국 공급사와 거래 이력 있음",
          "최근 중국 공급사 변경 시도 신호 감지",
        ],
      },
      emailDraft: {
        subject: "High-Quality [Product] from South Korea - CE Certified",
        body: `Dear Purchasing Manager,

I hope this email finds you well. My name is [Your Name] from [Your Company], a leading manufacturer of [Product] in South Korea.

I noticed that ABC Trading Co. has been importing similar products from Asia. We believe we can offer you a compelling alternative with:

✓ Superior quality (ISO 9001, CE certified)
✓ Reliable delivery (average lead time: 3 weeks)
✓ Competitive pricing (within your budget range)

[Personalized value proposition based on their pain points]

Would you be open to a brief call next week to explore how we can support your business?

Best regards,
[Your Name]`,
        trackingNote: "[Tracking: Email open detection enabled]",
      },
    };
  }

  const countryCode = (country || "DE").toUpperCase().slice(0, 2);
  const displayName = name || `Buyer ${buyerId || "Unknown"}`;
  const years = 10 + (buyerId ? parseInt(buyerId.replace(/\D/g, "1").slice(0, 2), 10) % 15 : 5);

  return {
    companyName: displayName,
    country: countryCode === "DE" ? "Germany" : countryCode === "US" ? "USA" : countryCode,
    countryEmoji: getEmoji(countryCode),
    founded: `${new Date().getFullYear() - years}년`,
    yearsActive: years,
    employees: "50-200명",
    website: `www.${displayName.toLowerCase().replace(/\s/g, "-")}.com`,
    purchasePattern: {
      mainImports: [
        { name: "전자 부품", hs: "8542", percent: 45 },
        { name: "기계류", hs: "8479", percent: 30 },
        { name: "플라스틱 제품", hs: "3926", percent: 25 },
      ],
      annualImportUsd: "$5.2M",
      avgOrderSize: "$85,000",
      orderFrequency: "분기 1회",
      mainSupplyCountries: [
        { country: "China", emoji: "🇨🇳", percent: 60 },
        { country: "Taiwan", emoji: "🇹🇼", percent: 25 },
        { country: "South Korea", emoji: "🇰🇷", percent: 10 },
        { country: "Japan", emoji: "🇯🇵", percent: 5 },
      ],
    },
    matchScore: 87,
    scoreBreakdown: {
      productFit: 32,
      volume: 21,
      reputation: 18,
      logistics: 8,
      responseRate: 8,
    },
    strategy: {
      approach: [
        "📧 이메일 아웃리치 (가장 효과적)",
        "📞 전화 팔로업 (2주 후)",
        "🤝 전시회 미팅",
      ],
      proposalPoints: [
        { type: "do", text: "한국 제조 품질 강조" },
        { type: "do", text: "납기 신뢰성" },
        { type: "do", text: "CE 인증 보유" },
        { type: "caution", text: "가격 경쟁력 필요" },
      ],
      expectedSuccessRate: "23%",
      rationale: ["유사 케이스 분석", "거래 이력 참고", "공급사 변경 신호"],
    },
    emailDraft: {
      subject: "High-Quality [Product] from South Korea - CE Certified",
      body: `Dear Purchasing Manager,\n\nWe would like to introduce [Your Company] and our [Product] capabilities...\n\nBest regards,\n[Your Name]`,
      trackingNote: "[Tracking: Email open detection enabled]",
    },
  };
}
