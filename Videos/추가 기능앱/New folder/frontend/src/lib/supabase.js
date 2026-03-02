/**
 * Supabase 클라이언트 (Realtime, Storage, Auth 등)
 * .env에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 설정 시 사용 가능
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabase = url && anonKey
  ? createClient(url, anonKey)
  : null;

export const isSupabaseConfigured = () => !!supabase;
