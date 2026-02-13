/**
 * churn_prevention_campaign: 이탈 위험 고객 식별 → CLV 우선순위 → 개인화 윈백 캠페인(이메일/SMS)
 */

export interface Customer {
  id: string;
  email: string;
  phone?: string;
  days_since_last_order: number;
  order_count: number;
  avg_order_value: number;
  email_open_rate: number;
  ticket_count: number;
}

export interface AtRiskItem {
  customer: Customer;
  churn_prob: number;
  clv: number;
}

export interface WinbackCampaign {
  subject: string;
  body: string;
  offer: string;
  sms_text: string;
}

export interface ChurnPreventionResult {
  at_risk_count: number;
  at_risk_top: Array<{
    customer_id: string;
    email: string;
    churn_prob: number;
    clv: number;
    priority_score: number;
    campaign_sent: boolean;
    sms_sent: boolean;
  }>;
  emails_sent: number;
  sms_sent: number;
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getActiveCustomers(): Customer[] {
  const count = 50 + (simpleHash("customers") % 100);
  return Array.from({ length: count }, (_, i) => {
    const id = `C${1000 + i}`;
    return {
      id,
      email: `user${i}@example.com`,
      phone: i % 3 === 0 ? `010-${String(i).padStart(4, "0")}-${String(i).padStart(4, "0")}` : undefined,
      days_since_last_order: 10 + (simpleHash(id + "days") % 80),
      order_count: 1 + (simpleHash(id + "ord") % 15),
      avg_order_value: 30000 + (simpleHash(id + "aov") % 120000),
      email_open_rate: 0.1 + (simpleHash(id + "open") % 80) / 100,
      ticket_count: simpleHash(id + "ticket") % 5,
    };
  });
}

function mlPredictChurn(params: {
  last_purchase_days: number;
  purchase_frequency: number;
  avg_order_value: number;
  email_engagement: number;
  support_tickets: number;
}): number {
  const { last_purchase_days, purchase_frequency, email_engagement, support_tickets } = params;
  let p = 0.2;
  if (last_purchase_days > 30) p += 0.25;
  if (last_purchase_days > 60) p += 0.2;
  if (purchase_frequency < 3) p += 0.15;
  if (email_engagement < 0.3) p += 0.15;
  if (support_tickets > 2) p += 0.1;
  return Math.min(0.95, p + (simpleHash(JSON.stringify(params)) % 20) / 100);
}

function calculateClv(customer: Customer): number {
  const base = customer.avg_order_value * customer.order_count * 0.4;
  const retention = 1 - (customer.days_since_last_order / 365) * 0.3;
  return Math.round(Math.max(0, base * (0.5 + retention)));
}

function designWinbackCampaign(customer: Customer): WinbackCampaign {
  return {
    subject: `[맞춤 혜택] ${customer.email.split("@")[0]}님을 위한 특별 제안`,
    body: `안녕하세요. 오랜만에 찾아뵙습니다. ${customer.order_count}번의 구매 이력을 바탕으로 맞춤 혜택을 준비했습니다. 15% 할인 쿠폰이 발급되었습니다.`,
    offer: "15%_winback_coupon",
    sms_text: `[브랜드] 감사합니다. 15% 할인 쿠폰이 대기 중입니다. 링크에서 확인하세요.`,
  };
}

export function churnPreventionCampaign(limit: number = 100): ChurnPreventionResult {
  const customers = getActiveCustomers();
  const at_risk: AtRiskItem[] = [];

  for (const customer of customers) {
    const churn_prob = mlPredictChurn({
      last_purchase_days: customer.days_since_last_order,
      purchase_frequency: customer.order_count,
      avg_order_value: customer.avg_order_value,
      email_engagement: customer.email_open_rate,
      support_tickets: customer.ticket_count,
    });

    if (churn_prob > 0.6) {
      at_risk.push({
        customer,
        churn_prob,
        clv: calculateClv(customer),
      });
    }
  }

  const at_risk_sorted = [...at_risk].sort(
    (a, b) => b.clv * b.churn_prob - a.clv * a.churn_prob
  );

  const top = at_risk_sorted.slice(0, limit);
  let emails_sent = 0;
  let sms_sent = 0;

  const at_risk_top = top.map((item) => {
    designWinbackCampaign(item.customer);
    emails_sent += 1;
    const sms = item.clv > 1000 && item.customer.phone;
    if (sms) sms_sent += 1;
    return {
      customer_id: item.customer.id,
      email: item.customer.email,
      churn_prob: Math.round(item.churn_prob * 100) / 100,
      clv: item.clv,
      priority_score: Math.round(item.clv * item.churn_prob),
      campaign_sent: true,
      sms_sent: !!sms,
    };
  });

  return {
    at_risk_count: at_risk.length,
    at_risk_top,
    emails_sent,
    sms_sent,
  };
}
