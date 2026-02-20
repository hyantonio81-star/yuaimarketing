/**
 * process_order_auto: 주문 접수부터 배송까지 자동화
 * 1. 주문 검증(사기) → 2. 재고 예약 → 3. 결제 → 4. 송장 → 5. 피킹/창고 → 6. 배송라벨 → 7. 고객 알림 → 8. 상태 동기화
 */

export interface OrderItem {
  sku: string;
  quantity: number;
}

export interface OrderInput {
  id: string;
  customer: { email: string };
  items: OrderItem[];
}

export type ProcessOrderStatus = "processing" | "flagged_manual_review" | "cancelled";

export interface ProcessOrderResult {
  order_id: string;
  status: ProcessOrderStatus;
  cancel_reason?: "out_of_stock" | "payment_failed";
  steps: {
    fraud_check: { score: number; passed: boolean };
    inventory_reserved: boolean;
    payment_success: boolean;
    invoice_id?: string;
    picking_list_id?: string;
    warehouse_sent: boolean;
    carrier?: string;
    tracking_url?: string;
    estimated_delivery?: string;
    email_sent: boolean;
    order_status_updated: boolean;
  };
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function fraudDetection(order: OrderInput): number {
  const h = simpleHash(order.id + (order.customer?.email ?? ""));
  return 0.2 + (h % 80) / 100;
}

function reserveInventory(items: OrderItem[]): boolean {
  return items.length > 0 && items.every((i) => i.quantity > 0 && i.quantity <= 99);
}

function processPayment(_order: OrderInput): { success: boolean } {
  return { success: true };
}

function generateInvoice(order: OrderInput): { id: string } {
  return { id: `INV-${order.id}-${Date.now().toString(36).slice(-6)}` };
}

function createPickingList(order: OrderInput): { id: string } {
  return { id: `PICK-${order.id}-${Date.now().toString(36).slice(-6)}` };
}

function selectOptimalCarrier(_order: OrderInput): string {
  const carriers = ["CJ대한통운", "한진택배", "롯데글로벌로지스"];
  const i = simpleHash(_order.id) % carriers.length;
  return carriers[i];
}

function generateShippingLabel(order: OrderInput, carrier: string): { tracking_url: string } {
  const code = `TRK${simpleHash(order.id + carrier).toString(36).toUpperCase().slice(0, 12)}`;
  return { tracking_url: `https://tracking.example.com/${code}` };
}

function calculateDeliveryDate(_order: OrderInput): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().slice(0, 10);
}

export function processOrderAuto(order: OrderInput): ProcessOrderResult {
  const steps: ProcessOrderResult["steps"] = {
    fraud_check: { score: 0, passed: true },
    inventory_reserved: false,
    payment_success: false,
    warehouse_sent: false,
    email_sent: false,
    order_status_updated: false,
  };

  const fraudScore = fraudDetection(order);
  steps.fraud_check = { score: fraudScore, passed: fraudScore <= 0.7 };
  if (fraudScore > 0.7) {
    return {
      order_id: order.id,
      status: "flagged_manual_review",
      steps,
    };
  }

  if (!reserveInventory(order.items)) {
    return {
      order_id: order.id,
      status: "cancelled",
      cancel_reason: "out_of_stock",
      steps,
    };
  }
  steps.inventory_reserved = true;

  const paymentResult = processPayment(order);
  if (!paymentResult.success) {
    return {
      order_id: order.id,
      status: "cancelled",
      cancel_reason: "payment_failed",
      steps,
    };
  }
  steps.payment_success = true;

  const invoice = generateInvoice(order);
  steps.invoice_id = invoice.id;

  const pickingList = createPickingList(order);
  steps.picking_list_id = pickingList.id;
  steps.warehouse_sent = true;

  const carrier = selectOptimalCarrier(order);
  const shippingLabel = generateShippingLabel(order, carrier);
  steps.carrier = carrier;
  steps.tracking_url = shippingLabel.tracking_url;
  steps.estimated_delivery = calculateDeliveryDate(order);

  steps.email_sent = true;
  steps.order_status_updated = true;

  return {
    order_id: order.id,
    status: "processing",
    steps,
  };
}
