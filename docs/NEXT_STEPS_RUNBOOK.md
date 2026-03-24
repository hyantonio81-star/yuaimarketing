# 다음 단계 런북 (배포·검증)

## 1. Supabase SQL (한 번 실행)

전체 스키마·적용 순서: **[SUPABASE_SCHEMA_RUNBOOK.md](./SUPABASE_SCHEMA_RUNBOOK.md)**  
(`supabase/migrations/` 4개 파일 또는 `supabase db push`)

## 2. Vercel 환경 변수

### 프론트 (YuantO Ai 빌드)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` = 배포된 API 베이스 (예: `https://yuaimarketing.vercel.app`)

### 백엔드 / API

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `LANDING_ADMIN_PASSWORD` (Tienda 관리자)
- (선택) `GEMINI_API_KEY`, `SERPAPI_KEY`, `OPENAI_API_KEY`

설정 후 **Redeploy** 필수.

상세: `docs/SUPABASE_프론트_Vercel_설정.md`, `docs/Vercel_환경변수_Supabase_복사.md`

## 3. 로컬 점검

저장소 루트 (`nexus-ai`)에서:

```bash
npm run check-setup
```

## 4. 관리자 계정

백엔드 폴더에서 `.env`에 `SEED_*` 설정 후:

```bash
cd backend && npm run seed-users
```

또는 최초 1회 `/setup`에서 bootstrap.

## 5. 배포 후 스모크 테스트

- `/` 로드, **로그인** (주황 Supabase 경고 없음)
- `/api/health` → 200
- (선택) Shorts 에이전트 페이지에서 FFmpeg 상태 확인

## 6. 보안

- 채팅·이슈에 **service_role** 노출 시 Supabase에서 키 **재발급** 후 Vercel·`.env` 갱신
