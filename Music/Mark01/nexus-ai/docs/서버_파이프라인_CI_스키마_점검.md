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
| functions | `api/[[...path]].ts` (memory 1024, maxDuration 30s, includeFiles `backend/dist/**`) |
| headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |

### API 핸들러 (`api/[[...path]].ts`)
- Vercel 서버리스가 `/api/*` 요청을 이 핸들러로 전달
- `process.cwd()` → `backend/dist/server.js` 로드 후 Fastify `inject()` 로 라우팅
- `/api/health` → Fastify `GET /health` 호출
- 그 외 경로는 그대로 Fastify에 전달 (예: `/api/b2b/options`)

### Root Directory (프로젝트 설정)
- **필수**: `Music/Mark01/nexus-ai` (저장소 구조에 맞게 설정됨)
- 설정 스크립트: `npm run vercel:set-root` (VERCEL_TOKEN 필요)

### 확인 사항
- ✅ 빌드 시 `backend/dist` 생성 후 서버리스에 포함
- ✅ SPA 라우트는 `index.html`로 rewrites

---

## 3. CI (GitHub Actions)

### 파일
`.github/workflows/ci.yml`

### 트리거
- push / pull_request → `main`, `master`

### 단계
1. checkout
2. Setup Node (`.nvmrc` 기준, npm 캐시)
3. `npm ci`
4. `npm run lint`
5. `npm run build`

### working-directory
- **현재**: `Music/Mark01/nexus-ai` (저장소 루트가 상위일 때)
- **단일 프로젝트 루트**인 경우: `ci.yml`에서 `defaults.run.working-directory` 제거하고, `node-version-file`을 `.nvmrc`, `cache-dependency-path`를 `package-lock.json`으로 변경

### 확인 사항
- ✅ Vercel 빌드와 동일한 순서 (install → lint → build)

---

## 4. SQL 스키마 (Supabase B2C)

### 파일
`docs/supabase-b2c-migrations.sql`

### 테이블

#### b2c_channel_connections
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid | PK, default gen_random_uuid() |
| organization_id | text | NOT NULL, default 'default' |
| channel | text | NOT NULL |
| store_url | text | |
| store_name | text | |
| connected_at | timestamptz | NOT NULL, default now() |
| UNIQUE | (organization_id, channel) | |

인덱스: `idx_b2c_connections_org` (organization_id)

#### b2c_inventory
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid | PK |
| organization_id | text | NOT NULL, default 'default' |
| country_code | text | |
| sku | text | NOT NULL |
| central_quantity | integer | NOT NULL, default 0 |
| updated_at | timestamptz | NOT NULL, default now() |
| UNIQUE | (organization_id, country_code, sku) | |

인덱스: `idx_b2c_inventory_org_country` (organization_id, country_code)

#### b2c_competitor_prices (선택)
| 컬럼 | 타입 |
|------|------|
| id | uuid |
| organization_id | text |
| channel | text |
| sku_or_product | text |
| price | numeric |
| fetched_at | timestamptz |

### 백엔드 연동
- `backend/src/lib/b2cDb.ts`에서 `b2c_channel_connections`, `b2c_inventory` 사용
- 컬럼명·UNIQUE 제약과 코드(upsert onConflict 등) **일치** ✅

### 확인 사항
- ✅ 스키마와 b2cDb.ts 사용처 일치
- ✅ Supabase SQL Editor에서 위 마이그레이션 실행 필요 (RLS는 추후 추가 가능)

---

## 5. 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| 서버 | ✅ | Fastify, 라우트/보안 정리됨 |
| Vercel 파이프라인 | ✅ | vercel.json + api 핸들러, Root Directory 설정됨 |
| CI | ✅ | main/master, working-directory 반영 (구조에 맞게 조정 가능) |
| SQL 스키마 | ✅ | B2C 테이블 3개, b2cDb와 일치 |
