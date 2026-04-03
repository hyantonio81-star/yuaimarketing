import { createClient } from "@supabase/supabase-js";
import { config } from "../config/index.js";

/**
 * Supabase server-side client (service role).
 * Use for admin operations, RLS bypass. Never expose service role key to the frontend.
 */
export function getSupabaseAdmin() {
  const { url, serviceRoleKey, anonKey } = config.supabase;
  
  // serviceRoleKey가 'sb_secret_'로 시작하거나 유효한 JWT가 아닌 경우 anonKey를 사용하도록 보강
  const isInvalidServiceKey = !serviceRoleKey || serviceRoleKey.startsWith("sb_secret_") || !serviceRoleKey.includes(".");
  const isProduction = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  // 운영에서는 service_role이 없으면 절대 anon으로 우회하지 않습니다.
  // (RLS 정책/권한 설정 실수로 인해 "생각보다 넓은 접근"이 발생하는 리스크를 방지)
  if (isProduction && isInvalidServiceKey) return null;

  const key = isInvalidServiceKey ? anonKey : serviceRoleKey;
  
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export const supabaseAdmin = getSupabaseAdmin();
