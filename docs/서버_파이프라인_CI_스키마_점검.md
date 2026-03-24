# 서버 · Vercel 파이프라인 · CI · SQL 스키마 점검

## 1. 서버 (Backend)

### 구성
- **엔진**: Fastify
- **진입점**: `backend/src/server.ts` → `buildServer()` export (Vercel 서버리스에서 동일 사용)
- **로컬 실행**: `VERCEL !== "1"` 일 때만 `app.listen(port)` (기본 4000)

### 라우트 prefix (모두 `/api` 하위)
| Prefix | 용도 |
|--------|------|
| `/api` | registerRoutes (루트 메시지) |
| `/api/market-intel` | 시장 인텔 |
| `/api/competitors` | 경쟁사 |
| `/api/seo` | SEO |
| `/api/b2b` | B2B 무역 |
| `/api/b2c` | B2C 커머스 |
| `/api/gov` | 입찰 |
| `/api/shorts` | Shorts 에이전트 |
| `/api/nexus` | Nexus 코어 |
| `/api/markets` | 마켓/국가 등 |
| `/api/admin` | 관리자 |

### 보안
- CORS: `ALLOWED_ORIGINS` 있으면 해당 목록, 없으면 `true`
- 헤더: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`
- Health: `GET /health` → `{ status: "ok", service: "yuanto-ai-backend", supabase }`

### 확인 사항
- ✅ 라우트 일괄 등록
- ✅ Vercel 환경에서는 listen 미실행, `buildServer`만 export

---

## 2. Vercel 파이프라인

### 설정 (`vercel.json`)
| 항목 | 값 |
|------|-----|
| buildCommand | `npm run build` |
| installCommand | `npm install` |
| outputDirectory | `frontend/dist` |
| framework | null (커스텀) |
| rewrites | `/((?!api/).*)` → `/index.html` (SPA) |
| functions | `api/[[...path]].ts` (maxDuration 30s, includeFiles `backend/dist/**`) — `memory`는 Active CPU 요금제에서 무시되므로 설정하지 않음 |
| headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |

### API 핸들러 (`api/[[...path]].ts`)
- Vercel 서버리스가 `/api/*` 요청을 이 핸들러로 전달
- `process.cwd()` → `backend/dist/server.js` 로드 후 Fastify `inject()` 로 라우팅
- `/api/health` → Fastify `GET /health` 호출
- 그 외 경로는 그대로 Fastify에 전달 (예: `/api/b2b/options`)

### Root Directory (프로젝트 설정)
- **Monorepo가 상위에 있을 때**: 예) `Music/Mark01/nexus-ai` — 저장소 실제 루트에 맞게 Vercel **Root Directory** 설정
- **저장소 루트가 `nexus-ai`인 경우**: Root Directory 비우거나 `.`
- 설정 스크립트: `npm run vercel:set-root` (VERCEL_TOKEN 필요)

### 확인 사항
- ✅ 빌드 시 `backend/dist` 생성 후 서버리스에 포함
- ✅ SPA 라우트는 `index.html`로 rewrites

---

## 3. CI (GitHub Actions)

### 파일
`.github/workflows/ci.yml`

### 트리거
- push / pull_request → **`main`** (`.github/workflows/ci.yml`)

### 단계
1. checkout
2. Setup Node (`.nvmrc`, npm 캐시)
3. `npm ci`
4. `npm run lint`
5. `npm run test` (backend Vitest)
6. `npm audit --audit-level=high` (`continue-on-error: true`)
7. `npm run build` — 빌드 단계에 `VITE_ALLOW_BUILD_WITHOUT_SUPABASE=true`로 CI 안정화; Repository Secrets에 `VITE_SUPABASE_*` 있으면 프로덕션과 동일 키가 주입됨

### working-directory
- 저장소 루트가 `nexus-ai`이면 `.` (현재 `defaults.run.working-directory: .`)

### 확인 사항
- install → lint → test → build 순서

---

## 4. SQL 스키마 (Supabase)

### 정본
- **`docs/SUPABASE_SCHEMA_RUNBOOK.md`** — 적용 순서·CLI·코드 매핑
- **`supabase/migrations/`** (타임스탬프 순)
  - `20260225100000_b2c_pillar3.sql` — B2C 연동·재고·경쟁사 가격
  - `20260225101000_b2c_24_7.sql` — b2c_settings, b2c_pending_approvals, nexus_routine_runs
  - `20260225120000_shorts_analytics.sql` — shorts_stats, shorts_jobs
  - `20260225130000_extended_app_tables.sql` — b2b_leads, link_clicks, review_analyses, kpi_goals, promotion_plans, channel_profiles_store, shorts_settings_store

### docs SQL 복사본
- `docs/supabase-b2c-migrations.sql`, `docs/supabase-24-7-migrations.sql` — SQL Editor 수동 실행용 (정본은 migrations 폴더와 동기)

### Shorts·확장 테이블

- `shorts_stats`, `shorts_jobs` — Shorts 통계·job 영속화 (`20260225120000_shorts_analytics.sql`).
- `b2b_leads`, `link_clicks`, `review_analyses`, `kpi_goals`, `promotion_plans`, `channel_profiles_store`, `shorts_settings_store` — B2B/리뷰/KPI/프로모션/채널·Shorts 설정 (`20260225130000_extended_app_tables.sql`).

### 확인 사항

- 저장소의 **마이그레이션 정의**와 **원격 Supabase에 실제 적용 여부**는 별개입니다. 일부만 적용된 DB에서는 해당 `.from("…")` 기능만 파일/인메모리 폴백으로 동작할 수 있습니다.
- 스키마 적용 순서·CLI: [SUPABASE_SCHEMA_RUNBOOK.md](./SUPABASE_SCHEMA_RUNBOOK.md)

---

## 5. 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| 서버 | ✅ | Fastify, `buildServer` + Vercel inject |
| Vercel | ✅ | vercel.json, Root Directory는 저장소 구조에 맞게 |
| CI | ✅ | `main`, lint + test + build; Secrets로 `VITE_SUPABASE_*` 주입 + `VITE_ALLOW_BUILD_WITHOUT_SUPABASE`로 포크 호환 |
| SQL (정의) | ✅ | `supabase/migrations/` 4종 + [SUPABASE_SCHEMA_RUNBOOK.md](./SUPABASE_SCHEMA_RUNBOOK.md) |
| SQL (운영 DB) | ⚠️ | 프로젝트마다 `db push` 적용 필요; 미적용 시 일부 기능 폴백 |
