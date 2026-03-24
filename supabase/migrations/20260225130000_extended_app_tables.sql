-- Extended app tables (code expects these when Supabase service_role is configured).
-- Tables: b2b_leads, link_clicks (client_ip_hash = SHA-256 hex, never raw IP),
--   review_analyses, kpi_goals, promotion_plans, channel_profiles_store, shorts_settings_store.
-- Apply after: 20260225100000_b2c_pillar3, 20260225101000_b2c_24_7, 20260225120000_shorts_analytics.
-- See docs/SUPABASE_SCHEMA_RUNBOOK.md

-- B2B leads (b2bLeadsService.ts)
CREATE TABLE IF NOT EXISTS public.b2b_leads (
  id text PRIMARY KEY,
  product_or_hs text NOT NULL,
  country text NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  score integer NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'new',
  buyer_id text,
  buyer_name text,
  buyer_contact text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_b2b_leads_country ON public.b2b_leads (country);
CREATE INDEX IF NOT EXISTS idx_b2b_leads_status ON public.b2b_leads (status);

-- Short link click tracking (goRedirect.ts)
CREATE TABLE IF NOT EXISTS public.link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id text NOT NULL,
  target_url text NOT NULL,
  referrer text,
  user_agent text,
  client_ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_link_clicks_link_id ON public.link_clicks (link_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_created ON public.link_clicks (created_at DESC);

-- Review analysis history (reviewAnalysisService.ts)
CREATE TABLE IF NOT EXISTS public.review_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL DEFAULT 'default',
  country_code text NOT NULL DEFAULT 'ALL',
  sku text NOT NULL,
  overall_rating numeric,
  sentiment_distribution jsonb,
  positive_highlights jsonb,
  improvement_areas jsonb,
  action_items jsonb,
  review_volume_trend jsonb,
  total_reviews integer DEFAULT 0,
  ai_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_analyses_scope ON public.review_analyses (organization_id, country_code, sku, created_at DESC);

-- KPI goals per org (kpiGoalsService.ts)
CREATE TABLE IF NOT EXISTS public.kpi_goals (
  organization_id text PRIMARY KEY DEFAULT 'default',
  goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Promotion plans history (promotionPlanService.ts)
CREATE TABLE IF NOT EXISTS public.promotion_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL DEFAULT 'default',
  country_code text NOT NULL DEFAULT 'ALL',
  sku text NOT NULL,
  goal text NOT NULL,
  recommendation jsonb,
  all_scenarios jsonb,
  execution_plan jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotion_plans_scope ON public.promotion_plans (organization_id, country_code, sku, created_at DESC);

-- Channel profiles blob (channelProfileService.ts)
CREATE TABLE IF NOT EXISTS public.channel_profiles_store (
  id text PRIMARY KEY,
  profiles jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Shorts channel defaults blob (shortsChannelDefaults.ts)
CREATE TABLE IF NOT EXISTS public.shorts_settings_store (
  id text PRIMARY KEY,
  defaults jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.b2b_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_profiles_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shorts_settings_store ENABLE ROW LEVEL SECURITY;
