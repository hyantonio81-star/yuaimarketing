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
  const key = isInvalidServiceKey ? anonKey : serviceRoleKey;
  
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export const supabaseAdmin = getSupabaseAdmin();
