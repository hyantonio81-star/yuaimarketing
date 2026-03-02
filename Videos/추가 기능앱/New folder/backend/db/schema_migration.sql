-- 기존 DB에 이미 users 테이블이 있을 때만 실행 (컬럼 추가)
-- PostgreSQL 9.5+: DO 블록으로 컬럼 존재 시 스킵

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='login_name') THEN
    ALTER TABLE users ADD COLUMN login_name VARCHAR(50) UNIQUE;
    ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
    ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;
