/**
 * E-commerce channel connections: Supabase when available, else in-memory (demo).
 * Tokens are not persisted; only store_url / store_name and connected_at.
 */
import { getSupabaseAdmin } from "../lib/supabaseServer.js";
import * as b2cDb from "../lib/b2cDb.js";

export type ChannelId = b2cDb.ChannelId;
export interface ConnectionInfo extends b2cDb.ConnectionInfo {}

const memoryStore = new Map<string, ConnectionInfo[]>();

function getOrgKey(orgId?: string): string {
  return (orgId ?? "default").trim() || "default";
}

export async function getConnections(orgId?: string): Promise<ConnectionInfo[]> {
  const key = getOrgKey(orgId);
  if (!getSupabaseAdmin()) return memoryStore.get(key) ?? [];
  try {
    const fromDb = await b2cDb.getConnectionsFromDb(key);
    return fromDb;
  } catch {
    return memoryStore.get(key) ?? [];
  }
}

export async function connectChannel(
  orgId: string | undefined,
  channel: ChannelId,
  payload: { store_url?: string; store_name?: string; api_token?: string }
): Promise<ConnectionInfo> {
  const key = getOrgKey(orgId);
  const info: ConnectionInfo = {
    channel,
    store_url: payload.store_url?.trim() || undefined,
    store_name: payload.store_name?.trim() || undefined,
    connected_at: new Date().toISOString(),
  };
  if (getSupabaseAdmin()) {
    try {
      const saved = await b2cDb.upsertConnection(key, channel, {
        store_url: info.store_url,
        store_name: info.store_name,
      });
      if (saved) {
        const list = await getConnections(orgId);
        memoryStore.set(key, list);
        return saved;
      }
    } catch {
      // fallback to memory
    }
  }
  const list = memoryStore.get(key) ?? [];
  const existing = list.find((c) => c.channel === channel);
  if (existing) {
    const idx = list.findIndex((c) => c.channel === channel);
    list[idx] = { ...info, connected_at: existing.connected_at };
  } else {
    list.push(info);
  }
  memoryStore.set(key, list);
  return info;
}

export async function disconnectChannel(orgId: string | undefined, channel: ChannelId): Promise<boolean> {
  const key = getOrgKey(orgId);
  if (getSupabaseAdmin()) {
    try {
      const removed = await b2cDb.deleteConnectionFromDb(key, channel);
      if (removed) {
        const list = (memoryStore.get(key) ?? []).filter((c) => c.channel !== channel);
        memoryStore.set(key, list);
        return true;
      }
    } catch {
      // fallback to memory
    }
  }
  const list = memoryStore.get(key) ?? [];
  const next = list.filter((c) => c.channel !== channel);
  if (next.length === list.length) return false;
  memoryStore.set(key, next);
  return true;
}

export async function isChannelConnected(orgId: string | undefined, channel: ChannelId): Promise<boolean> {
  const list = await getConnections(orgId);
  return list.some((c) => c.channel === channel);
}
