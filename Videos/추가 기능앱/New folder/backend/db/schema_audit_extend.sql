-- 감사 로그 확장 (Phase 1): result, request_method, request_path
-- 기존 audit_log 테이블에 컬럼 추가. 기존 DB에 순차 실행하세요.

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS result VARCHAR(20) DEFAULT 'success';
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS request_method VARCHAR(10);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS request_path VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_audit_log_result ON audit_log(result);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource);

COMMENT ON COLUMN audit_log.result IS 'success | failure';
COMMENT ON COLUMN audit_log.request_method IS 'HTTP method: GET, POST, PATCH, DELETE 등';
COMMENT ON COLUMN audit_log.request_path IS 'API path (예: /api/v1/admin/departments)';
