# Vercel 연동 확인 (yuaimarketing.vercel.app)

- **프로젝트 ID**: `prj_pSDwd60OjCnRlcw09ApsFfmXWJft`

## 1. 현재 상태 (확인 일자 기준)

| 항목 | URL | 결과 |
|------|-----|------|
| **프론트** | https://yuaimarketing.vercel.app/ | ✅ 정상 (대시보드 로드) |
| **API 헬스** | https://yuaimarketing.vercel.app/api/health | ❌ 404 |

**결론**: 프론트만 배포되어 있고, **API(백엔드)가 배포에 포함되지 않은 상태**입니다.  
원인: Vercel **Root Directory**가 프로젝트 폴더(`api/`, `backend/`, `frontend/`가 있는 폴더)를 가리키지 않음.

---

## 2. 저장소 구조 (GitHub)

현재 푸시된 구조는 다음과 같습니다.

```
리포지토리 루트 (yuaimarketing)
└── Music/
    └── Mark01/
        └── nexus-ai/          ← 여기가 프로젝트 루트
            ├── api/           ← 서버리스 함수 ([[...path]].ts)
            ├── backend/
            ├── frontend/
            ├── package.json
            └── vercel.json
```

- **Root Directory를 비우면** Vercel은 리포지토리 루트를 기준으로 빌드하므로 `api/`를 찾지 못해 `/api/*` → 404.
- **Root Directory를 `Music/Mark01/nexus-ai`로 설정**하면 위 `nexus-ai` 폴더가 빌드 루트가 되어 `api/`, `backend/`, `frontend/`가 모두 포함됩니다.

---

## 3. 연동 수정 절차

1. **Vercel 대시보드**  
   https://vercel.com → 로그인 → **yuaimarketing** 프로젝트 선택

2. **Root Directory 설정**  
   - **Settings** → **General**  
   - **Root Directory** → **Edit**  
   - 값 입력: **`Music/Mark01/nexus-ai`**  
   - **Save**

3. **Node.js Version (Production Overrides 경고 해소)**  
   - **Settings** → **Build and Deployment** → **Node.js Version**  
   - **20.x** 선택 후 **Save**  
   - "Configuration Settings in the current Production deployment differ from your current Project Settings" 경고는 이렇게 맞추고 **Redeploy** 하면 사라집니다.  
   - 또는 터미널에서: `VERCEL_TOKEN=토큰 npm run vercel:set-root` 실행 시 Root Directory와 함께 Node 20.x가 API로 설정됩니다.

4. **재배포**  
   - **Deployments** 탭 → 최신 배포 오른쪽 **⋯** → **Redeploy**  
   - 또는 새 커밋 푸시로 자동 재배포  
   - **Node.js Version을 바꾼 경우 반드시 새 배포가 필요합니다.**

5. **빌드 확인**  
   - 재배포 시 **Building** 로그에서  
     - `npm run build` (backend + frontend) 실행  
     - `backend/dist` 생성  
     - `frontend/dist` 생성  
   - 실패 시 로그에서 오류 확인

---

## 4. 연동 성공 확인

설정 후 아래처럼 확인하세요.

| 확인 항목 | 방법 |
|-----------|------|
| API 헬스 | https://yuaimarketing.vercel.app/api/health → **200** + `{"status":"ok", ...}` |
| API 예시 | https://yuaimarketing.vercel.app/api/markets/countries → **200** + JSON |
| 프론트 | https://yuaimarketing.vercel.app/ → 대시보드 정상, B2B/ market-intel 등 페이지 동작 |

- `/api/health`가 **200**이면 서버와 Vercel 연동이 정상입니다.

---

## 5. Supabase · Vercel 파이프라인 및 환경 변수

### 5.1 파이프라인 구조

```
[브라우저] → yuaimarketing.vercel.app
     │
     ├─ / (정적)     → rewrites → frontend/dist/index.html (SPA)
     │
     └─ /api/*       → 서버리스 함수 api/[[...path]].ts
                            │
                            └─ backend/dist/server.js (Fastify) → inject()
                                 │
                                 ├─ GET /health → { status, supabase: "configured" | "not_configured" }
                                 ├─ /api/markets, /api/b2b, /api/b2c, /api/admin, ...
                                 └─ Supabase 사용 라우트 → getSupabaseAdmin() → Supabase API
```

