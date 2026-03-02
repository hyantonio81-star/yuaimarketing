# Supabase 연동 가이드

이 프로젝트는 **DB**는 PostgreSQL 연결(`DATABASE_URL`)로 사용하고, **선택적으로** Supabase API(Realtime, Storage, Auth)를 연동할 수 있습니다.

## 1. Supabase 대시보드에서 확인할 값

1. [Supabase](https://supabase.com) → 프로젝트 선택
2. **Settings → API**
   - **Project URL**: `https://<project-ref>.supabase.co` → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - **anon (public)**: 클라이언트용 공개 키 → `SUPABASE_ANON_KEY`(백엔드), `VITE_SUPABASE_ANON_KEY`(프론트)
   - **service_role (secret)**: 서버 전용 비밀 키 → `SUPABASE_SERVICE_ROLE_KEY`(백엔드만, 노출 금지)
3. **Settings → Database**
   - **Connection string (URI)**: 백엔드 DB 연결용 → `DATABASE_URL`

## 2. 백엔드 설정 (`backend/.env`)

```env
# DB를 Supabase로 사용할 때 (배포 시)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Supabase API 연동 시 (Realtime, Storage, Auth Admin 등)
SUPABASE_URL=https://kadxmyzyu.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...   # Settings → API → anon public 전체 복사
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...   # Settings → API → service_role 전체 복사
```

- 로컬에서 Docker Postgres만 쓸 때는 `DATABASE_URL`은 기존대로 두고, Supabase 키만 넣어도 됩니다.

## 3. 프론트엔드 설정 (`frontend/.env`)

```env
VITE_SUPABASE_URL=https://kadxmyzyu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...   # anon public 전체 복사
```

- **service_role** 키는 절대 프론트엔드나 공개 저장소에 넣지 마세요.

## 4. 코드에서 사용

### 프론트엔드 (React)

```javascript
import { supabase, isSupabaseConfigured } from './lib/supabase';

if (isSupabaseConfigured()) {
  // Realtime 구독 예시
  supabase.channel('kpi').on('postgres_changes', { event: '*', schema: 'public', table: 'kpi_reports' }, (payload) => {
    console.log('Change:', payload);
  }).subscribe();
}
```

### 백엔드 (FastAPI)

```python
from app.supabase_client import get_supabase

supabase = get_supabase()
if supabase:
    # Auth Admin, Storage 등 서버 전용 API
    ...
```

## 5. Docker Compose

`docker-compose.yml`에서 백엔드/프론트 서비스에 Supabase 환경 변수가 연결되어 있습니다.  
로컬에서 `.env`를 프로젝트 루트 또는 `backend/`에 두고, 다음처럼 실행하면 됩니다.

```bash
# backend/.env 에 SUPABASE_* 설정 후
docker-compose up -d
```

배포 시에는 호스팅 서비스(Railway, Vercel 등)의 환경 변수에 위 값을 설정하면 됩니다.

## 요약

| 용도 | 설정 위치 | 변수 |
|------|-----------|------|
| DB 연결 (Supabase Postgres) | 백엔드 | `DATABASE_URL` (Settings → Database → Connection string) |
| Supabase API (클라이언트) | 프론트 | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Supabase API (서버) | 백엔드 | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
