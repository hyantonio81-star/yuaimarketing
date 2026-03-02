# -*- coding: utf-8 -*-
"""
메인 서버 DB 연결 및 스키마 검증.
  python -m scripts.check_db
환경 변수 DATABASE_URL 필요. 성공 시 0, 실패 시 1 반환.
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def main():
    from app.config import DATABASE_URL

    if not DATABASE_URL or not DATABASE_URL.strip():
        print("DATABASE_URL not set. Set it in backend/.env")
        return 1
    import asyncpg
    try:
        conn = await asyncpg.connect(DATABASE_URL.strip())
        try:
            # 필수 테이블 존재 확인
            tables = ["companies", "users", "departments", "checklists", "execution_logs", "kpi_reports", "audit_log", "refresh_tokens"]
            for t in tables:
                row = await conn.fetchval(
                    """SELECT 1 FROM information_schema.tables
                       WHERE table_schema = 'public' AND table_name = $1""",
                    t,
                )
                if not row:
                    print(f"Missing table: {t}")
                    return 1
            # companies.tenant_db_url 컬럼 (선택)
            col = await conn.fetchval(
                """SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'tenant_db_url'"""
            )
            if not col:
                print("Warning: companies.tenant_db_url not found. Run backend/db/schema_tenant_db_url.sql for per-tenant DB.")
            n = await conn.fetchval("SELECT COUNT(*) FROM companies")
            print(f"OK. DB connected. companies: {n}")
            return 0
        finally:
            await conn.close()
    except Exception as e:
        print(f"DB connection failed: {e}")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
