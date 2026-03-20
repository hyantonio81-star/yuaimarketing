import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

/** 실제 프로젝트 URL이 설정되어 로그인이 가능한지 여부 */
export const isSupabaseConfigured =
  typeof supabaseUrl === "string" &&
  supabaseUrl.length > 0 &&
  supabaseUrl.indexOf("your-project-ref") === -1 &&
  typeof supabaseAnonKey === "string" &&
  supabaseAnonKey.length > 0 &&
  supabaseAnonKey !== "your-anon-key";

/**
 * Supabase client for browser (anon key).
 * Use for Auth, Realtime, and DB access with RLS.
 */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export default supabase;
