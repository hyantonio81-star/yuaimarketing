/**
 * 시장성 평가 리포트 (전체 리포트 형식). lang=ko|en|es 로 언어별 출력.
 */

import { marketScore } from "./marketScoreService.js";

export type ReportLang = "ko" | "en" | "es";

const MARKET_REPORT_COPY: Record<
  ReportLang,
  {
    marketSize: { sufficient: string; limited: string };
    competition: { timing: string; opportunity: string; intense: string };
    profitability: { strong: string; review: string };
    trend: { momentum: string };
    risks: string[];
    verdict: { recommend: string; caution: string };
    strategy: string;
    breakevenLabel: string;
  }
> = {
  ko: {
    marketSize: { sufficient: "✅ 충분한 시장 규모", limited: "⚠️ 제한적 시장 규모" },
    competition: { timing: "적절 (성장기 초기)", opportunity: "⚠️ 경쟁 있으나 기회 존재", intense: "⚠️ 경쟁 심화" },
    profitability: { strong: "✅ 우수한 수익성", review: "⚠️ 수익성 검토 필요" },
    trend: { momentum: "✅ 강한 상승 모멘텀" },
    risks: [
      "⚠️ 규제 변화 가능성 (FDA 승인 필요)",
      "⚠️ 공급망 리스크 (원자재 중국 의존 78%)",
      "⚠️ 기술 변화 속도 (18개월 제품 수명)",
    ],
    verdict: { recommend: "✅ **진입 권장** - 시장성 높음", caution: "⚠️ **신중 검토** - 리스크 관리 필요" },
    strategy: "프리미엄 포지셔닝 + 틈새 공략",
    breakevenLabel: "개월",
  },
  en: {
    marketSize: { sufficient: "✅ Sufficient market size", limited: "⚠️ Limited market size" },
    competition: { timing: "Appropriate (early growth)", opportunity: "⚠️ Competition but opportunity exists", intense: "⚠️ Intense competition" },
    profitability: { strong: "✅ Strong profitability", review: "⚠️ Profitability review needed" },
    trend: { momentum: "✅ Strong upward momentum" },
    risks: [
      "⚠️ Regulatory change (FDA approval may be required)",
      "⚠️ Supply chain risk (78% raw material dependency on China)",
      "⚠️ Pace of tech change (18‑month product lifecycle)",
    ],
    verdict: { recommend: "✅ **Recommend entry** - High market potential", caution: "⚠️ **Proceed with caution** - Risk management needed" },
    strategy: "Premium positioning + niche focus",
    breakevenLabel: "months",
  },
  es: {
    marketSize: { sufficient: "✅ Tamaño de mercado suficiente", limited: "⚠️ Tamaño de mercado limitado" },
    competition: { timing: "Apropiado (fase de crecimiento temprano)", opportunity: "⚠️ Competencia pero existe oportunidad", intense: "⚠️ Competencia intensa" },
    profitability: { strong: "✅ Rentabilidad sólida", review: "⚠️ Revisar rentabilidad" },
    trend: { momentum: "✅ Fuerte momentum alcista" },
    risks: [
      "⚠️ Cambio regulatorio (posible aprobación FDA)",
      "⚠️ Riesgo de cadena de suministro (78% dependencia de China)",
      "⚠️ Velocidad del cambio tecnológico (ciclo de vida 18 meses)",
    ],
    verdict: { recommend: "✅ **Recomendado entrar** - Alto potencial", caution: "⚠️ **Revisar con cautela** - Gestión de riesgos necesaria" },
    strategy: "Posicionamiento premium + enfoque en nicho",
    breakevenLabel: "meses",
  },
};

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function deriveStubs(item: string) {
  const h = simpleHash(item);
  const tam = 3 + (h % 5) + (h % 10) / 10; // 3.0 ~ 8.0 B
  const sam = tam * (0.25 + (h % 20) / 100); // 25%~45% of TAM
  const som = sam * (0.05 + (h % 10) / 100); // 5%~15% of SAM
  const cagr = 8 + (h % 8) + (h % 10) / 10; // 8.0 ~ 16.0%
  const competitors = 4 + (h % 6);
  const hhi = 800 + (h % 800); // 800 ~ 1600
  const margin = 20 + (h % 15); // 20%~35%
  const cac = 30 + (h % 40); // $30~70
  const ltv = 400 + (h % 500); // $400~900
  const searchGrowth = 20 + (h % 25); // 20%~45%
  const socialGrowth = 15 + (h % 25); // 15%~40%
  const investment6m = 200 + (h % 200); // $200M~400M
  const investMin = 80 + (h % 80); // 80~160k
  const investMax = investMin * 2;
  const breakevenMonths = 12 + (h % 10); // 12~22
  return {
    tam: tam.toFixed(1),
    sam: sam.toFixed(1),
    som: (som * 1000).toFixed(0),
    cagr: cagr.toFixed(1),
    competitors,
    hhi,
    margin,
    cac,
    ltv: Math.round(ltv / 10) * 10,
    ltvCac: (ltv / cac).toFixed(1),
    searchGrowth,
    socialGrowth,
    investment6m,
    investMin,
    investMax,
    breakevenMonths,
  };
}

