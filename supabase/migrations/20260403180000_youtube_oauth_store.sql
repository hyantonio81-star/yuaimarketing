-- YouTube OAuth refresh_token / 라벨 (사용자별). 백엔드 service_role 전용, RLS만 켜고 정책 없음.
CREATE TABLE IF NOT EXISTS public.youtube_oauth_store (
  user_id uuid PRIMARY KEY,
  tokens jsonb NOT NULL DEFAULT '{}'::jsonb,
  labels jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.youtube_oauth_store IS 'YouTube OAuth tokens per Supabase auth user; server writes only';

ALTER TABLE public.youtube_oauth_store ENABLE ROW LEVEL SECURITY;
