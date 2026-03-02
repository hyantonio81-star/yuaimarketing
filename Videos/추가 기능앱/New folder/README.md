# Yuanto Smart Factory KPI 추적 시스템

DB 스키마 + FastAPI 백엔드 + React 공장장 대시보드·현장 체크리스트 통합 프로토타입.

## 📋 전략 문서

- **[AI KPI 마스터플랜 2028](docs/ai_kpi_masterplan_2028.md)** — SmartKPI AI Agent System 장기 로드맵 (2026–2028), 경쟁 분석, Multi-Agent 아키텍처, 가격·GTM·구현 로드맵, AntoYU 사업 시너지.

## 구조

| 영역 | 경로 | 설명 |
|------|------|------|
| **DB** | `backend/db/docker-init/01_schema.sql` | PostgreSQL: companies, departments, users, checklists, execution_logs, kpi_reports, audit_log, refresh_tokens |
| **Backend** | `backend/` | FastAPI: 리포트 API + **/api/v1/kpi**, **/api/v1/tasks** (대시보드·모바일 연동) |
| **Frontend** | `frontend/` | React + Vite + Tailwind + recharts: 대시보드 + 현장 체크리스트 |

## 실행 순서 (로컬 서버)

1. **DB 필수**: `docker-compose up -d` 로 Postgres+백엔드+프론트 한 번에 실행. 또는 PostgreSQL에 `backend/db/docker-init/01_schema.sql` + `02_seed.sql` 순서로 적용 후 `backend/.env` 에 `DATABASE_URL` 설정.
2. **백엔드**: `cd backend && pip install -r requirements.txt && python run_server.py` → http://localhost:8000
3. **프론트**: `cd frontend && npm install && npm run dev` → http://localhost:5173
4. **로그인**: DB 연결 시 **J&J SRL** 계정 `sga@jyj.com.do` / `jyjsrl26` (시드 포함). DB 미연결 시 로그인 불가(503)·화면에 안내.

- 인증: JWT + **Refresh Token**. 로그인 시 `access_token`·`refresh_token` 발급. DB 연결 시 `refresh_tokens` 테이블에 jti 저장, 로그아웃 시 무효화. 401 시 프론트에서 자동 갱신 후 재시도.
- 역할: gm/director=전체, leader/staff=본인 부서만. 감사 로그·보안 헤더·Rate limit(로그인 10/min, refresh 30/min, API 전역 120/min) 적용.
- **AI 보안**: `app/ai_security.py` — LLM 입력 정제(sanitize)·출력 검증(validate). 리포트 생성 시 적용.
- **감사 로그 확장**: `db/schema_audit_extend.sql` 실행 시 result, request_method, request_path 컬럼 추가. API 호출 시 method/path 자동 기록.
- **Refresh Token 무효화**: `db/schema_refresh_tokens.sql` 실행 시 `refresh_tokens` 테이블 생성. 로그인/갱신 시 jti 저장, 로그아웃 시 서버에서 삭제되어 해당 토큰으로 재갱신 불가.

## 조직도·18개 팀·관리 화면

- **부서 시드**: PostgreSQL 적용 후 `db/seed_departments.sql` 실행 또는 `python -m scripts.seed_departments` 로 18개 팀 등록 (Corrugadora, Produccion, Inspeccion de Calidad, Sistema Gestion de Calidad, Diseno y Desarrollo, Materia Prima, Transporte, Despacho, Almacen PT, Mantenimiento Mecanico, Caldera, Limpieza, Seguridad, RRHH, Compras, Planificacion, Repuesto, Submaterial).
- **기존 DB**: `db/schema_sort_order.sql` 실행 후 `sort_order` 컬럼 추가.
- **관리 화면**: gm/director 로그인 후 메뉴 "Organigrama / Pipeline" → Organización(부서 추가/편집/삭제), Pipeline(대시보드 표시 순서).

## API (대시보드·모바일·관리)

- `GET /api/v1/kpi/dashboard` — 대시보드 한 번에 (부서 목록 + 전사 요약 + AI 인사이트)
- `GET /api/v1/kpi/department/{dept_id}` — 부서별 KPI
- `GET /api/v1/kpi/factory-summary` — 전사 요약
- `GET /api/v1/tasks/my` — 오늘 내 체크리스트
- `PATCH /api/v1/tasks/{task_id}/execute` — 이행 체크 (body: `{ "done": true/false }`)
- **Admin (gm/director)**: `GET/POST /api/v1/admin/departments`, `PATCH/DELETE /api/v1/admin/departments/{id}`, `GET/PATCH /api/v1/admin/pipeline`
- **인증**: `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- **상태**: `GET /api/v1/health` — `db_connected`, `mode` (로컬에서 DB 미연결 시 프론트에서 안내)

## 메인 DB + 고객사별 DB (아이디 접속별 설정)

- **메인 DB**: 인증(users, companies, refresh_tokens), 감사(audit_log)는 항상 메인 DB(`DATABASE_URL`) 사용.
- **고객사별 DB**: `companies.tenant_db_url` 에 해당 고객사 전용 PostgreSQL URL을 넣으면, 해당 회사 사용자 로그인 시 KPI·부서·체크리스트·이행 데이터는 그 DB에서 조회/저장. 비어 있으면 메인 DB 사용. (고객사 전용 DB에는 메인과 동일한 스키마·테이블이 있어야 함: departments, users, checklists, execution_logs, kpi_reports 등.)
- **검증**: 메인 DB 연결·스키마 확인은 `cd backend && python -m scripts.check_db` 실행. (필수 테이블·`companies.tenant_db_url` 컬럼 확인)
- **마이그레이션**: 기존 DB에 컬럼만 추가 시 `backend/db/schema_tenant_db_url.sql` 실행.

## 개발·배포 흐름 (권장)

1. **로컬에서 개발·테스트**: PC에서 Docker 또는 수동으로 DB·백엔드·프론트 실행 → 수정·테스트 완료할 때까지 **로컬 DB만** 사용.  
   → 상세: [로컬 개발 가이드](docs/DEVELOPMENT.md)
2. **수정 완료 후 배포**: Supabase에 스키마 반영 → 백엔드 배포(Railway/Render 등) → Vercel에 프론트 배포.  
   → 상세: [배포 가이드](docs/DEPLOY.md)  
   → Supabase URL/키 연동: [Supabase 연동 가이드](docs/SUPABASE.md)

- 프론트 배포 시 `VITE_API_URL` 에 배포된 백엔드 URL을 설정하면 API 호출이 해당 서버로 연결됩니다.

## Docker 및 CI

- **로컬 풀 스택**: `docker-compose up -d` → Postgres(5432), Backend(8000), Frontend(5173). **DB 스키마**는 `backend/db/docker-init/01_schema.sql` 이 최초 기동 시 자동 적용됨. 프론트는 `VITE_PROXY_TARGET=http://backend:8000` 로 백엔드 프록시.
- **Rate limit**: API 전역 한도(120/분)는 IP당 인메모리 적용(단일 인스턴스 기준). 다중 인스턴스 시 Redis 등 공유 저장소 검토.
- **CI**: `.github/workflows/ci.yml` — push 시 백엔드 Ruff 린트 + pytest 단위 테스트, 프론트 빌드.

## 운영 시나리오 (ISO & KPI 연동)

- **현장**: 모바일에서 체크 → `execution_logs` 기록
- **서버**: 부서별 completion_rate 실시간 계산
- **대시보드**: 공장장 화면에 이행률·AI 인사이트 반영
- **리포트**: 매월 말 KPI 성적표 생성 (기존 `/report/*` API 활용)
