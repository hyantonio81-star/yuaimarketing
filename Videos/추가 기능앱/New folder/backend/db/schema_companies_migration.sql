-- 기존 DB에 회사(companies) 및 company_id 추가 시 실행
-- 1) 01_schema.sql 또는 schema_factory.sql 적용된 DB 2) 본 파일 순서대로 실행

-- 회사 테이블
CREATE TABLE IF NOT EXISTS companies (
    company_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기본 회사 1개 (기존 데이터 매핑용)
INSERT INTO companies (name, code) VALUES ('Default', 'DEFAULT')
ON CONFLICT (code) DO NOTHING;

-- departments에 company_id 추가
ALTER TABLE departments ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(company_id) ON DELETE CASCADE;
UPDATE departments SET company_id = 1 WHERE company_id IS NULL;
ALTER TABLE departments ALTER COLUMN company_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_departments_company ON departments(company_id);

-- users에 company_id 추가 (기존 제약: login_name UNIQUE → company_id+login_name으로 변경 시 수동 조정)
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(company_id) ON DELETE CASCADE;
UPDATE users SET company_id = 1 WHERE company_id IS NULL;
ALTER TABLE users ALTER COLUMN company_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
-- (선택) 동일 로그인을 회사별로 허용하려면: 기존 users_login_name_key 제거 후 UNIQUE(company_id, login_name) 추가

-- 고객사별 전용 DB URL (로그인·아이디 접속별 테넌트 DB)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tenant_db_url VARCHAR(500) DEFAULT NULL;
