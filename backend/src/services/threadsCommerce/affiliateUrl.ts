/**
 * 상품 URL에 제휴(Tracking ID) 파라미터를 붙여 전용 링크 생성.
 * 공급처 결제 페이지로 사용자를 넘기고, 쿠키/귀속 기간 내 구매 시 수수료 귀속.
 */
import type { CommerceProduct } from "./types.js";

export interface AffiliateConfig {
  /** Amazon Associates tag (예: yoursite-20) */
  amazonAssociateTag?: string;
  /** AliExpress 제휴 쿼리 (예: aff_fcid=xxx 또는 aff_trace_key=xxx) */
  aliexpressAffiliateParams?: string;
  /** Temu 제휴 쿼리 (예: aff_xxx=yyy) */
  temuAffiliateParams?: string;
  /** Shein은 피드 URL이 이미 제휴 링크이면 추가 파라미터 불필요 */
}

function appendParam(url: string, param: string): string {
  const trimmed = param.trim();
  if (!trimmed) return url;
  try {
    const u = new URL(url);
    if (u.search) {
      u.search += "&" + trimmed;
    } else {
      u.search = trimmed.startsWith("?") ? trimmed : "?" + trimmed;
    }
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * 마켓플레이스별 상품 URL에 제휴 파라미터를 붙인 링크 반환.
 * 설정이 없으면 원본 url 그대로 반환.
 */
export function buildAffiliateProductUrl(
  product: CommerceProduct,
  config: AffiliateConfig
): string {
  const { url, marketplace } = product;
  if (!url?.trim()) return url ?? "";

  switch (marketplace) {
    case "amazon": {
      const tag = config.amazonAssociateTag?.trim();
      if (!tag) return url;
      return appendParam(url, `tag=${encodeURIComponent(tag)}`);
    }
    case "aliexpress": {
      const params = config.aliexpressAffiliateParams?.trim();
      if (!params) return url;
      return appendParam(url, params.replace(/^\?/, ""));
    }
    case "temu": {
      const params = config.temuAffiliateParams?.trim();
      if (!params) return url;
      return appendParam(url, params.replace(/^\?/, ""));
    }
    case "shein":
      // 쉬인은 제휴 피드에서 받은 URL이 이미 추적 링크인 경우가 많음. 추가 파라미터 없이 반환.
      return url;
    default:
      return url;
  }
}
