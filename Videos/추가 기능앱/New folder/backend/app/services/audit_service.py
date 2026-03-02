# -*- coding: utf-8 -*-
"""
감사 로그: action, resource, detail, user_id, ip, result, request_method, request_path.
Phase 1 확장: 성공/실패, 요청 메서드·경로 기록.
"""

import logging
from typing import Optional

import asyncpg

logger = logging.getLogger(__name__)


async def log_audit(
    conn: Optional[asyncpg.Connection],
    user_id: Optional[int],
    action: str,
    resource: Optional[str] = None,
    detail: Optional[str] = None,
    ip_address: Optional[str] = None,
    result: str = "success",
    request_method: Optional[str] = None,
    request_path: Optional[str] = None,
) -> None:
    if conn is None:
        logger.info(
            "audit: user_id=%s action=%s resource=%s result=%s method=%s path=%s",
            user_id, action, resource, result, request_method, request_path,
        )
        return
    try:
        await conn.execute(
            """INSERT INTO audit_log (user_id, action, resource, detail, ip_address, result, request_method, request_path)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
            user_id,
            action[:50],
            (resource or "")[:100],
            (detail or "")[:500],
            (ip_address or "")[:45],
            (result or "success")[:20],
            (request_method or "")[:10],
            (request_path or "")[:255],
        )
    except Exception as e:
        if "result" in str(e).lower() or "request_method" in str(e).lower() or "column" in str(e).lower():
            try:
                await conn.execute(
                    """INSERT INTO audit_log (user_id, action, resource, detail, ip_address)
                       VALUES ($1, $2, $3, $4, $5)""",
                    user_id,
                    action[:50],
                    (resource or "")[:100],
                    (detail or "")[:500],
                    (ip_address or "")[:45],
                )
            except Exception as e2:
                logger.warning("audit insert failed: %s", e2)
        else:
            logger.warning("audit insert failed: %s", e)
