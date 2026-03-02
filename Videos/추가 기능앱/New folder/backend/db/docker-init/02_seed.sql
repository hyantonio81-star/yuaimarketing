-- 시드: J&J SRL 회사, SGA 부서, SGA 사용자 (sga@jyj.com.do / jyjsrl26)
-- pgcrypto로 bcrypt 해시 생성 (passlib과 호환)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO companies (name, code)
VALUES ('J&J SRL', 'JYJ_SRL')
ON CONFLICT (code) DO NOTHING;

-- company_id=1 기준 부서 1개 (스키마 적용 직후이므로 1)
INSERT INTO departments (company_id, dept_name, sort_order)
SELECT 1, 'SGA', 0
WHERE EXISTS (SELECT 1 FROM companies WHERE company_id = 1)
  AND NOT EXISTS (SELECT 1 FROM departments WHERE company_id = 1 AND dept_name = 'SGA');

-- SGA 사용자 (비밀번호: jyjsrl26)
INSERT INTO users (company_id, login_name, password_hash, name, dept_id, role)
SELECT 1, 'sga@jyj.com.do', crypt('jyjsrl26', gen_salt('bf')), 'SGA', d.dept_id, 'gm'
FROM companies c
JOIN departments d ON d.company_id = c.company_id AND d.dept_name = 'SGA'
WHERE c.code = 'JYJ_SRL'
ON CONFLICT (company_id, login_name) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  is_active = TRUE;
