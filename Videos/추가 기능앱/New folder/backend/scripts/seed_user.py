# -*- coding: utf-8 -*-
"""
DB에 데모 사용자 1명 생성. (PostgreSQL 연결 필요)
  python -m scripts.seed_user
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

async def main():
    from app.config import DATABASE_URL
    from app.auth import hash_password
    import asyncpg

    if not DATABASE_URL:
        print("DATABASE_URL not set. Set it in .env and run schema_factory.sql first.")
        return
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        dept_id = await conn.fetchval("SELECT dept_id FROM departments WHERE dept_name = $1", "생산1팀")
        if not dept_id:
            await conn.execute("""INSERT INTO departments (dept_name) VALUES ('생산1팀')""")
            dept_id = await conn.fetchval("SELECT dept_id FROM departments WHERE dept_name = $1", "생산1팀")
        if not dept_id:
            dept_id = await conn.fetchval("SELECT dept_id FROM departments LIMIT 1")
        pw_demo = hash_password("demo")
        await conn.execute(
            """INSERT INTO users (login_name, password_hash, name, dept_id, role, is_active)
               VALUES ($1, $2, $3, $4, $5, TRUE)
               ON CONFLICT (login_name) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = TRUE""",
            "demo",
            pw_demo,
            "데모 사용자",
            dept_id or 1,
            "gm",
        )
        pw_admin = hash_password("dbaod123")
        await conn.execute(
            """INSERT INTO users (login_name, password_hash, name, dept_id, role, is_active)
               VALUES ($1, $2, $3, $4, $5, TRUE)
               ON CONFLICT (login_name) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, is_active = TRUE""",
            "antonioyu@jyj.com.do",
            pw_admin,
            "관리자",
            dept_id or 1,
            "gm",
        )
        print("Users created: demo (password: demo), antonioyu@jyj.com.do (password: dbaod123).")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
