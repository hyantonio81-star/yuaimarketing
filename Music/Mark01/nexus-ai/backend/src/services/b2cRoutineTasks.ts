/**
 * B2C 일과 태스크: Nexus daily routine에서 호출
 * 반자율화 시 sensitives는 승인 대기로 쌓고, 자율화 시 실행만 반환
 */
import { getConnections } from "./ecommerceConnectionsService.js";
import { churnPreventionCampaign } from "./churnPreventionService.js";
import { calculateOptimalPrice } from "./optimalPriceService.js";
import { isAiAutomationEnabled } from "./b2cSettingsService.js";
import { addPending } from "./b2cPendingApprovalsService.js";

const DEFAULT_ORG = "default";

export interface B2cTaskResult {
  status: "ok" | "error";
  message: string;
  details?: Record<string, unknown>;
}

/** 04:00 inventory_sync — 연동 채널 수·재고 점검 요약(스텁) */
export async function runB2cInventorySyncTask(): Promise<B2cTaskResult> {
  try {
    const connections = await getConnections(DEFAULT_ORG);
    return {
      status: "ok",
      message: "B2C inventory_sync checked",
      details: { connections_count: connections.length },
    };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "inventory_sync failed",
    };
  }
}

/** 05:00 price_optimization — 대표 상품 1건 최적가 계산. 반자율화 시 승인 대기 추가 */
export async function runB2cPriceOptimizationTask(): Promise<B2cTaskResult> {
  try {
    const product = {
      sku: "ROUTINE-SKU",
      cost: 10000,
      target_margin: 0.3,
      current_price: 15000,
    };
    const result = calculateOptimalPrice(product, "Coupang", DEFAULT_ORG, undefined);
    const automationOn = isAiAutomationEnabled(DEFAULT_ORG);
    if (!automationOn && result.price_updated) {
      addPending(DEFAULT_ORG, "price_change", {
        sku: product.sku,
        channel: "Coupang",
        current_price: product.current_price,
        recommended_price: result.recommended_price,
        factors: result.factors,
      });
    }
    return {
      status: "ok",
      message: "B2C price_optimization ran",
      details: {
        sku: product.sku,
        recommended_price: result.recommended_price,
        price_updated: result.price_updated,
        ai_automation_enabled: automationOn,
      },
    };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "price_optimization failed",
    };
  }
}

/** 09:00 churn_prevention_check — 이탈 방지 캠페인 실행 */
export async function runB2cChurnPreventionTask(): Promise<B2cTaskResult> {
  try {
    const limit = 50;
    const result = churnPreventionCampaign(limit, DEFAULT_ORG, undefined);
    const automationOn = isAiAutomationEnabled(DEFAULT_ORG);
    if (!automationOn && result.emails_sent > 0) {
      addPending(DEFAULT_ORG, "winback_send", {
        emails_sent: result.emails_sent,
        sms_sent: result.sms_sent,
        at_risk_count: result.at_risk_count,
      });
    }
    return {
      status: "ok",
      message: "B2C churn_prevention_check ran",
      details: {
        at_risk_count: result.at_risk_count,
        emails_sent: result.emails_sent,
        sms_sent: result.sms_sent,
        ai_automation_enabled: automationOn,
      },
    };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "churn_prevention failed",
    };
  }
}
