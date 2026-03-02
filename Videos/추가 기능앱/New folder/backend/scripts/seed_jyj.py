# -*- coding: utf-8 -*-
"""
J&J SRL 회사 + SGA 사용자(sga@jyj.com.do / jyjsrl26) 시드.
  python -m scripts.seed_jyj
DB에 companies, departments, users 테이블이 있고 company_id 컬럼이 있어야 함.
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
        print("DATABASE_URL not set. Set it in .env")
        return
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # 회사
        row = await conn.fetchrow(
            "INSERT INTO companies (name, code) VALUES ($1, $2) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING company_id",
            "J&J SRL",
            "JYJ_SRL",
        )
        company_id = row["company_id"]

        # 부서 1개
        dept = await conn.fetchrow(
            "SELECT dept_id FROM departments WHERE company_id = $1 AND dept_name = $2",
            company_id,
            "SGA",
        )
        if not dept:
            dept = await conn.fetchrow(
                "INSERT INTO departments (company_id, dept_name, sort_order) VALUES ($1, $2, 0) RETURNING dept_id",
                company_id,
                "SGA",
            )
        dept_id = dept["dept_id"]

        # SGA 사용자
        pw = hash_password("jyjsrl26")
        await conn.execute(
            """INSERT INTO users (company_id, login_name, password_hash, name, dept_id, role, is_active)
               VALUES ($1, $2, $3, $4, $5, $6, TRUE)
               ON CONFLICT (company_id, login_name) DO UPDATE SET
                 password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, is_active = TRUE""",
            company_id,
            "sga@jyj.com.do",
            pw,
            "SGA",
            dept_id,
            "gm",
        )
        print("J&J SRL company, SGA department, and user sga@jyj.com.do (password: jyjsrl26) created/updated.")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
