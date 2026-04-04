# Supabase 스키마 적용 런북 (전체 순서)

백엔드는 **service_role**로 접속하므로 RLS가 켜져 있어도 서버 API는 동작합니다. Anon 클라이언트는 이 테이블들에 정책이 없으면 접근할 수 없습니다. (Anon용 정책은 추후 필요 시 별도 설계.)

배포·검증 체크리스트는 [NEXT_STEPS_RUNBOOK.md](./NEXT_STEPS_RUNBOOK.md)를 함께 보세요.

## 정본 vs `docs/*.sql`

| 위치 | 역할 |
|------|------|
| **`supabase/migrations/*.sql`** | 스키마 **정본**. 새 테이블·컬럼·인덱스는 여기에만 추가하고, `db push`로 적용합니다. |
| **`docs/supabase-b2c-migrations.sql`**, **`docs/supabase-24-7-migrations.sql`** | Supabase **SQL Editor**에서 수동 실행할 때 쓰는 **복사본**. 내용은 위 마이그레이션 1·2번과 맞춰 두며, 편집 시 migrations와 동기화하세요. |

Shorts·확장 테이블은 migrations에만 있습니다 (`20260225120000_*`, `20260225130000_*`).

## 적용 순서

**권장**: `supabase/migrations/` 아래 파일이 타임스탬프 순으로 전체 스키마를 포함합니다.  
`supabase db push` 한 번이면 아래 순서대로 적용됩니다.

| 순서 | 파일 | 내용 요약 |
|------|------|-----------|
| 1 | `20260225100000_b2c_pillar3.sql` | B2C: `b2c_channel_connections`, `b2c_inventory`, `b2c_competitor_prices` |
| 2 | `20260225101000_b2c_24_7.sql` | 24/7: `b2c_settings`, `b2c_pending_approvals`, `nexus_routine_runs` |
| 3 | `20260225120000_shorts_analytics.sql` | Shorts: `shorts_stats`, `shorts_jobs` |
| 4 | `20260225130000_extended_app_tables.sql` | 확장: `b2b_leads`, `link_clicks`, `review_analyses`, `kpi_goals`, `promotion_plans`, `channel_profiles_store`, `shorts_settings_store` |
| 5 | `20260225140000_shorts_distribution_queue.sql` | Shorts 배포 대기열: `shorts_distribution_queue` |
| 6 | `20260225150000_enable_rls_b2c_tables.sql` | B2C·코어 테이블 RLS 활성화 (anon 직접 접근 차단) |
| 7 | `20260403180000_youtube_oauth_store.sql` | YouTube OAuth: `youtube_oauth_store` (사용자별 `tokens`·`labels` JSON, 서버 전용) |
| 8 | `20260404130000_shorts_pipeline_jobs_row_store.sql` | Shorts: `shorts_pipeline_jobs` (job 행), `shorts_daily_generation`, RPC `shorts_claim_daily_generation` |

동일 내용 복사본(SQL Editor용): [supabase-b2c-migrations.sql](./supabase-b2c-migrations.sql), [supabase-24-7-migrations.sql](./supabase-24-7-migrations.sql).

## CLI로 한 번에 올리기

1. `nexus-ai` 루트에서 `supabase init` (최초 1회)
2. **`backend/.env`**에 `SUPABASE_DB_PASSWORD` 추가 (대시보드 → **Project Settings → Database** → Database password). `SUPABASE_URL`이 있으면 ref는 자동 인식.
3. 루트에서 **`npm run supabase:db-push`** → `supabase db push --db-url …` (로그인 불필요).  
   스크립트는 기본으로 **Session pooler**(IPv4)를 씁니다. `FATAL: Tenant or user not found`이면 대시보드 **Connect**의 pooler 호스트에서 리전을 확인해 `backend/.env`에 `SUPABASE_POOLER_REGION=…` 설정.  
   직접 호스트만 쓰려면 `SUPABASE_DB_DIRECT=1` (다만 `db.*.supabase.co`가 IPv6만 줄 때 네트워크에서 막힐 수 있음).  
   DB 비밀번호를 `.env`에 넣기 싫으면 PowerShell: `$env:SUPABASE_DB_PASSWORD='…'; npm run supabase:db-push` (쉘이 `.env`보다 우선).

수동 예시:

- `npx supabase db push --db-url "postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres" --yes`
- (액세스 토큰이 있으면) `npx supabase link --project-ref <ref> -p "<DB_PASSWORD>" --yes` 후 `npx supabase db push -p "<DB_PASSWORD>" --yes`

원격 이력과 맞지 않으면(최초/복구 시) `SUPABASE_DB_PUSH_INCLUDE_ALL=1 npm run supabase:db-push` 또는 `npx supabase db push ... --include-all`.

CLI 상세: [SUPABASE_CLI_마이그레이션.md](./SUPABASE_CLI_마이그레이션.md)

## GitHub Actions와 프론트 빌드 (`VITE_*`)

- 프로덕션과 동일하게 번들에 Supabase를 넣으려면 저장소 **Secrets**에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 등록하세요. 워크플로는 빌드 단계에서 이 값들을 주입합니다.
- 포크·PR 등 Secrets가 없는 경우에도 빌드가 깨지지 않도록, CI에는 **`VITE_ALLOW_BUILD_WITHOUT_SUPABASE=true`**를 함께 둡니다. 이 경우 로그인 등 Supabase 클라이언트 동작은 배포물과 다를 수 있습니다.
- 설정 상세: [.github/workflows/ci.yml](../.github/workflows/ci.yml), [SUPABASE_프론트_Vercel_설정.md](./SUPABASE_프론트_Vercel_설정.md), [ENV_MATRIX.md](./ENV_MATRIX.md)

## 코드와 매핑

| 테이블 | 서비스/라우트 |
|--------|----------------|
| b2c_channel_connections, b2c_inventory | `backend/src/lib/b2cDb.ts` |
| b2c_settings, b2c_pending_approvals, nexus_routine_runs | 24/7 마이그레이션 |
| shorts_stats, shorts_jobs | Shorts 통계·job 스토어 |
| b2b_leads | `b2bLeadsService.ts` |
| link_clicks | `routes/goRedirect.ts` (`client_ip_hash` = SHA-256) |
| review_analyses | `reviewAnalysisService.ts` |
| kpi_goals | `kpiGoalsService.ts` |
| promotion_plans | `promotionPlanService.ts` |
| channel_profiles_store | `channelProfileService.ts` (`id=current`) |
| shorts_settings_store | `shortsChannelDefaults.ts` (`id=current`) |
| shorts_distribution_queue | `shortsDistributionService.ts` (snake_case 컬럼) |
| youtube_oauth_store | `youtubeUploadService.ts` (`user_id` = Supabase `auth.users.id`, refresh_token만 JSON에 저장) |

## Auth

- **Supabase Auth**는 대시보드에서 사용자·이메일 확인  
- 앱 연동: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md), [SUPABASE_프론트_Vercel_설정.md](./SUPABASE_프론트_Vercel_설정.md)
