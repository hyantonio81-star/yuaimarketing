/**
 * 채널 프로필: 계정별 주제(테마)·언어·제휴 집중·마켓 허용 목록
 * 웹앱에서만 설정·수정 가능 (배포 없이 툭딱 설정)
 * 저장: data/channel-profiles.json(폴백) 및 Supabase(channel_profiles)
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getSupabaseAdmin } from "../lib/supabaseServer.js";
import { getLocalDataDir } from "../lib/localDataDir.js";

export type ChannelTheme =
  | "health"
  | "manga"
  | "culture_travel"
  | "affiliate_general"
  | "affiliate_es"
  | "lifestyle"
  | "tech"
  | "other";

export type ChannelPrimaryLanguage = "es-DO" | "es-MX" | "pt-BR" | "ko" | "en";

export interface ChannelProfile {
  /** 주제/니치 */
  theme?: ChannelTheme;
  /** 주 사용 언어 */
  primaryLanguage?: ChannelPrimaryLanguage;
  /** 이 채널이 제휴 콘텐츠에 집중하는지 */
  affiliateFocus?: boolean;
  /** 허용 마켓 (비어 있으면 전부 허용) */
  marketplaceAllowlist?: string[];
  /** 표시용 라벨 (계정 라벨과 별도로 프로필 설명용) */
  label?: string;
}

const FILENAME = "channel-profiles.json";

function getDataPath(): string {
  return join(getLocalDataDir(), FILENAME);
}

type Store = Record<string, ChannelProfile>;

let cache: Store = {};

async function loadFallback(): Promise<Store> {
  const path = getDataPath();
  if (!existsSync(path)) return {};
  try {
    const raw = await readFile(path, "utf-8");
    const data = JSON.parse(raw);
    if (data && typeof data === "object" && !Array.isArray(data)) return data;
  } catch {
    // ignore
  }
  return {};
}

async function load(): Promise<Store> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("channel_profiles_store")
      .select("profiles")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!error && data && data.profiles) {
      return data.profiles as Store;
    }
  }
  return loadFallback();
}

async function save(data: Store): Promise<void> {
  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase
      .from("channel_profiles_store")
      .upsert({ id: "current", profiles: data, updated_at: now }, { onConflict: "id" });
    
    if (!error) {
      cache = { ...data };
      return;
    }
  }

  const path = getDataPath();
  const dir = join(path, "..");
  if (!existsSync(dir)) {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(dir, { recursive: true });
  }
  await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
  cache = { ...data };
}

function profileKey(platform: string, accountKey: string): string {
  return `${platform}:${accountKey}`;
}

export async function getChannelProfile(
  platform: string,
  accountKey: string
): Promise<ChannelProfile | null> {
  if (Object.keys(cache).length === 0) cache = await load();
  const key = profileKey(platform, accountKey);
  const p = cache[key];
  return p ? { ...p } : null;
}

export async function setChannelProfile(
  platform: string,
  accountKey: string,
  profile: Partial<ChannelProfile>
): Promise<ChannelProfile> {
  if (Object.keys(cache).length === 0) cache = await load();
  const key = profileKey(platform, accountKey);
  const existing = cache[key] ?? {};
  const next: ChannelProfile = {
    ...existing,
    ...(profile.theme !== undefined && { theme: profile.theme }),
    ...(profile.primaryLanguage !== undefined && { primaryLanguage: profile.primaryLanguage }),
    ...(profile.affiliateFocus !== undefined && { affiliateFocus: profile.affiliateFocus }),
    ...(profile.marketplaceAllowlist !== undefined && {
      marketplaceAllowlist:
        profile.marketplaceAllowlist?.length === 0
          ? undefined
          : profile.marketplaceAllowlist,
    }),
    ...(profile.label !== undefined && { label: profile.label || undefined }),
  };
  cache[key] = next;
  await save(cache);
  return { ...next };
}

export async function listChannelProfiles(platform?: string): Promise<Record<string, ChannelProfile>> {
  if (Object.keys(cache).length === 0) cache = await load();
  if (!platform) return { ...cache };
  const out: Record<string, ChannelProfile> = {};
  const prefix = platform + ":";
  for (const [key, value] of Object.entries(cache)) {
    if (key.startsWith(prefix)) out[key] = { ...value };
  }
  return out;
}