- **프론트**: `VITE_SUPABASE_*`로 클라이언트용 Supabase(로그인/세션), API 호출은 같은 도메인 `/api`로 전송.
- **백엔드(서버리스)**: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`(또는 `SUPABASE_ANON_KEY`)로 서버용 Supabase 클라이언트 사용 (B2C DB, 재고 동기화, 이커머스 연동, 관리자 등).

### 5.2 Vercel 환경 변수 (필수)

Vercel 대시보드 → **Settings** → **Environment Variables**에서 아래를 설정하세요.  
(Production / Preview / Development 중 필요한 환경에 체크.)

| 변수명 | 용도 | 비고 |
|--------|------|------|
| `SUPABASE_URL` | 백엔드가 Supabase 접속 | Supabase 대시보드 → Project Settings → API |
| `SUPABASE_ANON_KEY` | 백엔드(anon 폴백) / 프론트 빌드 | 동일 |
| `SUPABASE_SERVICE_ROLE_KEY` | 백엔드 관리자 연산(RLS 우회) | **절대 프론트에 노출 금지** |
| `VITE_SUPABASE_URL` | 프론트 빌드 시 Supabase URL | 배포 시 빌드에 포함됨 |
| `VITE_SUPABASE_ANON_KEY` | 프론트 빌드 시 anon 키 | 배포 시 빌드에 포함됨 |

- **선택**: `VITE_API_URL` — 비우거나 넣지 않으면 프로덕션에서는 같은 오리진(`/api`) 사용.  
- **선택**: `ALLOWED_ORIGINS` — CORS 허용 오리진 (쉼표 구분). 없으면 `true`(모든 오리진).

### 5.3 연동 점검 체크리스트

| 순서 | 확인 항목 | 방법 | 기대 결과 |
|------|-----------|------|-----------|
| 1 | Root Directory | Vercel → Settings → General | `Music/Mark01/nexus-ai` |
| 2 | API 헬스 | `GET https://yuaimarketing.vercel.app/api/health` | **200**, `{"status":"ok","service":"yuanto-ai-backend", ...}` |
| 3 | Supabase 연동 여부 | 위 응답의 `supabase` 필드 | `"configured"` (환경 변수 설정됨) / `"not_configured"` (미설정) |
| 4 | API 예시(DB 미사용) | `GET .../api/markets/countries` | **200** + JSON |
| 5 | API 예시(Supabase 사용) | `GET .../api/b2c/...` 또는 로그인 후 대시보드 기능 | **200** 또는 의도한 동작 |
| 6 | 프론트 로그인/세션 | 사이트 접속 → 로그인 | Supabase Auth 동작 (VITE_SUPABASE_* 빌드 반영 여부 확인) |

- `supabase: "not_configured"`이면 Vercel에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`(또는 `SUPABASE_ANON_KEY`)가 없거나 배포 시 주입되지 않은 것입니다. 환경 변수 저장 후 **Redeploy** 필요.

---

## 6. API로 Root Directory + Node 20.x 한 번에 설정 (선택)

토큰이 있으면 터미널에서 한 번에 설정할 수 있습니다.

1. **토큰 발급**: https://vercel.com/account/tokens → Create → 복사
2. **실행** (nexus-ai 폴더에서):
   ```bash
   set VERCEL_TOKEN=여기에_토큰_붙여넣기
   npm run vercel:set-root
   ```
   (PowerShell: `$env:VERCEL_TOKEN="토큰"; npm run vercel:set-root`)
3. 설정 후 Vercel 대시보드에서 **Redeploy** 실행.

---

## 7. 배포 Error 원인 (master vs main)

- **master** 브랜치로 배포 시 **Error** (1s 만에 실패): 리포 루트에 `api/`, `package.json`이 없어 빌드가 바로 실패합니다. **Root Directory**를 `Music/Mark01/nexus-ai`로 설정하면 해결됩니다.
- **main** 브랜치로 배포 시 **Ready**: 해당 브랜치에는 이미 올바른 루트 구조가 있거나, 예전에 Root가 설정된 상태로 배포된 경우입니다.
- **권장**: Root Directory = `Music/Mark01/nexus-ai` 로 맞춘 뒤 **master**와 **main** 모두 Redeploy 하면, 두 브랜치 모두 빌드 성공할 수 있습니다.

---

## 8. npm deprecated 경고 줄이기

- **package.json overrides**: `tar`, `glob`, `rimraf`를 최신 대역으로 올려서 해당 deprecation 경고를 제거했습니다. `package-lock.json`을 커밋해 두었으므로 Vercel에서도 동일한 버전이 설치됩니다.
- **.npmrc**: `loglevel=error`로 두면 `npm install` 시 deprecation 경고가 로그에 찍히지 않습니다. (npmlog, inflight, gauge 등은 Vercel/의존성 체인 깊은 곳에서 오므로 override 대신 로그만 숨김.)
- 경고를 다시 보고 싶으면 `.npmrc`에서 해당 줄을 제거하거나 `loglevel=warn`으로 바꾸면 됩니다.

---

## 9. 요약

- **연동 대상**: GitHub **hyantonio81-star/yuaimarketing** ↔ Vercel 프로젝트 **yuaimarketing** (ID: `prj_pSDwd60OjCnRlcw09ApsFfmXWJft`)
- **필수 설정**: Root Directory = **`Music/Mark01/nexus-ai`**, Node 20.x
- **Supabase**: Vercel 환경 변수에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정 후 Redeploy
- **점검**: Redeploy 후 `/api/health` → 200 및 `supabase: "configured"` 확인
