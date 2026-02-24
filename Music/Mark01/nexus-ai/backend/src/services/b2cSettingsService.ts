/**
 * B2C AI 설정: 반자율화(승인 대기) vs 자율화(자동 실행)
 * org별 ai_automation_enabled 저장. 메모리 기본, 추후 Supabase 연동 가능.
 */
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

export function getB2cSettings(orgId?: string): B2cSettings {
  const key = orgKey(orgId);
  const cur = settingsByOrg.get(key);
  if (cur) return { ...cur };
  return { ...DEFAULT_SETTINGS };
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
