/**
 * 채널별 Shorts 기본 설정 (YouTube 등 계정별)
 * 저장: data/shorts_channel_defaults.json(폴백) 및 Supabase(shorts_channel_defaults)
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getSupabaseAdmin } from "../lib/supabaseServer.js";
import { getLocalDataDir } from "../lib/localDataDir.js";

export interface ShortsChannelDefaults {
  language?: string;
  interestKeywords?: string[];
  voiceGender?: "female" | "male" | "neutral";
  voiceAge?: "child" | "young" | "adult" | "mature";
  voiceTone?: "bright" | "warm" | "calm" | "friendly" | "authoritative";
  voiceSpeed?: number;
  voicePitch?: "high" | "medium" | "low";
  format?: "shorts" | "long";
  targetDurationSeconds?: number;
  characterAge?: "child" | "young" | "adult" | "mature";
  characterGender?: "female" | "male" | "neutral";
  noBgm?: boolean;
  bgmGenre?: string;
  bgmMood?: string;
  bgmVolume?: number;
  /** true면 즉시 업로드, false면 review_first */
  autoUpload?: boolean;
}

const DEFAULTS_FILE = "shorts_channel_defaults.json";

function getDefaultsPath(): string {
  return join(getLocalDataDir(), DEFAULTS_FILE);
}

let cache: Record<string, ShortsChannelDefaults> = {};

async function loadFallback(): Promise<Record<string, ShortsChannelDefaults>> {
  const path = getDefaultsPath();
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

async function load(): Promise<Record<string, ShortsChannelDefaults>> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("shorts_settings_store")
      .select("defaults")
      .eq("id", "current")
      .maybeSingle();
    
    if (!error && data && data.defaults) {
      return data.defaults as Record<string, ShortsChannelDefaults>;
    }
  }
  return loadFallback();
}

async function save(data: Record<string, ShortsChannelDefaults>): Promise<void> {
  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase
      .from("shorts_settings_store")
      .upsert({ id: "current", defaults: data, updated_at: now }, { onConflict: "id" });
    
    if (!error) {
      cache = { ...data };
      return;
    }
  }

  const path = getDefaultsPath();
  const dir = join(path, "..");
  if (!existsSync(dir)) {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(dir, { recursive: true });
  }
  await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
  cache = { ...data };
}

export async function getChannelDefaults(channelKey: string): Promise<ShortsChannelDefaults | null> {
  if (Object.keys(cache).length === 0) cache = await load();
  const d = cache[channelKey];
  return d ?? null;
}

export async function setChannelDefaults(channelKey: string, defaults: ShortsChannelDefaults): Promise<void> {
  if (Object.keys(cache).length === 0) cache = await load();
  const existing = cache[channelKey] ?? {};
  cache[channelKey] = { ...existing, ...defaults };
  await save(cache);
}
