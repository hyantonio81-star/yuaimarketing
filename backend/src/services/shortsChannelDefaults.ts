/**
 * 채널별 Shorts 기본 설정 (YouTube 등 계정별)
 * GET/PUT /api/shorts/channels/:channelKey/defaults
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

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
  return join(process.cwd(), "data", DEFAULTS_FILE);
}

let cache: Record<string, ShortsChannelDefaults> = {};

async function load(): Promise<Record<string, ShortsChannelDefaults>> {
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

async function save(data: Record<string, ShortsChannelDefaults>): Promise<void> {
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
