# -*- coding: utf-8 -*-
"""
PostgreSQL 연결 풀. 메인 DB + 고객사별 테넌트 DB(tenant_db_url) 지원.
로그인 사용자 company_id 기준으로 해당 회사 tenant_db_url 이 있으면 해당 DB 사용, 없으면 메인 DB 사용.
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Dict, Optional

import asyncpg

from .config import DATABASE_URL

logger = logging.getLogger(__name__)
_pool: Optional[asyncpg.Pool] = None
_tenant_pools: Dict[str, asyncpg.Pool] = {}


async def get_pool() -> Optional[asyncpg.Pool]:
    global _pool
    if _pool is not None:
        return _pool
    if not DATABASE_URL:
        logger.warning("DATABASE_URL not set; using in-memory/sample data.")
        return None
    try:
        _pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=1,
            max_size=10,
            command_timeout=60,
        )
        return _pool
    except Exception as e:
        logger.exception("DB pool create failed: %s", e)
        return None


async def get_tenant_pool(url: str) -> Optional[asyncpg.Pool]:
    """고객사 전용 DB URL별 풀 캐시. 동일 URL은 한 풀만 유지."""
    global _tenant_pools
    url = (url or "").strip()
    if not url:
        return None
    if url in _tenant_pools:
        return _tenant_pools[url]
    try:
        pool = await asyncpg.create_pool(
            url,
            min_size=1,
            max_size=5,
            command_timeout=60,
        )
        _tenant_pools[url] = pool
        return pool
    except Exception as e:
        logger.exception("Tenant pool create failed for url (masked): %s", url[:30] + "...")
        return None


async def get_tenant_db_url(main_conn: asyncpg.Connection, company_id: int) -> Optional[str]:
    """메인 DB companies 테이블에서 해당 회사의 tenant_db_url 조회."""
    if not main_conn or not company_id:
        return None
    try:
        row = await main_conn.fetchrow(
            "SELECT tenant_db_url FROM companies WHERE company_id = $1 AND is_active = TRUE",
            company_id,
        )
        if row and row.get("tenant_db_url"):
            return (row["tenant_db_url"] or "").strip() or None
    except Exception as e:
        logger.debug("get_tenant_db_url: %s", e)
    return None


@asynccontextmanager
async def get_tenant_conn(
    main_conn: Optional[asyncpg.Connection],
    company_id: Optional[int],
) -> AsyncGenerator[Optional[asyncpg.Connection], None]:
    """
    고객사 데이터용 연결. company_id의 tenant_db_url 이 있으면 해당 DB, 없으면 메인 conn 반환.
    """
    if main_conn is None:
        yield None
        return
    if not company_id:
        yield main_conn
        return
    url = await get_tenant_db_url(main_conn, company_id)
    if not url:
        yield main_conn
        return
    pool = await get_tenant_pool(url)
    if pool is None:
        yield main_conn
        return
    async with pool.acquire() as conn:
        yield conn


@asynccontextmanager
async def get_db() -> AsyncGenerator[Optional[asyncpg.Connection], None]:
    pool = await get_pool()
    if pool is None:
        yield None
        return
    async with pool.acquire() as conn:
        yield conn


async def get_db_conn():
    """FastAPI Depends용: 요청당 메인 DB 커넥션 한 번 yield (인증·감사·회사 메타용)."""
    pool = await get_pool()
    if pool is None:
        yield None
        return
    async with pool.acquire() as conn:
        yield conn


async def close_pool() -> None:
    global _pool, _tenant_pools
    if _pool:
        await _pool.close()
        _pool = None
        logger.info("DB pool closed.")
    for url, p in list(_tenant_pools.items()):
        try:
            await p.close()
        except Exception as e:
            logger.warning("Tenant pool close: %s", e)
    _tenant_pools.clear()
