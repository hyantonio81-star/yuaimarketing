/**
 * B2C AI 설정: 반자율화(승인 대기) vs 자율화(자동 실행)
 * Supabase 사용 시 영속화, 미사용 시 메모리.
 */
import { getSupabaseAdmin } from "../lib/supabaseServer.js";

export interface B2cSettings {
  ai_automation_enabled: boolean;
  updated_at?: string;
}

const settingsByOrg = new Map<string, B2cSettings>();

function orgKey(orgId?: string): string {
  return (orgId || "default").trim() || "default";
}

const DEFAULT_SETTINGS: B2cSettings = {
  ai_automation_enabled: false,
  updated_at: new Date().toISOString(),
};

export async function getB2cSettingsAsync(orgId?: string): Promise<B2cSettings> {
  const key = orgKey(orgId);
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("b2c_settings")
      .select("ai_automation_enabled, updated_at")
      .eq("organization_id", key)
      .maybeSingle();
    if (!error && data) {
      return {
        ai_automation_enabled: Boolean(data.ai_automation_enabled),
        updated_at: data.updated_at ?? undefined,
      };
    }
  }
  const cur = settingsByOrg.get(key);
  if (cur) return { ...cur };
  return { ...DEFAULT_SETTINGS };
}

export function getB2cSettings(orgId?: string): B2cSettings {
  const key = orgKey(orgId);
  const cur = settingsByOrg.get(key);
  if (cur) return { ...cur };
  return { ...DEFAULT_SETTINGS };
}

export async function setB2cSettingsAsync(orgId: string | undefined, patch: Partial<B2cSettings>): Promise<B2cSettings> {
  const key = orgKey(orgId);
  const now = new Date().toISOString();
  const prev = await getB2cSettingsAsync(orgId);
  const next: B2cSettings = {
    ...prev,
    ...patch,
    updated_at: now,
  };
  const supabase = getSupabaseAdmin();
  if (supabase) {
    await supabase
      .from("b2c_settings")
      .upsert(
        { organization_id: key, ai_automation_enabled: next.ai_automation_enabled, updated_at: now },
        { onConflict: "organization_id" }
      );
  }
  settingsByOrg.set(key, next);
  return { ...next };
}

export function setB2cSettings(orgId: string | undefined, patch: Partial<B2cSettings>): B2cSettings {
  const key = orgKey(orgId);
  const now = new Date().toISOString();
  const prev = settingsByOrg.get(key) ?? { ...DEFAULT_SETTINGS };
  const next: B2cSettings = {
    ...prev,
    ...patch,
    updated_at: now,
  };
  settingsByOrg.set(key, next);
  return { ...next };
}

export function isAiAutomationEnabled(orgId?: string): boolean {
  return getB2cSettings(orgId).ai_automation_enabled;
}

export async function isAiAutomationEnabledAsync(orgId?: string): Promise<boolean> {
  const s = await getB2cSettingsAsync(orgId);
  return s.ai_automation_enabled;
}
