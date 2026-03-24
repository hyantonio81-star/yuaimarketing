-- Shorts 배포 대기열 (shortsDistributionService.ts)
-- Apply after: 20260225130000_extended_app_tables.sql
-- See docs/SUPABASE_SCHEMA_RUNBOOK.md
--
-- NOTE: shortsDistributionService.ts uses camelCase field names in TypeScript
-- (jobId, scheduledAt, retryCount, createdAt, updatedAt, publishedAt).
-- This table uses snake_case to match all other tables in this project.
-- The service inserts/updates with camelCase keys which Supabase/PostgREST
-- will NOT automatically map — the service layer must be updated to use
-- snake_case column names (see code comment in shortsDistributionService.ts).

CREATE TABLE IF NOT EXISTS public.shorts_distribution_queue (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        text        NOT NULL,
  platform      text        NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'instagram', 'facebook')),
  status        text        NOT NULL DEFAULT 'waiting'
                            CHECK (status IN ('waiting', 'processing', 'done', 'failed')),
  scheduled_at  timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz,
  error         text,
  retry_count   integer     NOT NULL DEFAULT 0,
  metadata      jsonb       DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sdq_status_scheduled
  ON public.shorts_distribution_queue (status, scheduled_at ASC);

CREATE INDEX IF NOT EXISTS idx_sdq_job_id
  ON public.shorts_distribution_queue (job_id);

ALTER TABLE public.shorts_distribution_queue ENABLE ROW LEVEL SECURITY;
-- No anon policies: backend accesses via service_role only.
