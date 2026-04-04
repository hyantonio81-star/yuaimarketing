-- Row-per-job store for multi-instance safe persistence + indexed queries
-- Legacy public.shorts_jobs (id=current, jobs jsonb) remains optional dual-write target via shortsJobStore.ts

CREATE TABLE IF NOT EXISTS public.shorts_pipeline_jobs (
  job_id text PRIMARY KEY,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  owner_user_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shorts_pipeline_jobs_status ON public.shorts_pipeline_jobs (status);
CREATE INDEX IF NOT EXISTS idx_shorts_pipeline_jobs_owner ON public.shorts_pipeline_jobs (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_shorts_pipeline_jobs_updated ON public.shorts_pipeline_jobs (updated_at DESC);

COMMENT ON TABLE public.shorts_pipeline_jobs IS 'Shorts pipeline job one row per job; payload mirrors ShortsPipelineJob JSON';

ALTER TABLE public.shorts_pipeline_jobs ENABLE ROW LEVEL SECURITY;

-- UTC day bucket for soft daily generation cap
CREATE TABLE IF NOT EXISTS public.shorts_daily_generation (
  day date PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.shorts_daily_generation IS 'UTC date + count of pipeline starts (shorts_claim_daily_generation)';

ALTER TABLE public.shorts_daily_generation ENABLE ROW LEVEL SECURITY;

-- Atomic increment only if below p_max; returns true if slot claimed
CREATE OR REPLACE FUNCTION public.shorts_claim_daily_generation(p_day date, p_max integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int;
BEGIN
  IF p_max IS NULL OR p_max <= 0 THEN
    RETURN true;
  END IF;

  INSERT INTO public.shorts_daily_generation (day, count)
  VALUES (p_day, 0)
  ON CONFLICT (day) DO NOTHING;

  UPDATE public.shorts_daily_generation d
  SET count = d.count + 1,
      updated_at = now()
  WHERE d.day = p_day AND d.count < p_max;

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END;
$$;

COMMENT ON FUNCTION public.shorts_claim_daily_generation IS 'Increment daily counter if under p_max; used by backend service_role';
