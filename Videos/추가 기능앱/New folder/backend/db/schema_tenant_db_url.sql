-- 고객사별 전용 DB URL (로그인·아이디 접속별 테넌트 DB 설정용)
-- tenant_db_url 이 있으면 해당 회사 데이터는 그 DB에서 조회/저장, 없으면 메인 DB 사용
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tenant_db_url VARCHAR(500) DEFAULT NULL;
