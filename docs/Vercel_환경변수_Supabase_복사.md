# Vercel 환경 변수 — Supabase (yuaimarketing)

채팅·이메일로 키를 공유하지 마세요. Supabase 대시보드에서만 복사하세요.

## 프론트엔드 빌드 프로젝트 (YuantO Ai 로그인용)

| 이름 | 값 |
|------|-----|
| `VITE_SUPABASE_URL` | Project URL (`https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | **anon public** JWT (legacy API keys) |

⚠️ **service_role** 키는 프론트에 넣지 마세요.

## 백엔드 / API 프로젝트

| 이름 | 값 |
|------|-----|
| `SUPABASE_URL` | 위와 동일 URL |
| `SUPABASE_ANON_KEY` | anon public JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** JWT (legacy) |

`sb_secret_…` / `sb_publishable_…` 형식은 현재 이 저장소의 `@supabase/supabase-js` 연동에서 사용하지 않습니다. 대시보드 **Project Settings → API**의 **JWT** anon / service_role을 사용하세요.

## 적용 후

**Redeploy** 필수 (환경 변수는 새 빌드에만 포함됩니다).

## 로컬

- `nexus-ai/backend/.env` → `SUPABASE_*`  
- `nexus-ai/frontend/.env` → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`  

이미 동일 프로젝트로 맞춰 두었으면 추가 수정 없습니다.
