-- Supabase SQL Editor에서 실행하거나 CLI로 적용
-- Shorts 성과 추적(updateVideoStats) 및 jobs 영속화(shortsJobStore)용

-- 1) 영상별 통계 (job_id + platform 유니크)
CREATE TABLE IF NOT EXISTS public.shorts_stats (
  job_id text NOT NULL,
  platform text NOT NULL,
  external_id text,
  views integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, platform)
);

COMMENT ON TABLE public.shorts_stats IS 'Shorts 배포 후 조회/좋아요 등 (백엔드 service_role로 upsert)';

-- 2) Job 스냅샷: id='current' 한 행에 전체 jobs JSON 배열 (shortsJobStore.ts)
CREATE TABLE IF NOT EXISTS public.shorts_jobs (
  id text PRIMARY KEY,
  jobs jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.shorts_jobs IS 'Shorts 파이프라인 job 목록; 기본 키 id=current';

-- RLS: 백엔드는 service_role 사용 시 RLS 우회. Anon으로 직접 접근하지 않도록:
ALTER TABLE public.shorts_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shorts_jobs ENABLE ROW LEVEL SECURITY;

-- 서비스 역할은 대시보드에서 기본적으로 모든 테이블 접근 가능.
-- 클라이언트(anon) 정책은 부여하지 않음 = 프론트에서 직접 읽기 불가.
