# Supabase 연동 가이드

NEXUS AI는 **Supabase**를 서버(DB·Auth·Realtime 등)로 사용합니다.

---

## 1. Supabase 프로젝트 준비

1. [supabase.com](https://supabase.com) 로그인 후 **New project** 생성.
2. **Project Settings → API**에서 아래 값 확인:
   - **Project URL** → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY` (프론트용)
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (백엔드 전용, 노출 금지)

---

## 2. 백엔드 설정

`nexus-ai/backend` 폴더에 `.env` 파일 생성 (또는 `.env.example`을 복사 후 값 채우기):

```env
PORT=4000
NODE_ENV=development

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

- 백엔드에서는 `src/lib/supabaseServer.ts`의 `getSupabaseAdmin()`으로 서버 전용 클라이언트 사용.
- `/health` 응답에 `supabase: "configured"` 가 있으면 연동된 상태.

---

## 3. 프론트엔드 설정

`nexus-ai/frontend` 폴더에 `.env` 파일 생성:

```env
VITE_API_URL=http://localhost:4000

VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

- 프론트에서는 `src/lib/supabase.js`의 `supabase` 클라이언트 사용 (Auth, Realtime, DB + RLS).
- `VITE_` 접두사만 Vite가 노출하므로 반드시 이 이름을 사용.

---

## 4. 사용 위치

| 구분 | 파일 | 용도 |
|------|------|------|
| 백엔드 | `backend/src/lib/supabaseServer.ts` | 서버에서 DB/Admin 작업 (`getSupabaseAdmin()`) |
| 백엔드 | `backend/src/config/index.ts` | `config.supabase` (URL, service role key) |
| 프론트 | `frontend/src/lib/supabase.js` | 브라우저에서 Auth·Realtime·DB (`supabase`) |

---

## 5. 권장 사항

- **service_role** 키는 백엔드 `.env`에만 두고, Git/클라이언트에 올리지 마세요.
- 프론트엔드는 **anon** 키만 사용하고, 보안은 Supabase **RLS( Row Level Security )** 로 관리하세요.
- `.env`는 `.gitignore`에 포함되어 있어야 합니다.
