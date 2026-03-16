/**
 * B2C 승인 대기: 반자율화 시 가격·리뷰 응답·윈백 등 실행 전 대기
 * Supabase 사용 시 영속화, 미사용 시 메모리.
 */
import { getSupabaseAdmin } from "../lib/supabaseServer.js";

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

function rowToPending(row: { id: string; organization_id: string; type: string; payload: unknown; status: string; created_at: string; resolved_at?: string | null }): PendingApproval {
  return {
    id: row.id,
    org_id: row.organization_id,
    type: row.type as PendingType,
    payload: (row.payload as Record<string, unknown>) ?? {},
    status: row.status as "pending" | "approved" | "rejected",
    created_at: row.created_at,
    resolved_at: row.resolved_at ?? undefined,
  };
}

export async function addPendingAsync(
  orgId: string | undefined,
  type: PendingType,
  payload: Record<string, unknown>
): Promise<PendingApproval> {
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
  const supabase = getSupabaseAdmin();
  if (supabase) {
    await supabase.from("b2c_pending_approvals").insert({
      id: row.id,
      organization_id: row.org_id,
      type: row.type,
      payload: row.payload,
      status: row.status,
      created_at: row.created_at,
    });
  }
  store.push(row);
  return { ...row };
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

export async function listPendingAsync(orgId?: string, status?: "pending" | "approved" | "rejected"): Promise<PendingApproval[]> {
  const key = orgKey(orgId);
  const supabase = getSupabaseAdmin();
  if (supabase) {
    let q = supabase
      .from("b2c_pending_approvals")
      .select("id, organization_id, type, payload, status, created_at, resolved_at")
      .eq("organization_id", key)
      .order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (!error && data) return data.map(rowToPending);
  }
  let list = store.filter((r) => r.org_id === key);
  if (status) list = list.filter((r) => r.status === status);
  return list.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
}

export function listPending(orgId?: string, status?: "pending" | "approved" | "rejected"): PendingApproval[] {
  const key = orgKey(orgId);
  let list = store.filter((r) => r.org_id === key);
  if (status) list = list.filter((r) => r.status === status);
  return list.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
}

export async function getPendingAsync(id: string, orgId?: string): Promise<PendingApproval | undefined> {
  const key = orgKey(orgId);
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("b2c_pending_approvals")
      .select("id, organization_id, type, payload, status, created_at, resolved_at")
      .eq("id", id)
      .eq("organization_id", key)
      .maybeSingle();
    if (!error && data) return rowToPending(data);
  }
  return store.find((r) => r.id === id && r.org_id === key);
}

export function getPending(id: string, orgId?: string): PendingApproval | undefined {
  const key = orgKey(orgId);
  return store.find((r) => r.id === id && r.org_id === key);
}

export async function resolvePendingAsync(
  id: string,
  orgId: string | undefined,
  action: "approve" | "reject"
): Promise<PendingApproval | null> {
  const key = orgKey(orgId);
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const newStatus = action === "approve" ? "approved" : "rejected";
  if (supabase) {
    const { data, error } = await supabase
      .from("b2c_pending_approvals")
      .update({ status: newStatus, resolved_at: now })
      .eq("id", id)
      .eq("organization_id", key)
      .eq("status", "pending")
      .select()
      .maybeSingle();
    if (!error && data) {
      const row = rowToPending(data);
      const local = store.find((r) => r.id === id && r.org_id === key);
      if (local) {
        local.status = row.status;
        local.resolved_at = row.resolved_at;
      }
      return row;
    }
  }
  const row = store.find((r) => r.id === id && r.org_id === key);
  if (!row || row.status !== "pending") return null;
  row.status = newStatus;
  row.resolved_at = now;
  return { ...row };
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

export async function countPendingAsync(orgId?: string): Promise<number> {
  const list = await listPendingAsync(orgId, "pending");
  return list.length;
}

export function countPending(orgId?: string): number {
  return listPending(orgId, "pending").length;
}
