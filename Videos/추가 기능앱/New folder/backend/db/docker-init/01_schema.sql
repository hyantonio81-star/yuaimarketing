-- Docker Postgres 초기 스키마 (회사·조직·사용자·감사·Refresh Token)
-- /docker-entrypoint-initdb.d 에 마운트 시 최초 1회 실행됨

-- 0. 회사(테넌트). tenant_db_url 이 있으면 해당 고객사 전용 DB 사용, 없으면 메인 DB 사용
CREATE TABLE IF NOT EXISTS companies (
    company_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    tenant_db_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. 조직도 (회사 소속)
CREATE TABLE IF NOT EXISTS departments (
    dept_id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    dept_name VARCHAR(100) NOT NULL,
    parent_id INTEGER REFERENCES departments(dept_id),
    manager_id INTEGER,
    sort_order INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_departments_company ON departments(company_id);

-- 2. 사용자 (회사 소속)
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    login_name VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    dept_id INTEGER REFERENCES departments(dept_id),
    role VARCHAR(20) CHECK (role IN ('staff', 'leader', 'director', 'gm')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, login_name)
);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);

-- 3. 체크리스트
CREATE TABLE IF NOT EXISTS checklists (
    task_id SERIAL PRIMARY KEY,
    dept_id INTEGER REFERENCES departments(dept_id),
    task_name VARCHAR(255) NOT NULL,
    frequency VARCHAR(10) DEFAULT 'daily',
    weight FLOAT DEFAULT 1.0
);

-- 4. 이행 로그
CREATE TABLE IF NOT EXISTS execution_logs (
    log_id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES checklists(task_id),
    user_id INTEGER REFERENCES users(user_id),
    status BOOLEAN DEFAULT FALSE,
    execution_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. KPI 리포트
CREATE TABLE IF NOT EXISTS kpi_reports (
    report_id SERIAL PRIMARY KEY,
    dept_id INTEGER REFERENCES departments(dept_id),
    target_month VARCHAR(7),
    score FLOAT,
    grade CHAR(1),
    ai_summary TEXT
);

-- 6. 감사 로그
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

-- 7. 감사 로그 확장 컬럼
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS result VARCHAR(20) DEFAULT 'success';
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS request_method VARCHAR(10);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS request_path VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_audit_log_result ON audit_log(result);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource);

-- 8. Refresh Token (로그아웃/무효화용)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    jti VARCHAR(64) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
