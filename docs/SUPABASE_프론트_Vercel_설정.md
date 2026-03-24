# YuantO Ai 로그인 — Supabase 프론트 환경 변수 (Vercel)

로그인 화면에 **「Supabase가 설정되지 않았습니다」**가 나오면, **비밀번호 문제가 아니라** 빌드 시점에 `VITE_*` 변수가 없어서 브라우저에 Supabase 클라이언트가 만들어지지 않은 상태입니다.

> **Vite 규칙:** `VITE_` 로 시작하는 값은 **`npm run build` 할 때** 주입됩니다. Vercel에 변수만 넣고 **Redeploy** 하지 않으면 이전 빌드(변수 없음)가 그대로 배포됩니다.

프로덕션 빌드 시 변수가 없으면 빌드 로그에서 오류로 안내됩니다(`frontend/vite.config.js`).

## 반드시 넣을 변수 (프론트 / Vite)

| 변수명 | 값 출처 |
|--------|---------|
| `VITE_SUPABASE_URL` | Supabase 대시보드 → **Project Settings** → **API** → **Project URL** |
| `VITE_SUPABASE_ANON_KEY` | 같은 화면의 **anon public** 키 (⚠️ service_role 키는 넣지 마세요) |

백엔드 `.env`의 `SUPABASE_URL` / `SUPABASE_ANON_KEY`와 **같은 프로젝트**여야 로그인·API가 맞습니다.

## Vercel 설정 절차

1. [Vercel](https://vercel.com) → **yuaimarketing**(또는 프론트를 빌드하는 프로젝트) 선택  
2. **Settings** → **Environment Variables**  
3. 아래 두 개 추가 (Production, Preview 필요 시 둘 다)  
   - `VITE_SUPABASE_URL` = `https://<프로젝트-ref>.supabase.co`  
   - `VITE_SUPABASE_ANON_KEY` = anon public 키 전체  
4. **Deployments** → 최신 배포 **⋯** → **Redeploy** (환경 변수는 **재빌드** 후에야 프론트에 반영됩니다)

## 로컬 개발

`nexus-ai/frontend/.env` 예시는 `frontend/.env.example` 참고.  
`VITE_API_URL`은 API 서버 주소(예: `http://localhost:4000` 또는 배포된 `/api` 베이스).

## 확인

재배포 후 로그인 페이지에서 주황색 Supabase 미설정 경고가 **사라지고**, 이메일·비밀번호로 로그인이 되면 정상입니다.
