/**
 * B2C Supabase persistence. Falls back to null when Supabase or tables are unavailable.
 */
import { getSupabaseAdmin } from "./supabaseServer.js";

export type ChannelId = "shopify";

export interface ConnectionRow {
  id: string;
  organization_id: string;
  channel: string;
  store_url: string | null;
  store_name: string | null;
  connected_at: string;
}

export interface ConnectionInfo {
  channel: ChannelId;
  store_url?: string;
  store_name?: string;
  connected_at: string;
}

export async function getConnectionsFromDb(orgId: string): Promise<ConnectionInfo[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const key = (orgId || "default").trim() || "default";
  const { data, error } = await supabase
    .from("b2c_channel_connections")
    .select("channel, store_url, store_name, connected_at")
    .eq("organization_id", key)
    .order("connected_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r) => ({
    channel: r.channel as ChannelId,
    store_url: r.store_url ?? undefined,
    store_name: r.store_name ?? undefined,
    connected_at: r.connected_at ?? new Date().toISOString(),
  }));
}

export async function upsertConnection(
  orgId: string,
  channel: ChannelId,
  payload: { store_url?: string; store_name?: string }
): Promise<ConnectionInfo | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const key = (orgId || "default").trim() || "default";
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("b2c_channel_connections")
    .upsert(
      {
        organization_id: key,
        channel,
        store_url: payload.store_url?.trim() || null,
        store_name: payload.store_name?.trim() || null,
        connected_at: now,
      },
      { onConflict: "organization_id,channel" }
    )
    .select("channel, store_url, store_name, connected_at")
    .single();
  if (error || !data) return null;
  return {
    channel: data.channel as ChannelId,
    store_url: data.store_url ?? undefined,
    store_name: data.store_name ?? undefined,
    connected_at: data.connected_at ?? now,
  };
}

export async function deleteConnectionFromDb(orgId: string, channel: ChannelId): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const key = (orgId || "default").trim() || "default";
  const { error } = await supabase
    .from("b2c_channel_connections")
    .delete()
    .eq("organization_id", key)
    .eq("channel", channel);
  return !error;
}

export interface InventoryRow {
  organization_id: string;
  country_code: string | null;
  sku: string;
  central_quantity: number;
  updated_at: string;
}

export async function getInventoryFromDb(
  orgId: string,
  countryCode: string | null,
  sku: string
): Promise<number | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const o = (orgId || "default").trim() || "default";
  const c = countryCode?.trim() || null;
  const q = supabase
    .from("b2c_inventory")
    .select("central_quantity")
    .eq("organization_id", o)
    .eq("sku", sku);
  const { data, error } = c == null
    ? await q.is("country_code", null).maybeSingle()
    : await q.eq("country_code", c).maybeSingle();
  if (error || data == null) return null;
  return data.central_quantity;
}

export async function upsertInventory(
  orgId: string,
  countryCode: string | null,
  sku: string,
  quantity: number
): Promise<number | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const o = (orgId || "default").trim() || "default";
  const c = countryCode?.trim() || null;
  const now = new Date().toISOString();
  const row = {
    organization_id: o,
    country_code: c,
    sku,
    central_quantity: Math.max(0, quantity),
    updated_at: now,
  };
  const { data, error } = await supabase
    .from("b2c_inventory")
    .upsert(row, { onConflict: "organization_id,country_code,sku" })
    .select("central_quantity")
    .single();
  if (error || data == null) return null;
  return data.central_quantity;
}
