/**
 * handle_negative_review: 부정 리뷰 처리
 * 심각도 평가 → low: 자동 응답(할인쿠폰) · medium: 검토 대기 · high: 에스컬레이션 + 임시 응답
 */

export type Severity = "low" | "medium" | "high";

export interface NegativeReviewInput {
  id?: string;
  text: string;
  channel?: string;
  rating?: number;
}

export interface HandleNegativeReviewResult {
  severity: Severity;
  response: string;
  action: "auto_posted" | "queued_for_approval" | "escalated";
  offer?: string;
  commitment?: string;
  alerts_sent?: string[];
}

function assessSeverity(review: NegativeReviewInput): Severity {
  const t = (review.text || "").toLowerCase();
  if (
    t.includes("환불") ||
    t.includes("사기") ||
    t.includes("법적") ||
    t.includes("매우 화남") ||
    (review.rating != null && review.rating <= 1)
  )
    return "high";
  if (
    t.includes("불만") ||
    t.includes("실망") ||
    t.includes("배송 지연") ||
    t.includes("불량") ||
    (review.rating != null && review.rating <= 2)
  )
    return "medium";
  return "low";
}

function gpt4GenerateResponse(
  review: NegativeReviewInput,
  opts: {
    tone: string;
    offer?: string;
    commitment?: string;
  }
): string {
  const templates: Record<string, string> = {
    apologetic:
      "불편을 드려 죄송합니다. 소중한 의견 감사합니다. 개선하겠습니다. 10% 할인 쿠폰을 발송해 두었습니다.",
    apologetic_detailed:
      "불편을 끼쳐 드려 진심으로 사과드립니다. 교환/환불 원하시면 고객센터로 연락 주시면 신속히 도와드리겠습니다.",
    deeply_apologetic:
      "심각한 불편을 드려 대단히 죄송합니다. 24시간 내 담당자가 직접 연락드리겠습니다. 감사합니다.",
  };
  const key = opts.tone.replace("_detailed", "").replace("_24h", "").replace("deeply_", "");
  return templates[key] || templates.apologetic;
}

/** @param _orgId scope for future org-specific handling */
export function handleNegativeReview(review: NegativeReviewInput, _orgId?: string, _countryCode?: string): HandleNegativeReviewResult {
  const severity = assessSeverity(review);

  if (severity === "low") {
    const response = gpt4GenerateResponse(review, {
      tone: "apologetic",
      offer: "discount_coupon_10%",
    });
    return {
      severity: "low",
      response,
      action: "auto_posted",
      offer: "discount_coupon_10%",
    };
  }

  if (severity === "medium") {
    const response = gpt4GenerateResponse(review, {
      tone: "apologetic_detailed",
      offer: "replacement_or_refund",
    });
    return {
      severity: "medium",
      response,
      action: "queued_for_approval",
      offer: "replacement_or_refund",
    };
  }

  const response = gpt4GenerateResponse(review, {
    tone: "deeply_apologetic",
    commitment: "personal_followup_24h",
  });
  return {
    severity: "high",
    response,
    action: "escalated",
    commitment: "personal_followup_24h",
    alerts_sent: ["customer_service_manager", "product_team"],
  };
}
