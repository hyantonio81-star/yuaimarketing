/**
 * B2C 승인 대기: 반자율화 시 가격·리뷰 응답·윈백 등 실행 전 대기
 */
export type PendingType = "price_change" | "review_reply" | "winback_send" | "promotion_apply";

export interface PendingApproval {
  id: string;
  org_id: string;
  type: PendingType;
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  resolved_at?: string;
}

const store: PendingApproval[] = [];
let idSeq = 0;

function orgKey(orgId?: string): string {
  return (orgId || "default").trim() || "default";
}

function nextId(): string {
  idSeq += 1;
  return `pa-${Date.now()}-${idSeq}`;
}

export function addPending(
  orgId: string | undefined,
  type: PendingType,
  payload: Record<string, unknown>
): PendingApproval {
  const id = nextId();
  const now = new Date().toISOString();
  const row: PendingApproval = {
    id,
    org_id: orgKey(orgId),
    type,
    payload,
    status: "pending",
    created_at: now,
  };
  store.push(row);
  return { ...row };
}

export function listPending(orgId?: string, status?: "pending" | "approved" | "rejected"): PendingApproval[] {
  const key = orgKey(orgId);
  let list = store.filter((r) => r.org_id === key);
  if (status) list = list.filter((r) => r.status === status);
  return list.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
}

export function getPending(id: string, orgId?: string): PendingApproval | undefined {
  const key = orgKey(orgId);
  return store.find((r) => r.id === id && r.org_id === key);
}

export function resolvePending(
  id: string,
  orgId: string | undefined,
  action: "approve" | "reject"
): PendingApproval | null {
  const key = orgKey(orgId);
  const row = store.find((r) => r.id === id && r.org_id === key);
  if (!row || row.status !== "pending") return null;
  const now = new Date().toISOString();
  row.status = action === "approve" ? "approved" : "rejected";
  row.resolved_at = now;
  return { ...row };
}

export function countPending(orgId?: string): number {
  return listPending(orgId, "pending").length;
}
