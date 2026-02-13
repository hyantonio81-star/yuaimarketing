import { createClient } from "@supabase/supabase-js";
import { config } from "../config/index.js";

/**
 * Supabase server-side client (service role).
 * Use for admin operations, RLS bypass. Never expose service role key to the frontend.
 */
export function getSupabaseAdmin() {
  const { url, serviceRoleKey, anonKey } = config.supabase;
  const key = serviceRoleKey || anonKey;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export const supabaseAdmin = getSupabaseAdmin();
