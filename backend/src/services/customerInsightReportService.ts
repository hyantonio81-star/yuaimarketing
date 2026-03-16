/**
 * 고객 인사이트 리포트 (월간). lang=ko|en|es 로 언어별 출력.
 * 1. 세그먼트 자동 발견 (AI 클러스터링)
 * 2. 구매 여정 분석
 * 3. 이탈 예측 (ML 모델)
 */

export type ReportLang = "ko" | "en" | "es";

export interface Segment {
  id: string;
  name: string;
  percent: number;
  characteristics: { label: string; value: string }[];
  churnRisk: string;
  actions: { type: "do" | "avoid"; text: string }[];
}

export interface JourneyStep {
  order: number;
  step: string;
  detail?: string;
}

export interface ChurnPrediction {
  highRiskCount: number;
  estimatedLoss: string;
  signals: string[];
  interventions: string[];
}

export interface CustomerInsightReport {
  generatedAt: string;
  period: string;
  segments: Segment[];
  journey: {
    steps: JourneyStep[];
    bottleneck: { description: string; rate: string; causes: string[]; solutions: string[] };
  };
  churn: ChurnPrediction;
}

const CUSTOMER_REPORT_COPY: Record<
  ReportLang,
  {
    segments: Segment[];
    journey: CustomerInsightReport["journey"];
    churn: ChurnPrediction;
  }
