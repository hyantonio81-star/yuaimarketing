# 로컬 개발 워크플로우

**권장**: 수정·테스트는 PC에서 로컬 DB로 진행하고, 완료 후 Supabase + Vercel에 반영합니다.

## 1. 로컬 환경 (PC)

### 옵션 A: Docker 한 번에 (권장)

```bash
# 프로젝트 루트에서
docker-compose up -d
```

- Postgres(5432), Backend(8000), Frontend(5173) 기동
- DB 스키마는 `backend/db/docker-init/01_schema.sql` 로 최초 1회 자동 적용
- 브라우저: http://localhost:5173 → 로그인 (demo / demo)

### 옵션 B: 수동 실행

1. **DB**: PostgreSQL 설치 후 아래 순서로 SQL 실행  
   - `backend/db/schema_factory.sql`  
   - `backend/db/schema_audit_extend.sql`  
   - `backend/db/schema_refresh_tokens.sql`  
   - (선택) `backend/db/schema_sort_order.sql`  
   - (선택) `backend/db/seed_departments.sql`

2. **백엔드**: `backend/.env` 에 `DATABASE_URL=postgresql://user:pass@localhost:5432/dbname` 설정 후  
   ```bash
   cd backend && pip install -r requirements.txt && python run_server.py
   ```

3. **프론트**:  
   ```bash
   cd frontend && npm install && npm run dev
   ```  
   → http://localhost:5173 (프록시로 `/api` → backend 8000)

## 2. 수정·테스트 사이클

- 코드 수정 → 로컬에서 실행·테스트 (pytest, 수동 확인)
- DB 스키마 변경이 있으면 `backend/db/` 에 마이그레이션 SQL 추가 후 로컬 DB에 적용
- **운영(Supabase) DB는 이 단계에서 사용하지 않음**

## 3. 수정 완료 후

- 스키마·마이그레이션을 문서화하고, 배포용 스크립트/순서 정리
- 다음 단계: [배포 가이드](DEPLOY.md) (Supabase 반영 → 백엔드 배포 → Vercel 배포)
