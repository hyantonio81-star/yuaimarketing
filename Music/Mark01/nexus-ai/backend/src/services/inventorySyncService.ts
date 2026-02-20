/**
 * InventorySync: 중앙 재고 업데이트 → 채널별 동기화
 * - calculate_channel_allocation: AI 기반 채널별 재고 배분 (판매속도, 중요도)
 * - 재고 부족 시 auto_restock_or_hide, 품절 임박 알림
 */

export interface ChannelSyncResult {
  channel: string;
  allocation: number;
  action: "updated" | "restock_or_hide" | "sync_failed";
  safety_stock: number;
}

export interface InventorySyncResult {
  sku: string;
  central_stock: number;
  quantity_change: number;
  channel_results: ChannelSyncResult[];
  low_stock_alert: boolean;
  suggested_reorder_qty: number;
}

const ACTIVE_CHANNELS = [
  { name: "Shopify", safety_stock: 5, revenue_contribution: 0.25 },
  { name: "Coupang", safety_stock: 10, revenue_contribution: 0.35 },
  { name: "Amazon", safety_stock: 15, revenue_contribution: 0.30 },
  { name: "Naver SmartStore", safety_stock: 5, revenue_contribution: 0.10 },
];

const centralStockBySku: Record<string, number> = {};

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getCentralStock(sku: string): number {
  if (centralStockBySku[sku] !== undefined) return centralStockBySku[sku];
  return 50 + (simpleHash(sku) % 80);
}

function updateCentralStock(sku: string, quantityChange: number): number {
  const current = getCentralStock(sku);
  const next = Math.max(0, current + quantityChange);
  centralStockBySku[sku] = next;
  return next;
}

function mlPredictSales(_channel: string, _days: number): number {
  return 8 + (simpleHash(_channel) % 12);
}

function calculateChannelAllocation(
  totalStock: number,
  channel: { name: string; revenue_contribution: number }
): number {
  const salesVelocity = mlPredictSales(channel.name, 7);
  const importanceWeight = channel.revenue_contribution;
  const byWeight = totalStock * importanceWeight;
  const byVelocity = salesVelocity * 1.5;
  return Math.floor(Math.min(byWeight, byVelocity));
}

function suggestReorderQuantity(sku: string): number {
  const h = simpleHash(sku);
  return 30 + (h % 40);
}

/**
 * update_inventory(sku, quantity_change)
 */
export function updateInventory(sku: string, quantityChange: number): InventorySyncResult {
  const centralStock = updateCentralStock(sku, quantityChange);
  const channelResults: ChannelSyncResult[] = [];

  for (const ch of ACTIVE_CHANNELS) {
    let action: ChannelSyncResult["action"] = "updated";
    let allocation = 0;

    if (centralStock <= ch.safety_stock) {
      action = "restock_or_hide";
    } else {
      allocation = calculateChannelAllocation(centralStock, ch);
    }
    channelResults.push({
      channel: ch.name,
      allocation,
      action,
      safety_stock: ch.safety_stock,
    });
  }

  const lowStockAlert = centralStock < 10;
  const suggested_reorder_qty = suggestReorderQuantity(sku);

  return {
    sku,
    central_stock: centralStock,
    quantity_change: quantityChange,
    channel_results: channelResults,
    low_stock_alert: lowStockAlert,
    suggested_reorder_qty,
  };
}
