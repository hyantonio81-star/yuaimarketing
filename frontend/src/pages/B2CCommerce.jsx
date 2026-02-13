import { useState } from "react";
import { ShoppingCart, Store, Globe, Share2, Package, RefreshCw, AlertTriangle, Truck, FileText, Mail, CheckCircle, Tag, TrendingUp, Megaphone, Calendar, DollarSign, MessageSquare, ThumbsUp, ThumbsDown, Users, Smartphone, Sparkles } from "lucide-react";
import SectionCard from "../components/SectionCard";
import { api } from "../lib/api";

const OWN_CHANNELS = [
  "Shopify",
  "WooCommerce",
  "Custom Website",
];

const MARKETPLACE_KR = [
  "쿠팡 (Coupang)",
  "네이버 스마트스토어",
  "11번가",
  "지마켓, 옥션",
];

const MARKETPLACE_GLOBAL = [
  "Amazon (US, JP, EU)",
  "eBay",
  "Walmart Marketplace",
  "Rakuten (일본)",
  "Lazada (동남아)",
];

const SOCIAL_COMMERCE = [
  "Facebook/Instagram Shop",
  "TikTok Shop",
  "Pinterest Shopping",
];

export default function B2CCommerce() {
  const [sku, setSku] = useState("");
  const [quantityChange, setQuantityChange] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [orderId, setOrderId] = useState("");
  const [orderEmail, setOrderEmail] = useState("");
  const [orderItems, setOrderItems] = useState("SKU-001 2\nSKU-002 1");
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [orderError, setOrderError] = useState(null);

  const [priceSku, setPriceSku] = useState("");
  const [priceCost, setPriceCost] = useState("");
  const [priceMargin, setPriceMargin] = useState("0.3");
  const [priceCurrent, setPriceCurrent] = useState("");
  const [priceChannel, setPriceChannel] = useState("Coupang");
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceResult, setPriceResult] = useState(null);
  const [priceError, setPriceError] = useState(null);

  const [promoSku, setPromoSku] = useState("");
  const [promoName, setPromoName] = useState("");
  const [promoBasePrice, setPromoBasePrice] = useState("");
  const [promoGoal, setPromoGoal] = useState("revenue");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState(null);
  const [promoError, setPromoError] = useState(null);

  const [reviewSku, setReviewSku] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [reviewError, setReviewError] = useState(null);

  const [negReviewText, setNegReviewText] = useState("");
  const [negReviewRating, setNegReviewRating] = useState("");
  const [negReviewLoading, setNegReviewLoading] = useState(false);
  const [negReviewResult, setNegReviewResult] = useState(null);
  const [negReviewError, setNegReviewError] = useState(null);

  const [churnLoading, setChurnLoading] = useState(false);
  const [churnResult, setChurnResult] = useState(null);
  const [churnError, setChurnError] = useState(null);

  const [recCustomerId, setRecCustomerId] = useState("");
  const [recCategory, setRecCategory] = useState("electronics");
  const [recContext, setRecContext] = useState("email");
  const [recLoading, setRecLoading] = useState(false);
  const [recResult, setRecResult] = useState(null);
  const [recError, setRecError] = useState(null);

  const runInventorySync = async () => {
    if (!sku.trim() || quantityChange === "") return;
    setSyncing(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.post("/b2c/inventory-sync", {
        sku: sku.trim(),
        quantity_change: Number(quantityChange),
      });
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const runProcessOrder = async () => {
    if (!orderId.trim() || !orderEmail.trim()) return;
    const items = orderItems
      .split("\n")
      .map((line) => line.trim().split(/\s+/))
      .filter((parts) => parts.length >= 2)
      .map((parts) => ({ sku: parts[0], quantity: parseInt(parts[1], 10) || 1 }));
    if (items.length === 0) {
      setOrderError("items: one per line, e.g. SKU-001 2");
      return;
    }
    setOrderProcessing(true);
    setOrderError(null);
    setOrderResult(null);
    try {
      const { data } = await api.post("/b2c/process-order", {
        id: orderId.trim(),
        customer: { email: orderEmail.trim() },
        items,
      });
      setOrderResult(data);
    } catch (e) {
      setOrderError(e.response?.data?.error || e.message || "Process failed");
    } finally {
      setOrderProcessing(false);
    }
  };

  const runOptimalPrice = async () => {
    const cost = Number(priceCost);
    const margin = Number(priceMargin);
    const current = Number(priceCurrent);
    if (!priceSku.trim() || Number.isNaN(cost) || Number.isNaN(margin) || Number.isNaN(current)) {
      setPriceError("SKU, 원가, 목표마진, 현재가를 입력하세요.");
      return;
    }
    setPriceLoading(true);
    setPriceError(null);
    setPriceResult(null);
    try {
      const { data } = await api.post("/b2c/optimal-price", {
        product: { sku: priceSku.trim(), cost, target_margin: margin, current_price: current },
        channel: priceChannel,
      });
      setPriceResult(data);
    } catch (e) {
      setPriceError(e.response?.data?.error || e.message || "Failed");
    } finally {
      setPriceLoading(false);
    }
  };

  const PRICE_CHANNELS = ["Coupang", "Naver SmartStore", "Shopify", "Amazon", "11번가"];

  const runPromotionPlan = async () => {
    if (!promoSku.trim()) {
      setPromoError("상품 SKU를 입력하세요.");
      return;
    }
    setPromoLoading(true);
    setPromoError(null);
    setPromoResult(null);
    try {
      const { data } = await api.post("/b2c/promotion-plan", {
        product: {
          sku: promoSku.trim(),
          ...(promoName.trim() && { name: promoName.trim() }),
          ...(promoBasePrice !== "" && { base_price: Number(promoBasePrice) }),
        },
        goal: promoGoal,
      });
      setPromoResult(data);
    } catch (e) {
      setPromoError(e.response?.data?.error || e.message || "Failed");
    } finally {
      setPromoLoading(false);
    }
  };

  const runReviewAnalysis = async () => {
    if (!reviewSku.trim()) {
      setReviewError("상품 SKU를 입력하세요.");
      return;
    }
    setReviewLoading(true);
    setReviewError(null);
    setReviewResult(null);
    try {
      const { data } = await api.post("/b2c/review-analysis", { product: { sku: reviewSku.trim() } });
      setReviewResult(data);
    } catch (e) {
      setReviewError(e.response?.data?.error || e.message || "Failed");
    } finally {
      setReviewLoading(false);
    }
  };

  const runHandleNegativeReview = async () => {
    if (!negReviewText.trim()) {
      setNegReviewError("리뷰 내용을 입력하세요.");
      return;
    }
    setNegReviewLoading(true);
    setNegReviewError(null);
    setNegReviewResult(null);
    try {
      const { data } = await api.post("/b2c/handle-negative-review", {
        review: {
          text: negReviewText.trim(),
          ...(negReviewRating !== "" && { rating: Number(negReviewRating) }),
        },
      });
      setNegReviewResult(data);
    } catch (e) {
      setNegReviewError(e.response?.data?.error || e.message || "Failed");
    } finally {
      setNegReviewLoading(false);
    }
  };

  const runChurnCampaign = async () => {
    setChurnLoading(true);
    setChurnError(null);
    setChurnResult(null);
    try {
      const { data } = await api.post("/b2c/churn-prevention-campaign", { limit: 100 });
      setChurnResult(data);
    } catch (e) {
      setChurnError(e.response?.data?.error || e.message || "Failed");
    } finally {
      setChurnLoading(false);
    }
  };

  const runRecommendations = async () => {
    if (!recCustomerId.trim()) {
      setRecError("고객 ID를 입력하세요.");
      return;
    }
    setRecLoading(true);
    setRecError(null);
    setRecResult(null);
    try {
      const { data } = await api.post("/b2c/recommendations", {
        customer: { id: recCustomerId.trim(), favorite_category: recCategory || undefined },
        context: recContext,
      });
      setRecResult(data);
    } catch (e) {
      setRecError(e.response?.data?.error || e.message || "Failed");
    } finally {
      setRecLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Pillar 3 — B2C 이커머스 자동화
        </h1>
        <p className="text-muted-foreground mt-1">
          온라인 판매 통합 관리 (30%)
        </p>
      </header>

      <SectionCard title="Module 3.1: 멀티채널 판매 관리 (12%) — Omnichannel Sales Manager" className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          통합 판매 채널: 자체 몰 · 마켓플레이스(국내/해외) · 소셜 커머스
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 font-medium text-foreground mb-2">
              <Store className="w-4 h-4 text-pillar3" />
              자체 몰
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {OWN_CHANNELS.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 font-medium text-foreground mb-2">
              <ShoppingCart className="w-4 h-4 text-pillar3" />
              마켓플레이스 (국내)
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {MARKETPLACE_KR.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 font-medium text-foreground mb-2">
              <Globe className="w-4 h-4 text-pillar3" />
              마켓플레이스 (해외)
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {MARKETPLACE_GLOBAL.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 font-medium text-foreground mb-2">
              <Share2 className="w-4 h-4 text-pillar3" />
              소셜 커머스
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {SOCIAL_COMMERCE.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="재고 동기화 (Inventory Sync)" className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          중앙 재고 업데이트 후 채널별 AI 배분 · 품절 임박 시 알림
        </p>
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">SKU</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. SKU-001"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">재고 변동</label>
            <input
              type="number"
              value={quantityChange}
              onChange={(e) => setQuantityChange(e.target.value)}
              placeholder="e.g. -10"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-28"
            />
          </div>
          <button
            onClick={runInventorySync}
            disabled={syncing || !sku.trim() || quantityChange === ""}
            className="flex items-center gap-2 rounded bg-pillar3 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "동기화 중…" : "재고 업데이트"}
          </button>
        </div>
        {error && (
          <p className="text-sm text-destructive mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </p>
        )}
        {result && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Package className="w-4 h-4 text-pillar3" />
              중앙 재고: {result.central_stock} (변동 {result.quantity_change >= 0 ? "+" : ""}{result.quantity_change})
            </div>
            {result.low_stock_alert && (
              <div className="flex items-center gap-2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 px-3 py-2 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                품절 임박 · 구매팀 알림 · 권장 발주: {result.suggested_reorder_qty}개
              </div>
            )}
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">채널별 결과</div>
              <ul className="space-y-2">
                {result.channel_results?.map((r, i) => (
                  <li key={i} className="flex justify-between items-center text-sm rounded border border-border bg-background/50 px-3 py-2">
                    <span className="font-medium">{r.channel}</span>
                    <span className="text-muted-foreground">
                      {r.action === "restock_or_hide" ? "자동 보충/숨김" : `배분 ${r.allocation} (안전재고 ${r.safety_stock})`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="주문 자동 처리 (Process Order Auto)" className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          주문 검증 → 재고 예약 → 결제 → 송장/피킹 → 배송라벨 → 고객 알림 → 상태 동기화
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">주문 ID</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. ORD-2024-001"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">고객 이메일</label>
            <input
              type="email"
              value={orderEmail}
              onChange={(e) => setOrderEmail(e.target.value)}
              placeholder="customer@example.com"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium text-muted-foreground mb-1">품목 (한 줄에 SKU 수량)</label>
          <textarea
            value={orderItems}
            onChange={(e) => setOrderItems(e.target.value)}
            placeholder={"SKU-001 2\nSKU-002 1"}
            rows={3}
            className="rounded border border-border bg-background px-3 py-2 text-sm w-full font-mono"
          />
        </div>
        <button
          onClick={runProcessOrder}
          disabled={orderProcessing || !orderId.trim() || !orderEmail.trim()}
          className="flex items-center gap-2 rounded bg-pillar3 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          <CheckCircle className={`w-4 h-4 ${orderProcessing ? "animate-pulse" : ""}`} />
          {orderProcessing ? "처리 중…" : "주문 처리 실행"}
        </button>
        {orderError && (
          <p className="text-sm text-destructive mt-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {orderError}
          </p>
        )}
        {orderResult && (
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div className="flex items-center gap-2 font-medium">
              {orderResult.status === "processing" && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-foreground">처리 완료</span>
                </>
              )}
              {orderResult.status === "flagged_manual_review" && (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-foreground">수동 검토 대상 (사기 점수 {orderResult.steps?.fraud_check?.score?.toFixed(2)})</span>
                </>
              )}
              {orderResult.status === "cancelled" && (
                <>
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-foreground">취소 — {orderResult.cancel_reason === "out_of_stock" ? "재고 부족" : "결제 실패"}</span>
                </>
              )}
            </div>
            {orderResult.status === "processing" && orderResult.steps && (
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-pillar3" />
                  송장: {orderResult.steps.invoice_id}
                </li>
                <li className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-pillar3" />
                  피킹: {orderResult.steps.picking_list_id} · 창고 전송 완료
                </li>
                <li className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-pillar3" />
                  택배: {orderResult.steps.carrier} · 도착예정: {orderResult.steps.estimated_delivery}
                </li>
                <li className="flex items-center gap-2">
                  <a href={orderResult.steps.tracking_url} target="_blank" rel="noopener noreferrer" className="text-pillar3 hover:underline">
                    {orderResult.steps.tracking_url}
                  </a>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  주문 확인 메일 발송 · 채널 상태 동기화 완료
                </li>
              </ul>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="최적 가격 계산 (Dynamic Pricing)" className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          경쟁사 가격 · 수요 탄력성 · 재고 수준 · 시간 요인 → ML 예측 → 제약(최소 마진 10%, 경쟁사+15% 한도)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">SKU</label>
            <input
              type="text"
              value={priceSku}
              onChange={(e) => setPriceSku(e.target.value)}
              placeholder="e.g. SKU-001"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">원가 (₩)</label>
            <input
              type="number"
              value={priceCost}
              onChange={(e) => setPriceCost(e.target.value)}
              placeholder="10000"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">목표 마진 (0.3 = 30%)</label>
            <input
              type="number"
              step="0.01"
              value={priceMargin}
              onChange={(e) => setPriceMargin(e.target.value)}
              placeholder="0.3"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">현재가 (₩)</label>
            <input
              type="number"
              value={priceCurrent}
              onChange={(e) => setPriceCurrent(e.target.value)}
              placeholder="15000"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">채널</label>
            <select
              value={priceChannel}
              onChange={(e) => setPriceChannel(e.target.value)}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            >
              {PRICE_CHANNELS.map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>
          <button
            onClick={runOptimalPrice}
            disabled={priceLoading || !priceSku.trim() || !priceCost || !priceCurrent}
            className="flex items-center gap-2 rounded bg-pillar3 px-4 py-2 text-sm font-medium text-black disabled:opacity-50 mt-6"
          >
            <Tag className="w-4 h-4" />
            {priceLoading ? "계산 중…" : "최적 가격 계산"}
          </button>
        </div>
        {priceError && (
          <p className="text-sm text-destructive mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {priceError}
          </p>
        )}
        {priceResult && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <TrendingUp className="w-4 h-4 text-pillar3" />
              권장가: ₩{priceResult.recommended_price?.toLocaleString()}
              {priceResult.price_updated && (
                <span className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">3% 이상 차이 → 가격 반영 권장</span>
              )}
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <li className="rounded border border-border bg-background/50 px-3 py-2">
                예상 판매량: <strong>{priceResult.expected_sales}</strong>
              </li>
              <li className="rounded border border-border bg-background/50 px-3 py-2">
                예상 매출: <strong>₩{priceResult.expected_revenue?.toLocaleString()}</strong>
              </li>
              <li className="rounded border border-border bg-background/50 px-3 py-2">
                예상 이익: <strong>₩{priceResult.expected_profit?.toLocaleString()}</strong>
              </li>
            </ul>
            {priceResult.factors && (
              <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                경쟁사 평균 ₩{priceResult.factors.avg_competitor_price?.toLocaleString()} · 재고비율 {priceResult.factors.inventory_ratio} · 구간 ₩{priceResult.factors.min_price?.toLocaleString()} ~ ₩{priceResult.factors.max_price?.toLocaleString()} · {priceResult.factors.time_factors?.season} · 이벤트 D-{priceResult.factors.time_factors?.days_to_event}
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="프로모션 전략 수립 (AI Promotion Plan)" className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          할인율·BOGO·번들 시나리오 시뮬레이션 → 목표(매출/이익/물량)별 최적 선택 → 실행 계획
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">상품 SKU</label>
            <input
              type="text"
              value={promoSku}
              onChange={(e) => setPromoSku(e.target.value)}
              placeholder="e.g. SKU-001"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">상품명 (선택)</label>
            <input
              type="text"
              value={promoName}
              onChange={(e) => setPromoName(e.target.value)}
              placeholder="상품 이름"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">기준가 (₩, 선택)</label>
            <input
              type="number"
              value={promoBasePrice}
              onChange={(e) => setPromoBasePrice(e.target.value)}
              placeholder="15000"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">목표</label>
            <select
              value={promoGoal}
              onChange={(e) => setPromoGoal(e.target.value)}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="revenue">매출 극대화</option>
              <option value="profit">이익 극대화</option>
              <option value="clearance">물량 소진(클리어런스)</option>
            </select>
          </div>
          <button
            onClick={runPromotionPlan}
            disabled={promoLoading || !promoSku.trim()}
            className="flex items-center gap-2 rounded bg-pillar3 px-4 py-2 text-sm font-medium text-black disabled:opacity-50 mt-6"
          >
            <Megaphone className="w-4 h-4" />
            {promoLoading ? "수립 중…" : "프로모션 전략 수립"}
          </button>
        </div>
        {promoError && (
          <p className="text-sm text-destructive mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {promoError}
          </p>
        )}
        {promoResult && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div className="font-medium text-foreground flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-pillar3" />
              권장 프로모션 ({promoResult.recommendation?.type}: {String(promoResult.recommendation?.value ?? promoResult.recommendation?.bundle_discount ?? "")}%)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="rounded border border-border bg-background/50 px-3 py-2">
                예상 매출 <strong>₩{promoResult.recommendation?.projected_revenue?.toLocaleString()}</strong>
              </div>
              <div className="rounded border border-border bg-background/50 px-3 py-2">
                예상 이익 <strong>₩{promoResult.recommendation?.projected_profit?.toLocaleString()}</strong>
              </div>
              <div className="rounded border border-border bg-background/50 px-3 py-2">
                예상 판매 <strong>{promoResult.recommendation?.projected_units_sold}</strong>개
              </div>
            </div>
            {promoResult.execution_plan && (
              <div className="text-sm space-y-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-pillar3" />
                  {promoResult.execution_plan.start_date} ~ {promoResult.execution_plan.end_date}
                </div>
                <p className="text-muted-foreground">카피: {promoResult.execution_plan.messaging}</p>
                <p className="text-muted-foreground">채널: {promoResult.execution_plan.channels?.join(", ")}</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-pillar3" />
                  예상 비용: ₩{promoResult.execution_plan.budget?.toLocaleString()}
                </div>
              </div>
            )}
            <details className="text-xs text-muted-foreground">
              <summary>전체 시나리오 {promoResult.all_scenarios?.length}개</summary>
              <ul className="mt-2 space-y-1">
                {promoResult.all_scenarios?.map((s, i) => (
                  <li key={i}>
                    {s.type} {s.value != null ? String(s.value) : `bundle ${s.bundle_discount}%`} — 매출 ₩{s.projected_revenue?.toLocaleString()}, 이익 ₩{s.projected_profit?.toLocaleString()}, {s.projected_units_sold}개
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </SectionCard>

      <SectionCard title="리뷰 분석 (Review Analysis)" className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          채널별 리뷰 수집 → 감정 분석 → 테마 추출 → 긍정/부정 하이라이트 · 액션 아이템(5회 이상 언급)
        </p>
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">상품 SKU</label>
            <input
              type="text"
              value={reviewSku}
              onChange={(e) => setReviewSku(e.target.value)}
              placeholder="e.g. SKU-001"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-40"
            />
          </div>
          <button
            onClick={runReviewAnalysis}
            disabled={reviewLoading || !reviewSku.trim()}
            className="flex items-center gap-2 rounded bg-pillar3 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" />
            {reviewLoading ? "분석 중…" : "리뷰 분석"}
          </button>
        </div>
        {reviewError && (
          <p className="text-sm text-destructive mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {reviewError}
          </p>
        )}
        {reviewResult && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-medium text-foreground">평균 평점 {reviewResult.overall_rating?.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">리뷰 {reviewResult.total_reviews}건</span>
              <span className="text-xs text-muted-foreground">
                감정: 긍정 {reviewResult.sentiment_distribution?.positive} / 중립 {reviewResult.sentiment_distribution?.neutral} / 부정 {reviewResult.sentiment_distribution?.negative}
              </span>
              {reviewResult.review_volume_trend && (
                <span className="text-xs">
                  리뷰량 추이: {reviewResult.review_volume_trend.period} {reviewResult.review_volume_trend.direction === "up" ? "↑" : reviewResult.review_volume_trend.direction === "down" ? "↓" : "→"} {reviewResult.review_volume_trend.change_pct > 0 ? "+" : ""}{reviewResult.review_volume_trend.change_pct}%
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <ThumbsUp className="w-4 h-4 text-green-500" />
                  긍정 하이라이트
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {reviewResult.positive_highlights?.map((t, i) => (
                    <li key={i}>· {t.description} ({t.frequency}회)</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <ThumbsDown className="w-4 h-4 text-amber-500" />
                  개선 영역
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {reviewResult.improvement_areas?.map((t, i) => (
                    <li key={i}>· {t.description} ({t.frequency}회)</li>
                  ))}
                </ul>
              </div>
            </div>
            {reviewResult.action_items?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <TrendingUp className="w-4 h-4 text-pillar3" />
                  액션 아이템 (5회 이상 부정 테마)
                </div>
                <ul className="space-y-2">
                  {reviewResult.action_items.map((a, i) => (
                    <li key={i} className="rounded border border-border bg-background/50 px-3 py-2 text-sm">
                      <strong>{a.issue}</strong> (심각도 {a.severity}) · 담당: {a.owner}
                      <p className="text-muted-foreground mt-1">{a.suggested_fix}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="부정 리뷰 대응 (Handle Negative Review)" className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          심각도 평가 → low: 자동 응답(10% 쿠폰) · medium: 검토 후 발송 · high: 에스컬레이션 + 24h 후속 약속
        </p>
        <div className="mb-4">
          <label className="block text-xs font-medium text-muted-foreground mb-1">리뷰 내용</label>
          <textarea
            value={negReviewText}
            onChange={(e) => setNegReviewText(e.target.value)}
            placeholder="예: 배송이 너무 느리고 포장이 불량했어요."
            rows={3}
            className="rounded border border-border bg-background px-3 py-2 text-sm w-full"
          />
        </div>
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">평점 (선택, 1–5)</label>
            <input
              type="number"
              min="1"
              max="5"
              value={negReviewRating}
              onChange={(e) => setNegReviewRating(e.target.value)}
              placeholder="3"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-20"
            />
          </div>
          <button
            onClick={runHandleNegativeReview}
            disabled={negReviewLoading || !negReviewText.trim()}
            className="flex items-center gap-2 rounded bg-pillar3 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" />
            {negReviewLoading ? "처리 중…" : "부정 리뷰 처리"}
          </button>
        </div>
        {negReviewError && (
          <p className="text-sm text-destructive mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {negReviewError}
          </p>
        )}
        {negReviewResult && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div className="flex items-center gap-2 font-medium text-foreground">
              심각도:{" "}
              <span
                className={
                  negReviewResult.severity === "high"
                    ? "text-destructive"
                    : negReviewResult.severity === "medium"
                    ? "text-amber-500"
                    : "text-green-600 dark:text-green-400"
                }
              >
                {negReviewResult.severity === "low" ? "낮음" : negReviewResult.severity === "medium" ? "중간" : "높음"}
              </span>
              <span className="text-muted-foreground text-sm">
                · {negReviewResult.action === "auto_posted" ? "자동 등록됨" : negReviewResult.action === "queued_for_approval" ? "검토 대기" : "에스컬레이션"}
              </span>
            </div>
            <div className="text-sm">
              <div className="text-xs font-medium text-muted-foreground mb-1">생성된 응답</div>
              <p className="rounded border border-border bg-background/50 px-3 py-2">{negReviewResult.response}</p>
            </div>
            {(negReviewResult.offer || negReviewResult.commitment || (negReviewResult.alerts_sent?.length > 0)) && (
              <ul className="text-xs text-muted-foreground space-y-1">
                {negReviewResult.offer && <li>제안: {negReviewResult.offer}</li>}
                {negReviewResult.commitment && <li>약속: {negReviewResult.commitment}</li>}
                {negReviewResult.alerts_sent?.length > 0 && <li>알림: {negReviewResult.alerts_sent.join(", ")}</li>}
              </ul>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="이탈 방지 캠페인 (Churn Prevention)" className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          이탈 확률 60% 이상 고객 식별 → CLV×이탈확률 우선순위 → 상위 100명 개인화 윈백 이메일 · 고가치(CLV&gt;1000) SMS
        </p>
        <button
          onClick={runChurnCampaign}
          disabled={churnLoading}
          className="flex items-center gap-2 rounded bg-pillar3 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          <Users className="w-4 h-4" />
          {churnLoading ? "실행 중…" : "이탈 방지 캠페인 실행"}
        </button>
        {churnError && (
          <p className="text-sm text-destructive mt-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {churnError}
          </p>
        )}
        {churnResult && (
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-pillar3" />
                이탈 위험 <strong>{churnResult.at_risk_count}</strong>명
              </span>
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-pillar3" />
                이메일 발송 <strong>{churnResult.emails_sent}</strong>건
              </span>
              <span className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-pillar3" />
                SMS 발송 <strong>{churnResult.sms_sent}</strong>건 (CLV&gt;1000)
              </span>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">상위 대상 (우선순위순)</div>
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {churnResult.at_risk_top?.slice(0, 20).map((r, i) => (
                  <li key={i} className="flex justify-between items-center text-sm rounded border border-border bg-background/50 px-3 py-2">
                    <span className="font-medium">{r.customer_id}</span>
                    <span className="text-muted-foreground truncate max-w-[140px]">{r.email}</span>
                    <span>이탈확률 {(r.churn_prob * 100).toFixed(0)}%</span>
                    <span>CLV ₩{r.clv?.toLocaleString()}</span>
                    {r.sms_sent && <span className="text-xs text-pillar3">SMS</span>}
                  </li>
                ))}
              </ul>
              {churnResult.at_risk_top?.length > 20 && (
                <p className="text-xs text-muted-foreground mt-2">외 {churnResult.at_risk_top.length - 20}명</p>
              )}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="맞춤 추천 생성 (Recommendations)" className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          협업 필터링 + 콘텐츠 기반 + 트렌딩 앙상블(0.5/0.3/0.2) → 상위 5건 개인화 피치
        </p>
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">고객 ID</label>
            <input
              type="text"
              value={recCustomerId}
              onChange={(e) => setRecCustomerId(e.target.value)}
              placeholder="e.g. C1001"
              className="rounded border border-border bg-background px-3 py-2 text-sm w-32"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">선호 카테고리</label>
            <select
              value={recCategory}
              onChange={(e) => setRecCategory(e.target.value)}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="electronics">electronics</option>
              <option value="health">health</option>
              <option value="sports">sports</option>
              <option value="furniture">furniture</option>
              <option value="lifestyle">lifestyle</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">컨텍스트</label>
            <select
              value={recContext}
              onChange={(e) => setRecContext(e.target.value)}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="email">email</option>
              <option value="push">push</option>
              <option value="homepage">homepage</option>
            </select>
          </div>
          <button
            onClick={runRecommendations}
            disabled={recLoading || !recCustomerId.trim()}
            className="flex items-center gap-2 rounded bg-pillar3 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {recLoading ? "생성 중…" : "추천 생성"}
          </button>
        </div>
        {recError && (
          <p className="text-sm text-destructive mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {recError}
          </p>
        )}
        {recResult && Array.isArray(recResult) && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <div className="text-sm font-medium text-foreground">추천 상품 {recResult.length}건</div>
            <ul className="space-y-2">
              {recResult.slice(0, 8).map((p, i) => (
                <li key={p.id || i} className="rounded border border-border bg-background/50 px-3 py-2 text-sm">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground">₩{p.price?.toLocaleString()} · {p.category}</span>
                  </div>
                  {p.message && <p className="text-muted-foreground text-xs mt-1">{p.message}</p>}
                </li>
              ))}
            </ul>
            {recResult.length > 8 && <p className="text-xs text-muted-foreground">외 {recResult.length - 8}건</p>}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