export interface MarketReport {
  productName: string;
  generatedAt: string;
  totalScore: number;
  starRating: string;
  sections: {
    marketSize: { tam: string; sam: string; som: string; cagr: string; evaluation: string };
    competition: { competitors: number; hhi: number; entryTiming: string; evaluation: string };
    profitability: { avgMargin: number; cac: number; ltv: number; ltvCac: string; evaluation: string };
    trend: { searchGrowth: number; socialGrowth: number; investment6m: number; evaluation: string };
    risks: string[];
    aiRecommendation: {
      verdict: string;
      strategy: string;
      investmentRange: string;
      breakeven: string;
    };
  };
}

function getLocale(lang: ReportLang): string {
  return lang === "es" ? "es-ES" : lang === "en" ? "en-US" : "ko-KR";
}

export function generateMarketReport(productName: string, lang: ReportLang = "ko"): MarketReport {
  const item = (productName || "제품").trim() || "제품";
  const scoreResult = marketScore(item);
  const total = Math.round(scoreResult.total);
  const stars = total >= 80 ? "⭐⭐⭐⭐⭐" : total >= 60 ? "⭐⭐⭐⭐" : total >= 40 ? "⭐⭐⭐" : "⭐⭐";

  const s = deriveStubs(item);
  const ltvNum = Number(s.ltv);
  const cacNum = Number(s.cac);
  const copy = MARKET_REPORT_COPY[lang] ?? MARKET_REPORT_COPY.ko;

  return {
    productName: item,
    generatedAt: new Date().toLocaleString(getLocale(lang), { timeZone: "UTC" }),
    totalScore: total,
    starRating: stars,
    sections: {
      marketSize: {
        tam: `$${s.tam}B`,
        sam: `$${s.sam}B`,
        som: `$${s.som}M`,
        cagr: `${s.cagr}%`,
        evaluation: total >= 50 ? copy.marketSize.sufficient : copy.marketSize.limited,
      },
      competition: {
        competitors: s.competitors,
        hhi: s.hhi,
        entryTiming: copy.competition.timing,
        evaluation: s.competitors <= 6 ? copy.competition.opportunity : copy.competition.intense,
      },
      profitability: {
        avgMargin: s.margin,
        cac: s.cac,
        ltv: ltvNum,
        ltvCac: s.ltvCac,
        evaluation: ltvNum / cacNum >= 10 ? copy.profitability.strong : copy.profitability.review,
      },
      trend: {
        searchGrowth: s.searchGrowth,
        socialGrowth: s.socialGrowth,
        investment6m: s.investment6m,
        evaluation: copy.trend.momentum,
      },
      risks: copy.risks,
      aiRecommendation: {
        verdict: total >= 60 ? copy.verdict.recommend : copy.verdict.caution,
        strategy: copy.strategy,
        investmentRange: `$${Math.round(Number(s.investMin) / 1000)}K-${Math.round(Number(s.investMax) / 1000)}K`,
        breakeven: `${s.breakevenMonths}-${s.breakevenMonths + 4} ${copy.breakevenLabel}`,
      },
    },
  };
}
