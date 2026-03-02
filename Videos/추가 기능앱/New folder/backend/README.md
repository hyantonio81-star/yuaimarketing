# KPI 평가 리포트 모듈 (Backend)

React + FastAPI + PostgreSQL 기반 부서별 KPI 등급·월간 경영 평가 리포트 생성 API입니다.  
인증(JWT), 역할 기반 접근(gm/director/leader/staff), 감사 로그, 보안 헤더·CORS·Rate limit 적용.

## 구조

- **`app/kpi_engine.py`**  
  - 가중치 적용 점수: 이행률 60% + 기한준수 20% + (100 - 사고감점) 20%  
  - 등급: S(95+) / A(85+) / B(75+) / C(미만)  
  - pandas 기반 일/주/월 이행률 계산 및 전월 대비 리포트

- **`app/report_generator.py`**  
  - 월간 평가 리포트 생성  
  - 규칙 기반 AI 인사이트 (추세 하락, 금요일 오후 하락, 병목 감지)  
  - LLM 연동 시 `generate_ai_insight_prompt()`로 프롬프트 전달 가능  
  - 공장장용 텍스트 요약 `generate_executive_report_text()`

- **`app/api/report.py`**  
  - `POST /report/kpi-grade` : 단일 부서 등급  
  - `POST /report/kpi-grade-batch` : 복수 부서 등급  
  - `POST /report/evaluation` : 월간 평가 리포트 (JSON)  
  - `POST /report/evaluation/text` : 동일 리포트 텍스트 본문 (`use_production_format=true` 시 [YYYY년 M월 생산본부 평가 요약])  
  - `POST /report/alerts/caution` : 이행률 80% 미만 부서 주의(Caution) 알람 목록 (팀장/감독관 발송용)  
  - `GET /report/evaluation/sample` : 샘플 리포트  
  - `GET /report/evaluation/sample/summary` : 샘플 생산본부 평가 요약 + 주의 알람

- **`db/schema.sql`** (기존 조직도 `organizations` 버전)  
- **`db/schema_factory.sql`** (대시보드 연동용: `departments`, `users`, `checklists`, `execution_logs`, `kpi_reports` — DB 관리 도구에서 실행)
- **`app/api/v1/kpi.py`**, **`app/api/v1/tasks.py`**  
  - `GET /api/v1/kpi/dashboard` (대시보드 한 번에), `GET /api/v1/kpi/department/{dept_id}`, `GET /api/v1/kpi/factory-summary`  
  - `GET /api/v1/tasks/my`, `PATCH /api/v1/tasks/{task_id}/execute` (현장 체크리스트)

- **`app/config.py`**  
  - `CAUTION_RATE_THRESHOLD` (기본 80): 알람 자동화 임계값  
  - `REWARD_SYSTEM_ENABLED`, `REWARD_GRADE_WEIGHT`: 등급을 연말 성과급·인사고과에 반영 (ISO 9001 보상 및 인식 대응)

## 실행 (첫 번째 API 서버 구동)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # 필요 시 DATABASE_URL, JWT_SECRET 수정
python run_server.py
```

- **DB 없이**: demo / demo 로 로그인 가능. `/api/v1/*` 은 Bearer 토큰 필요.
- **DB 연동**: `db/schema_factory.sql` 실행 후 `DATABASE_URL` 설정, `python -m scripts.seed_user` 로 demo 사용자 생성.

또는 `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

- API 문서: http://localhost:8000/docs  
- 로그인: POST /api/v1/auth/login (form: username, password) → access_token  
- 대시보드/체크리스트: Authorization: Bearer <access_token> 필요

## ISO 연동

- **조직도(Context)** : organizations 계층  
- **성과 평가(9.1)** : 부서별 KPI·전월비·등급  
- **지속적 개선(10.2)** : 이행률 하락 시 CAPA 추적, 리포트에 반영  
- **보상 및 인식** : `config.REWARD_SYSTEM_ENABLED`로 등급→성과급/인사고과 연동 설정 (실전 도입 시 규칙 설정)

## 실전 도입 팁

- **알람 자동화**: `POST /report/alerts/caution`을 스케줄러(매일/매주)에서 호출 후, 80% 미만 부서가 있으면 팀장·감독관에게 이메일/메신저로 "주의(Caution)" 발송.  
- **보상 체계**: S/A/B/C 등급을 연말 성과급·인사고과에 반영하는 규칙을 `app/config.py` 또는 운영 설정에서 정의.
