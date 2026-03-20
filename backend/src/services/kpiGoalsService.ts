/**
 * KPI 목표 저장·로드 (data/kpi-goals.json)
 * BSC 4관점 · SMART 목표 대비 진행률 표시용
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getSupabaseAdmin } from "../lib/supabaseServer.js";

export type KpiCategory = "financial" | "customer" | "process" | "learning";

export interface KpiGoal {
  id: string;
  name: string;
  target: number;
  current?: number;
  category?: KpiCategory;
  deadline?: string;
  unit?: string;
}

const FILENAME = "kpi-goals.json";
const DEFAULT_ORG = "default";

function getDataPath(): string {
  return join(process.cwd(), "data", FILENAME);
}

function orgKey(orgId?: string): string {
  return (orgId || DEFAULT_ORG).trim() || DEFAULT_ORG;
}

export interface KpiGoalsStore {
  goals: KpiGoal[];
  updated_at?: string;
}

const cacheByOrg = new Map<string, KpiGoalsStore>();

function cloneStore(store: KpiGoalsStore): KpiGoalsStore {
  return { goals: [...store.goals], updated_at: store.updated_at };
}

async function loadFromFileFallback(orgId?: string): Promise<KpiGoalsStore> {
  if (orgKey(orgId) !== DEFAULT_ORG) return { goals: [] };
  const path = getDataPath();
  if (!existsSync(path)) {
    return { goals: [] };
  }
  try {
    const raw = await readFile(path, "utf-8");
    const data = JSON.parse(raw);
    if (data && typeof data === "object" && Array.isArray(data.goals)) {
      return { goals: data.goals, updated_at: data.updated_at };
    }
  } catch {
    // ignore
  }
  return { goals: [] };
}

export async function loadKpiGoals(orgId?: string): Promise<KpiGoalsStore> {
  const key = orgKey(orgId);
  const cached = cacheByOrg.get(key);
  if (cached) return cloneStore(cached);

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("kpi_goals")
      .select("goals, updated_at")
      .eq("organization_id", key)
      .maybeSingle();
    if (!error && data) {
      const out: KpiGoalsStore = {
        goals: Array.isArray(data.goals) ? (data.goals as KpiGoal[]) : [],
        updated_at: data.updated_at ?? undefined,
      };
      cacheByOrg.set(key, out);
      return cloneStore(out);
    }
  }

  const fallback = await loadFromFileFallback(key);
  cacheByOrg.set(key, fallback);
  return cloneStore(fallback);
}

async function saveToFileFallback(store: KpiGoalsStore, orgId?: string): Promise<void> {
  if (orgKey(orgId) !== DEFAULT_ORG) return;
  const path = getDataPath();
  const dir = join(path, "..");
  if (!existsSync(dir)) {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(dir, { recursive: true });
  }
  await writeFile(path, JSON.stringify(store, null, 2), "utf-8");
}

export async function saveKpiGoals(store: KpiGoalsStore, orgId?: string): Promise<void> {
  const key = orgKey(orgId);
  const out: KpiGoalsStore = {
    goals: store.goals,
    updated_at: new Date().toISOString(),
  };
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase
      .from("kpi_goals")
      .upsert(
        { organization_id: key, goals: out.goals, updated_at: out.updated_at },
        { onConflict: "organization_id" }
      );
    if (!error) {
      cacheByOrg.set(key, out);
      return;
    }
  }

  await saveToFileFallback(out, key);
  cacheByOrg.set(key, out);
}

export function invalidateCache(orgId?: string): void {
  if (orgId) {
    cacheByOrg.delete(orgKey(orgId));
    return;
  }
  cacheByOrg.clear();
}