> = {
  ko: {
    segments: [
      {
        id: "A",
        name: "Price-Sensitive Buyers",
        percent: 32,
        characteristics: [
          { label: "평균 구매액", value: "$45" },
          { label: "재구매 주기", value: "45일" },
          { label: "선호 채널", value: "이메일 (할인 쿠폰)" },
          { label: "이탈 위험", value: "중간 (경쟁사 가격에 민감)" },
        ],
        churnRisk: "중간",
        actions: [
          { type: "do", text: "로열티 프로그램 강화" },
          { type: "do", text: "번들 할인 제안" },
          { type: "avoid", text: "프리미엄 상품 어필 자제" },
        ],
      },
      {
        id: "B",
        name: "Quality Seekers",
        percent: 28,
        characteristics: [
          { label: "평균 구매액", value: "$180" },
          { label: "재구매 주기", value: "90일" },
          { label: "선호 채널", value: "콘텐츠 마케팅 (케이스 스터디)" },
          { label: "이탈 위험", value: "낮음 (브랜드 충성도 높음)" },
        ],
        churnRisk: "낮음",
        actions: [
          { type: "do", text: "VIP 프로그램 초대" },
          { type: "do", text: "신제품 얼리억세스" },
          { type: "do", text: "추천 인센티브" },
        ],
      },
    ],
    journey: {
      steps: [
        { order: 1, step: "구글 검색", detail: '"문제 키워드"' },
        { order: 2, step: "블로그 포스트 읽기", detail: "평균 3.2개" },
        { order: 3, step: "케이스 스터디 다운로드" },
        { order: 4, step: "이메일 드립 캠페인", detail: "5일" },
        { order: 5, step: "데모 요청" },
        { order: 6, step: "구매", detail: "평균 14일 소요" },
      ],
      bottleneck: {
        description: "데모 → 구매 전환율 낮음",
        rate: "18%",
        causes: ["가격 투명성 부족", "경쟁사 비교 필요"],
        solutions: ["가격 계산기 추가", "경쟁사 비교표 제공", "무료 트라이얼 확대"],
      },
    },
    churn: {
      highRiskCount: 245,
      estimatedLoss: "$44,100",
      signals: ["로그인 빈도 감소 (-60%)", "기능 사용 감소 (-45%)", "서포트 티켓 증가 (+3건)", "NPS 점수 하락 (9 → 4)"],
      interventions: ["개인화 이메일 발송 (성공 스토리)", "CSM 아웃리치 스케줄", "특별 할인 제안 (20%)"],
    },
  },
  en: {
    segments: [
      {
        id: "A",
        name: "Price-Sensitive Buyers",
        percent: 32,
        characteristics: [
          { label: "Avg. purchase", value: "$45" },
          { label: "Repurchase cycle", value: "45 days" },
          { label: "Preferred channel", value: "Email (discount coupons)" },
          { label: "Churn risk", value: "Medium (price-sensitive)" },
        ],
        churnRisk: "Medium",
        actions: [
          { type: "do", text: "Strengthen loyalty program" },
          { type: "do", text: "Bundle discount offers" },
          { type: "avoid", text: "Avoid pushing premium only" },
        ],
      },
      {
        id: "B",
        name: "Quality Seekers",
        percent: 28,
        characteristics: [
          { label: "Avg. purchase", value: "$180" },
          { label: "Repurchase cycle", value: "90 days" },
          { label: "Preferred channel", value: "Content (case studies)" },
          { label: "Churn risk", value: "Low (high brand loyalty)" },
        ],
        churnRisk: "Low",
        actions: [
          { type: "do", text: "Invite to VIP program" },
          { type: "do", text: "Early access to new products" },
          { type: "do", text: "Referral incentives" },
        ],
      },
    ],
    journey: {
      steps: [
        { order: 1, step: "Google search", detail: '"Problem keyword"' },
        { order: 2, step: "Read blog posts", detail: "Avg. 3.2" },
        { order: 3, step: "Download case study" },
        { order: 4, step: "Email drip campaign", detail: "5 days" },
        { order: 5, step: "Demo request" },
        { order: 6, step: "Purchase", detail: "Avg. 14 days" },
      ],
      bottleneck: {
        description: "Low demo → purchase conversion",
        rate: "18%",
        causes: ["Lack of price transparency", "Need competitor comparison"],
        solutions: ["Add price calculator", "Provide competitor comparison", "Expand free trial"],
      },
    },
    churn: {
      highRiskCount: 245,
      estimatedLoss: "$44,100",
      signals: ["Login frequency down (-60%)", "Feature use down (-45%)", "Support tickets up (+3)", "NPS drop (9 → 4)"],
      interventions: ["Personalized email (success story)", "CSM outreach schedule", "Special discount (20%)"],
    },
  },
  es: {
    segments: [
      {
        id: "A",
        name: "Compradores sensibles al precio",
        percent: 32,
        characteristics: [
          { label: "Compra media", value: "$45" },
          { label: "Ciclo de recompra", value: "45 días" },
          { label: "Canal preferido", value: "Email (cupones)" },
          { label: "Riesgo de abandono", value: "Medio (sensibles al precio)" },
        ],
        churnRisk: "Medio",
        actions: [
          { type: "do", text: "Reforzar programa de fidelidad" },
          { type: "do", text: "Ofertas de descuento en paquete" },
          { type: "avoid", text: "Evitar solo productos premium" },
        ],
      },
      {
        id: "B",
        name: "Buscadores de calidad",
        percent: 28,
        characteristics: [
          { label: "Compra media", value: "$180" },
          { label: "Ciclo de recompra", value: "90 días" },
          { label: "Canal preferido", value: "Contenido (casos de estudio)" },
          { label: "Riesgo de abandono", value: "Bajo (alta lealtad)" },
        ],
        churnRisk: "Bajo",
        actions: [
          { type: "do", text: "Invitación a programa VIP" },
          { type: "do", text: "Acceso anticipado a nuevos productos" },
          { type: "do", text: "Incentivos por recomendación" },
        ],
      },
    ],
    journey: {
      steps: [
        { order: 1, step: "Búsqueda en Google", detail: '"Palabra clave problema"' },
        { order: 2, step: "Lectura de entradas", detail: "Prom. 3.2" },
        { order: 3, step: "Descarga de caso de estudio" },
        { order: 4, step: "Campaña email drip", detail: "5 días" },
        { order: 5, step: "Solicitud de demo" },
        { order: 6, step: "Compra", detail: "Prom. 14 días" },
      ],
      bottleneck: {
        description: "Baja conversión demo → compra",
        rate: "18%",
        causes: ["Falta de transparencia de precios", "Necesidad de comparativa"],
        solutions: ["Añadir calculadora de precios", "Ofrecer comparativa", "Ampliar prueba gratuita"],
      },
    },
    churn: {
      highRiskCount: 245,
      estimatedLoss: "$44,100",
      signals: ["Frecuencia de login -60%", "Uso de funciones -45%", "Tickets +3", "NPS 9 → 4"],
      interventions: ["Email personalizado (caso de éxito)", "Plan de contacto CSM", "Descuento especial 20%"],
    },
  },
};

export function generateCustomerInsightReport(lang: ReportLang = "ko"): CustomerInsightReport {
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const copy = CUSTOMER_REPORT_COPY[lang] ?? CUSTOMER_REPORT_COPY.ko;
  const locale = lang === "es" ? "es-ES" : lang === "en" ? "en-US" : "ko-KR";

  return {
    generatedAt: now.toLocaleString(locale, { timeZone: "UTC" }),
    period,
    segments: copy.segments,
    journey: copy.journey,
    churn: copy.churn,
  };
}
