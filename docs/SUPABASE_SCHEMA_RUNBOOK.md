# Supabase 스키마 적용 런북 (전체 순서)

백엔드는 **service_role**로 접속하므로 RLS가 켜져 있어도 서버 API는 동작합니다. Anon 클라이언트는 이 테이블들에 정책이 없으면 접근할 수 없습니다.

## 적용 순서

**권장**: `supabase/migrations/` 아래 파일이 타임스탬프 순으로 전체 스키마를 포함합니다.  
`supabase db push` 한 번이면 아래 순서대로 적용됩니다.

| 순서 | 파일 |
|------|------|
| 1 | `20260225100000_b2c_pillar3.sql` |
| 2 | `20260225101000_b2c_24_7.sql` |
| 3 | `20260225120000_shorts_analytics.sql` |
| 4 | `20260225130000_extended_app_tables.sql` |

동일 내용 복사본: [supabase-b2c-migrations.sql](./supabase-b2c-migrations.sql), [supabase-24-7-migrations.sql](./supabase-24-7-migrations.sql) (SQL Editor 수동 실행용).

## CLI로 한 번에 올리기

1. `nexus-ai` 루트에서 `supabase init` (최초 1회)
2. `supabase link --project-ref <프로젝트-ref>`
3. `supabase db push`

CLI 상세: [SUPABASE_CLI_마이그레이션.md](./SUPABASE_CLI_마이그레이션.md)

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

## Auth

- **Supabase Auth**는 대시보드에서 사용자·이메일 확인  
- 앱 연동: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md), [SUPABASE_프론트_Vercel_설정.md](./SUPABASE_프론트_Vercel_설정.md)
