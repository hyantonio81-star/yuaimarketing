-- KPI 리포트 생성 모듈 연동용 PostgreSQL 스키마
-- 조직도의 계층 구조와 업무 이행 추적을 위한 핵심 테이블 (ISO 9001/42001 추적성 증적)

-- 1. 부서 및 조직도 테이블 (재귀적 구조)
CREATE TABLE IF NOT EXISTS organizations (
    dept_id SERIAL PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    parent_dept_id INTEGER REFERENCES organizations(dept_id), -- 상위 부서 연결
    manager_id INTEGER, -- 팀장/부서장 ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    dept_id INTEGER REFERENCES organizations(dept_id),
    role VARCHAR(20) CHECK (role IN ('staff', 'team_leader', 'manager', 'director', 'gm')),
    email VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. 마스터 체크리스트 (SOP 기반 업무 정의)
CREATE TABLE IF NOT EXISTS checklists (
    task_id SERIAL PRIMARY KEY,
    dept_id INTEGER REFERENCES organizations(dept_id),
    task_title VARCHAR(200) NOT NULL,
    frequency VARCHAR(10) CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    weight INTEGER DEFAULT 1, -- 업무 중요도 가중치
    is_required BOOLEAN DEFAULT TRUE
);

-- 4. 이행 기록 테이블 (실제 업무 수행 데이터)
CREATE TABLE IF NOT EXISTS execution_logs (
    log_id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES checklists(task_id),
    user_id INTEGER REFERENCES users(user_id),
    is_completed BOOLEAN DEFAULT FALSE,
    completion_date DATE DEFAULT CURRENT_DATE,
    evidence_url TEXT, -- 사진 등 증적 자료 링크
    rejection_reason TEXT -- 반려 시 사유
);

-- 5. KPI 리포트 (월간 평가 결과 저장 — 리포트 생성 모듈 출력 저장)
CREATE TABLE IF NOT EXISTS kpi_reports (
    report_id SERIAL PRIMARY KEY,
    dept_id INTEGER REFERENCES organizations(dept_id),
    year_month VARCHAR(7) NOT NULL,
    completion_rate NUMERIC(5,2) NOT NULL,
    deadline_rate NUMERIC(5,2),
    incidents INTEGER DEFAULT 0,
    score NUMERIC(5,2) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    variance NUMERIC(5,2),
    ai_insight TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dept_id, year_month)
);

CREATE INDEX IF NOT EXISTS idx_kpi_reports_year_month ON kpi_reports(year_month);
CREATE INDEX IF NOT EXISTS idx_execution_logs_completion_date ON execution_logs(completion_date);
CREATE INDEX IF NOT EXISTS idx_execution_logs_task_user ON execution_logs(task_id, user_id);
