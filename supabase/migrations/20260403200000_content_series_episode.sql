-- 연재 프로젝트: 시리즈 + 에피소드 (Shorts 파이프라인·배포 큐와 연계용)
-- Backend: contentSeriesService.ts — service_role 전용 (RLS 정책 없음)

CREATE TABLE IF NOT EXISTS public.content_series (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL,
  title               text        NOT NULL,
  genre               text        NOT NULL
                        CHECK (genre IN ('novel', 'comic', 'music', 'longform', 'shorts')),
  default_language    text        NOT NULL DEFAULT 'ko',
  tone                text,
  youtube_playlist_id text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_series_user
  ON public.content_series (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.content_episode (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id              uuid        NOT NULL REFERENCES public.content_series (id) ON DELETE CASCADE,
  episode_index          integer     NOT NULL,
  title                  text,
  body_text              text,
  image_asset_url        text,
  job_id                 text,
  scheduled_publish_at   timestamptz,
  status                 text        NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'queued', 'published')),
  metadata               jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (series_id, episode_index)
);

CREATE INDEX IF NOT EXISTS idx_content_episode_series
  ON public.content_episode (series_id, episode_index ASC);

ALTER TABLE public.content_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_episode ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: API uses service role only.
