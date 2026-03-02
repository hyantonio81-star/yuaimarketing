-- 공장 KPI 추적 시스템용 PostgreSQL 스키마
-- 조직도·이행 데이터 연동, ISO 추적성(Traceability) 확보
-- DB 관리 도구에 복사하여 실행하세요.

-- 1. 조직도 (부서 계층 구조)
CREATE TABLE IF NOT EXISTS departments (
    dept_id SERIAL PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    parent_id INTEGER REFERENCES departments(dept_id),
    manager_id INTEGER,
    sort_order INTEGER DEFAULT 0
);

-- 2. 사용자 정보 (로그인·보안)
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    login_name VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    dept_id INTEGER REFERENCES departments(dept_id),
    role VARCHAR(20) CHECK (role IN ('staff', 'leader', 'director', 'gm')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 이행 체크리스트 마스터 (SOP)
CREATE TABLE IF NOT EXISTS checklists (
    task_id SERIAL PRIMARY KEY,
    dept_id INTEGER REFERENCES departments(dept_id),
    task_name VARCHAR(255) NOT NULL,
    frequency VARCHAR(10) DEFAULT 'daily',
    weight FLOAT DEFAULT 1.0
);

-- 4. 실시간 이행 로그
CREATE TABLE IF NOT EXISTS execution_logs (
    log_id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES checklists(task_id),
    user_id INTEGER REFERENCES users(user_id),
    status BOOLEAN DEFAULT FALSE,
    execution_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 월간 KPI 리포트 (AI 인사이트 포함)
CREATE TABLE IF NOT EXISTS kpi_reports (
    report_id SERIAL PRIMARY KEY,
    dept_id INTEGER REFERENCES departments(dept_id),
    target_month VARCHAR(7),
    score FLOAT,
    grade CHAR(1),
    ai_summary TEXT
);

-- 6. 감사 로그 (체크 변경·리포트 조회·로그인 등)
CREATE TABLE IF NOT EXISTS audit_log (
    audit_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(100),
    detail TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_execution_logs_date ON execution_logs(execution_date);
CREATE INDEX IF NOT EXISTS idx_execution_logs_task ON execution_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_user ON execution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_kpi_reports_month ON kpi_reports(target_month);

-- 기존 users 테이블에 컬럼 추가 (이미 생성된 경우 마이그레이션)
-- 수동 실행: ALTER TABLE users ADD COLUMN IF NOT EXISTS login_name VARCHAR(50) UNIQUE;
--            ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
--            ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
