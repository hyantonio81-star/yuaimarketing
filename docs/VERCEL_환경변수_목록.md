# Vercel 환경 변수 목록 (Nexus AI / Yuaimarketing)

Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables** 에 입력합니다.  
**Production** / **Preview** 에 각각 넣을지 선택할 수 있습니다. 값을 바꾼 뒤에는 **Redeploy** 가 필요합니다.

프론트는 `VITE_*` 가 **빌드 시**에만 주입되므로, `VITE_*` 를 수정했다면 반드시 재배포하세요.

---

## 1. 프론트엔드 (빌드 타임 — `VITE_` 접두사)

| 변수 | 필수 | 설명 |
|------|------|------|
| `VITE_SUPABASE_URL` | **권장** | Supabase Dashboard → Project Settings → API → **Project URL** |
| `VITE_SUPABASE_ANON_KEY` | **권장** | 같은 화면의 **anon public** JWT 키 |
| `VITE_API_URL` | 선택 | 비우면 브라우저가 **같은 도메인**의 `/api` 사용(단일 Vercel 프로젝트 권장). 외부 API 전용 도메인이 있을 때만 `https://...` 지정 |
| `VITE_REQUIRE_LOGIN` | 선택 | `true` 이면 로그인 화면 우선(프로덕션 권장) |
| `VITE_ALLOW_BUILD_WITHOUT_SUPABASE` | 선택 | `true` 는 Supabase 없이 빌드만 통과(로그인 불가) — 임시용 |

---

## 2. 백엔드 API (런타임 — 서버리스 함수)

### 2.1 핵심 (로그인·DB)

| 변수 | 필수 | 설명 |
|------|------|------|
| `SUPABASE_URL` | **권장** | `VITE_SUPABASE_URL` 과 동일 값 |
| `SUPABASE_ANON_KEY` | **권장** | `VITE_SUPABASE_ANON_KEY` 과 동일 |
| `SUPABASE_SERVICE_ROLE_KEY` | **Shorts·YouTube·관리 기능 시 권장** | Dashboard → API 의 **service_role** (서버 전용, 노출 금지). YouTube OAuth 토큰을 사용자별로 DB에 저장하려면 필요 |
| `ALLOWED_ORIGINS` | 선택 | CORS. 예: `https://your-app.vercel.app` (쉼표로 여러 개). 비우면 개발 편의상 넓게 열릴 수 있음 |

### 2.2 Shorts · YouTube 연동

| 변수 | 필수 | 설명 |
|------|------|------|
| `YOUTUBE_CLIENT_ID` | 업로드·OAuth 시 | Google Cloud Console → OAuth 클라이언트 ID |
| `YOUTUBE_CLIENT_SECRET` | 업로드·OAuth 시 | 클라이언트 보안 비밀 |
| `YOUTUBE_REDIRECT_URI` | 업로드·OAuth 시 | 예: `https://your-app.vercel.app/api/youtube/oauth/callback` (Google 콘솔에 동일 등록) |
| `YOUTUBE_OAUTH_STATE_SECRET` | **프로덕션 권장** | 긴 임의 문자열. 없으면 `CONNECTION_PIN_SECRET` 으로 대체. OAuth `state` 위조 방지·사용자 ID 바인딩 |
| `CONNECTION_PIN_SECRET` | 선택 | PIN/연동용 시크릿. `YOUTUBE_OAUTH_STATE_SECRET` 미설정 시 OAuth state 에 사용될 수 있음 |
| `YOUTUBE_TOKEN_ENCRYPTION_KEY` | 선택 | 토큰 암호화용(설정 시 사용) |
| `YOUTUBE_UPLOAD_PRIVACY` | 선택 | `private` / `unlisted` / `public` (기본 `private`) |
| `YOUTUBE_POLL_PROCESSING` | 선택 | `0` 이면 업로드 후 처리 폴링 비활성 |
| `GOOGLE_API_KEY` 또는 `YOUTUBE_API_KEY` | 선택 | Shorts 트렌드(YouTube Data API) — 없으면 트렌드 스텁 |

### 2.3 Vercel에서 FFmpeg 없을 때 — 원격 조립 워커

| 변수 | 필수 | 설명 |
|------|------|------|
| `SHORTS_WORKER_SECRET` | 원격 조립 사용 시 **권장** | 긴 임의 문자열. 로컬 PC에서 `npm run shorts:assembly-worker` 실행 시 **동일 값**을 `backend/.env` 등에 설정 |
| `SHORTS_DISABLE_REMOTE_ASSEMBLY` | 선택 | `1` 이면 원격 조립 큐 비활성화 |
| `SHORTS_DELEGATE_ASSEMBLY` | 선택 | `1` 이면 FFmpeg 없을 때 원격 조립으로 넘김( `VERCEL` 환경과 함께 쓰이는 경우 많음) |

로컬 워커 쪽( Vercel 이 아님 )에는 추가로:

- `SHORTS_API_BASE` = `https://your-app.vercel.app/api/shorts`
- `FFMPEG_PATH` = Windows 에서 `ffmpeg.exe` 전체 경로 ( `backend/.env` )

자세한 절차: [SHORTS_REMOTE_ASSEMBLY.md](../frontend/public/docs/SHORTS_REMOTE_ASSEMBLY.md), [SHORTS_AGENT.md](./SHORTS_AGENT.md)

### 2.4 AI (Shorts 스크립트·이미지·B2C 등)

| 변수 | 필수 | 설명 |
|------|------|------|
| `GEMINI_API_KEY` | 선택 | 텍스트 LLM 우선(Gemini). 여러 기능에서 사용 |
| `OPENAI_API_KEY` | 선택 | 장면 이미지(DALL·E)·Gemini 없을 때 폴백 |

### 2.5 기타 (필요 시만)

| 변수 | 설명 |
|------|------|
| `LANDING_ADMIN_PASSWORD` | Tienda `/tienda-admin` 운영자 로그인 |
| `LANDING_ORIGIN` | 랜딩 도메인이 API와 다를 때 |
| `VERCEL` | Vercel 이 자동 설정하는 경우가 많음 — 내장 스케줄러·배포 감지 등 |
| `NODE_ENV` | 보통 `production` (플랫폼이 설정) |
| `GEMINI_API_KEY` / Stripe / `BLOGGER_BLOG_ID` 등 | 해당 기능 쓸 때만 ([ENV_AND_DEPS_체크리스트.md](./ENV_AND_DEPS_체크리스트.md) 참고) |

---

## 3. 넣지 않는 것

- **`FFMPEG_PATH`** 를 Vercel 서버리스에 넣어도 **바이너리가 없으면** 실제 조립은 되지 않습니다. FFmpeg 가 필요하면 **Docker 호스트** 또는 **로컬 워커**를 사용하세요.
- **Service Role 키·DB 비밀번호·워커 시크릿** 은 GitHub/Vercel 로그에 노출되지 않게 관리하세요.

---

## 4. 관련 문서

- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) — 배포 절차
- [ENV_AND_DEPS_체크리스트.md](./ENV_AND_DEPS_체크리스트.md) — 전체 변수·도구
- [FFMPEG_SETUP.md](./FFMPEG_SETUP.md) — 로컬 FFmpeg
