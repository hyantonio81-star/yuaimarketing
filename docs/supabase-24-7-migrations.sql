-- 24/7 B2C 설정·승인대기·루틴 실행 이력 (Supabase)
-- Run in Supabase SQL Editor. RLS can be added later per organization_id.

-- 1) B2C AI 자동화 설정 (조직별)
CREATE TABLE IF NOT EXISTS b2c_settings (
  organization_id text PRIMARY KEY DEFAULT 'default',
  ai_automation_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) B2C 승인 대기 (반자율화: 가격·리뷰·윈백 등)
CREATE TABLE IF NOT EXISTS b2c_pending_approvals (
  id text PRIMARY KEY,
  organization_id text NOT NULL DEFAULT 'default',
  type text NOT NULL CHECK (type IN ('price_change', 'review_reply', 'winback_send', 'promotion_apply')),
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_b2c_pending_org ON b2c_pending_approvals(organization_id);
CREATE INDEX IF NOT EXISTS idx_b2c_pending_status ON b2c_pending_approvals(organization_id, status);

-- 3) Nexus 일과 루틴 실행 이력 (Phase 2B)
CREATE TABLE IF NOT EXISTS nexus_routine_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_time text NOT NULL,
  task_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
  message text,
  details jsonb
);

CREATE INDEX IF NOT EXISTS idx_nexus_runs_started ON nexus_routine_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_nexus_runs_task_time ON nexus_routine_runs(task_time, started_at DESC);
