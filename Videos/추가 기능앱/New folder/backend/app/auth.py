# -*- coding: utf-8 -*-
"""
인증: 비밀번호 해시, JWT 발급/검증, get_current_user, Refresh Token DB 무효화.
"""

import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional, Tuple

import asyncpg
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import (
    JWT_ALGORITHM,
    JWT_SECRET,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    REQUIRE_DATABASE,
)
from .db import get_db_conn, get_tenant_conn

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(sub: str, role: str = "") -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(sub), "role": role, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(sub: str, role: str = "", jti: Optional[str] = None) -> str:
    """jti 없으면 새로 생성. DB 무효화 시 jti로 조회/삭제."""
    jti = jti or uuid.uuid4().hex
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": str(sub), "role": role, "exp": expire, "type": "refresh", "jti": jti}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token_with_jti(sub: str, role: str = "") -> Tuple[str, str, datetime]:
    """(token, jti, expires_at) 반환. DB 저장용."""
    jti = uuid.uuid4().hex
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": str(sub), "role": role, "exp": expire, "type": "refresh", "jti": jti}
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, jti, expire


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None


def decode_refresh_token(token: str) -> Optional[dict]:
    payload = decode_token(token)
    if payload and payload.get("type") == "refresh":
        return payload
    return None


async def store_refresh_token(conn: asyncpg.Connection, user_id: int, jti: str, expires_at: datetime) -> None:
    """Refresh token jti를 DB에 저장 (로그인/갱신 시)."""
    await conn.execute(
        "INSERT INTO refresh_tokens (jti, user_id, expires_at) VALUES ($1, $2, $3)",
        jti,
        user_id,
        expires_at,
    )


async def revoke_refresh_token(conn: asyncpg.Connection, jti: str) -> bool:
    """jti에 해당하는 refresh token 삭제 (로그아웃/로테이션 시). 반환: 삭제된 행 수 > 0."""
    r = await conn.execute("DELETE FROM refresh_tokens WHERE jti = $1", jti)
    return r and "DELETE 1" in r or r == "DELETE 1"


async def is_refresh_token_valid(conn: asyncpg.Connection, jti: str) -> bool:
    """jti가 DB에 있고 만료 전이면 True."""
    row = await conn.fetchrow(
        "SELECT 1 FROM refresh_tokens WHERE jti = $1 AND expires_at > NOW()",
        jti,
    )
    return row is not None


async def get_user_by_login(conn: asyncpg.Connection, login_name: str) -> Optional[asyncpg.Record]:
    row = await conn.fetchrow(
        """SELECT user_id, company_id, login_name, password_hash, name, dept_id, role, is_active
           FROM users WHERE LOWER(login_name) = $1 AND is_active = TRUE""",
        login_name.strip().lower(),
    )
    return row


async def authenticate_user(conn: asyncpg.Connection, login_name: str, password: str) -> Optional[dict]:
    row = await get_user_by_login(conn, login_name)
    if not row or not row["is_active"]:
        return None
    if not verify_password(password, row["password_hash"] or ""):
        return None
    return {
        "user_id": row["user_id"],
        "company_id": row.get("company_id"),
        "login_name": row["login_name"],
        "name": row["name"],
        "dept_id": row["dept_id"],
        "role": row["role"] or "staff",
    }


# DB 없을 때 데모 사용자 (sub=1 토큰). REQUIRE_DATABASE=true면 사용 안 함.
DEMO_USER = {
    "user_id": 1,
    "company_id": 1,
    "login_name": "demo",
    "name": "데모 사용자",
    "dept_id": 1,
    "role": "gm",
}

# 관리자 (DB 없을 때 sub=2 토큰). REQUIRE_DATABASE=true면 사용 안 함.
ADMIN_USER = {
    "user_id": 2,
    "company_id": 1,
    "login_name": "antonioyu@jyj.com.do",
    "name": "관리자",
    "dept_id": 1,
    "role": "gm",
}


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    conn: Optional[asyncpg.Connection] = Depends(get_db_conn),
) -> Optional[dict]:
    if REQUIRE_DATABASE and conn is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="데이터베이스에 연결되지 않았습니다. 서버 설정을 확인하세요.",
        )
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload or "sub" not in payload:
        return None
    sub = payload["sub"]
    try:
        uid = int(sub)
    except (TypeError, ValueError):
        return None
    if conn is None:
        if uid == 1:
            return DEMO_USER
        if uid == 2:
            return ADMIN_USER
        return None
    row = await conn.fetchrow(
        "SELECT user_id, company_id, login_name, name, dept_id, role FROM users WHERE user_id = $1 AND is_active = TRUE",
        uid,
    )
    if not row:
        return None
    return {
        "user_id": row["user_id"],
        "company_id": row.get("company_id"),
        "login_name": row["login_name"],
        "name": row["name"],
        "dept_id": row["dept_id"],
        "role": row["role"] or "staff",
    }


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    conn: Optional[asyncpg.Connection] = Depends(get_db_conn),
) -> dict:
    user = await get_current_user_optional(credentials, conn)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증이 필요합니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_roles(*allowed: str):
    """역할 제한 의존성."""

    async def _check(user: dict = Depends(get_current_user)):
        if user["role"] in allowed:
            return user
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="권한이 없습니다.")

    return _check


async def require_gm_or_director(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] in ("gm", "director"):
        return user
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="공장장/감독관 권한이 필요합니다.")


async def get_tenant_conn_dependency(
    main_conn: Optional[asyncpg.Connection] = Depends(get_db_conn),
    user: dict = Depends(get_current_user),
):
    """고객사별 DB 연결. 로그인 사용자 company_id 기준으로 tenant_db_url 있으면 해당 DB, 없으면 메인 DB."""
    company_id = user.get("company_id") if user else None
    async with get_tenant_conn(main_conn, company_id) as conn:
        yield conn
