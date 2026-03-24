-- Enable RLS on B2C / core tables that were missing it in earlier migrations.
-- Apply after: 20260225140000_shorts_distribution_queue.sql
-- See docs/SUPABASE_SCHEMA_RUNBOOK.md
--
-- These tables were created without ENABLE ROW LEVEL SECURITY.
-- Backend accesses them via service_role (bypasses RLS).
-- Enabling RLS here ensures the anon role cannot reach them via PostgREST
-- without an explicit policy — consistent with the extended_app_tables posture.
-- No policies are added: deny-by-default for anon is the intended behaviour.

ALTER TABLE public.b2c_channel_connections   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2c_inventory             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2c_competitor_prices     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2c_settings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2c_pending_approvals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexus_routine_runs        ENABLE ROW LEVEL SECURITY;
