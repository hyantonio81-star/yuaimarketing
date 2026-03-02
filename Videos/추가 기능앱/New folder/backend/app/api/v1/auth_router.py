# -*- coding: utf-8 -*-
"""
로그인·현재 사용자 조회.
"""

import logging
from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from ...config import REQUIRE_DATABASE
from ...auth import (
    ADMIN_USER,
    DEMO_USER,
    create_access_token,
    create_refresh_token,
    create_refresh_token_with_jti,
    decode_refresh_token,
    authenticate_user,
    get_current_user,
    get_db_conn,
    is_refresh_token_valid,
    revoke_refresh_token,
    store_refresh_token,
)
from ...limiter import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: Optional[int] = None  # seconds
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    user_id: int
    login_name: str
    name: str
    dept_id: Optional[int]
    role: str
    company_id: Optional[int] = None


async def _login_impl(
    request: Request,
    form_data: OAuth2PasswordRequestForm,
    conn: Optional[asyncpg.Connection],
):
    if REQUIRE_DATABASE and conn is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="데이터베이스에 연결되지 않았습니다. 서버 설정을 확인하세요.",
        )

    login_name = (form_data.username or "").strip().lower()
    password = form_data.password or ""

    if not login_name or not password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="로그인명과 비밀번호를 입력하세요.")

    user: Optional[dict] = None
    if conn:
        user = await authenticate_user(conn, login_name, password)
    if not user and not REQUIRE_DATABASE and login_name == "demo" and password == "demo":
        user = DEMO_USER
    if not user and not REQUIRE_DATABASE and login_name == "antonioyu@jyj.com.do" and password == "dbaod123":
        user = ADMIN_USER

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="로그인명 또는 비밀번호가 올바르지 않습니다.")

    from ...config import ACCESS_TOKEN_EXPIRE_MINUTES
    access_token = create_access_token(str(user["user_id"]), user.get("role", "staff"))
    if conn:
        try:
            refresh_token, jti, expires_at = create_refresh_token_with_jti(str(user["user_id"]), user.get("role", "staff"))
            await store_refresh_token(conn, user["user_id"], jti, expires_at)
        except Exception as e:
            if "refresh_tokens" in str(e) or "does not exist" in str(e).lower():
                refresh_token = create_refresh_token(str(user["user_id"]), user.get("role", "staff"))
            else:
                raise
    else:
        refresh_token = create_refresh_token(str(user["user_id"]), user.get("role", "staff"))
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user,
    )


if limiter:
    @router.post("/login", response_model=TokenResponse)
    @limiter.limit("10/minute")
    async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), conn: Optional[asyncpg.Connection] = Depends(get_db_conn)):
        return await _login_impl(request, form_data, conn)
else:
    @router.post("/login", response_model=TokenResponse)
    async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), conn: Optional[asyncpg.Connection] = Depends(get_db_conn)):
        return await _login_impl(request, form_data, conn)


async def _refresh_impl(body: RefreshRequest, conn: Optional[asyncpg.Connection]):
    """Refresh token으로 새 access_token( 및 refresh_token) 발급. DB 있으면 jti 검증·로테이션."""
    if REQUIRE_DATABASE and conn is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="데이터베이스에 연결되지 않았습니다. 서버 설정을 확인하세요.",
        )
    from ...config import ACCESS_TOKEN_EXPIRE_MINUTES
    payload = decode_refresh_token((body.refresh_token or "").strip())
    if not payload or "sub" not in payload:
        logger.warning("refresh_token_invalid or expired")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="유효하지 않은 refresh token입니다.")
    jti = payload.get("jti")
    if conn and jti:
        try:
            valid = await is_refresh_token_valid(conn, jti)
            if not valid:
                logger.warning("refresh_token_revoked or expired in db")
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="유효하지 않은 refresh token입니다.")
            await revoke_refresh_token(conn, jti)
        except HTTPException:
            raise
        except Exception as e:
            if "refresh_tokens" in str(e) or "does not exist" in str(e).lower():
                pass
            else:
                raise
    sub = payload.get("sub")
    role = payload.get("role") or "staff"
    user_id = int(sub)
    access_token = create_access_token(str(user_id), role)
    if conn:
        try:
            refresh_token, new_jti, expires_at = create_refresh_token_with_jti(str(user_id), role)
            await store_refresh_token(conn, user_id, new_jti, expires_at)
        except Exception as e:
            if "refresh_tokens" in str(e) or "does not exist" in str(e).lower():
                refresh_token = create_refresh_token(str(user_id), role)
            else:
                raise
    else:
        refresh_token = create_refresh_token(str(user_id), role)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={"user_id": user_id, "login_name": "", "name": "", "dept_id": None, "role": role},
    )


if limiter:
    @router.post("/refresh", response_model=TokenResponse)
    @limiter.limit("30/minute")
    async def refresh_tokens(request: Request, body: RefreshRequest, conn: Optional[asyncpg.Connection] = Depends(get_db_conn)):
        return await _refresh_impl(body, conn)
else:
    @router.post("/refresh", response_model=TokenResponse)
    async def refresh_tokens(body: RefreshRequest, conn: Optional[asyncpg.Connection] = Depends(get_db_conn)):
        return await _refresh_impl(body, conn)


@router.post("/logout")
async def logout(body: RefreshRequest, conn: Optional[asyncpg.Connection] = Depends(get_db_conn)):
    """Refresh token 무효화 (DB에서 삭제). 클라이언트는 로그아웃 시 이 API 호출 후 저장된 토큰 제거."""
    payload = decode_refresh_token((body.refresh_token or "").strip())
    if payload and payload.get("jti") and conn:
        try:
            await revoke_refresh_token(conn, payload["jti"])
        except Exception:
            pass
    return {"message": "로그아웃되었습니다."}


@router.get("/me", response_model=UserResponse)
async def me(user: dict = Depends(get_current_user)):
    """현재 로그인 사용자 정보."""
    return UserResponse(
        user_id=user["user_id"],
        login_name=user["login_name"],
        name=user["name"],
        dept_id=user.get("dept_id"),
        role=user.get("role", "staff"),
        company_id=user.get("company_id"),
    )
