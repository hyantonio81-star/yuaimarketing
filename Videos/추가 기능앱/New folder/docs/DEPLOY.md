# 배포 가이드 (Supabase + 백엔드 + Vercel)

로컬에서 수정·테스트를 마친 뒤, Supabase DB에 스키마를 반영하고 백엔드를 배포한 다음 Vercel에 프론트를 배포하는 순서입니다.

## 전제

- 로컬 개발은 [개발 가이드](DEVELOPMENT.md)대로 PC에서 완료한 상태
- Supabase 프로젝트 생성 완료
- 백엔드 호스팅 서비스 계정 (Railway, Render, Fly.io 등)
- Vercel 계정

---

## 1. Supabase DB 설정

1. [Supabase](https://supabase.com) 대시보드 → 프로젝트 선택 → **SQL Editor**
2. 아래 스키마를 **한 번에** 실행 (또는 파일 내용 붙여넣기):
   - `backend/db/docker-init/01_schema.sql`  
   - (이미 테이블이 있는 경우, 기존 마이그레이션만 필요하면 `schema_audit_extend.sql`, `schema_refresh_tokens.sql` 등 개별 실행 가능)
3. **Settings → Database** 에서 Connection string 확인  
   - 예: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`  
   - 직접 연결(Transaction)용 URL을 백엔드에서 사용하는 것을 권장 (포트 5432 또는 6543)

---

## 2. 백엔드 배포 (Railway / Render 등)

FastAPI는 Vercel 서버리스에 맞지 않으므로 별도 서버에 배포합니다.

### 환경 변수 (백엔드)

| 변수 | 설명 | 예시 |
|------|------|------|
| `DATABASE_URL` | Supabase Connection string | `postgresql://postgres.xxx:yyy@...supabase.com:6543/postgres` |
| `JWT_SECRET` | 32자 이상 랜덤 시크릿 | 운영용 새 시크릿 |
| `CORS_ORIGINS` | 프론트 도메인(쉼표 구분) | `https://your-app.vercel.app` |

- Railway: 프로젝트에 `backend/` 루트로 배포, Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Render: Web Service, Build: `pip install -r requirements.txt`, Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

배포 후 **백엔드 URL** 확인 (예: `https://your-backend.railway.app`). 다음 단계에서 프론트에서 사용합니다.

---

## 3. Vercel에 프론트 배포

1. Vercel 대시보드에서 **Import** → 이 저장소 선택 (또는 `frontend` 폴더만 배포하도록 Root Directory를 `frontend`로 설정)
2. **Root Directory**: `frontend` 로 설정
3. **Environment Variables** 에 추가:
   - `VITE_API_URL` = 배포된 백엔드 URL (끝에 슬래시 없이)  
     예: `https://your-backend.railway.app`
4. Deploy 후 생성된 URL (예: `https://factory-kpi.vercel.app`) 로 접속

빌드 시 `VITE_API_URL` 이 주입되므로, 배포된 프론트는 해당 백엔드로 API 요청을 보냅니다.

---

## 4. 배포 후 확인

- Supabase **Table Editor**에서 `departments`, `users` 등 테이블 존재 확인
- (선택) 시드: `backend/db/seed_departments.sql` 실행, 관리자 계정 생성
- 브라우저에서 Vercel URL 접속 → 로그인 → 대시보드·체크리스트 동작 확인
- CORS: 백엔드 `CORS_ORIGINS` 에 Vercel 도메인이 포함되어 있는지 확인

---

## 요약

| 단계 | 작업 |
|------|------|
| 1 | Supabase SQL Editor에서 `01_schema.sql` 실행 |
| 2 | 백엔드를 Railway/Render 등에 배포, `DATABASE_URL`(Supabase), `CORS_ORIGINS`(Vercel URL) 설정 |
| 3 | Vercel에서 `frontend` 배포, `VITE_API_URL` = 백엔드 URL 설정 |
