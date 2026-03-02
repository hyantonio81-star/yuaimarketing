# -*- coding: utf-8 -*-
"""인증·Refresh Token 단위 테스트."""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.auth import (
    create_access_token,
    create_refresh_token,
    create_refresh_token_with_jti,
    decode_refresh_token,
)


def test_create_and_decode_refresh_token():
    """유효한 refresh token 생성 후 decode_refresh_token으로 payload 확인."""
    token = create_refresh_token("1", "gm")
    payload = decode_refresh_token(token)
    assert payload is not None
    assert payload.get("sub") == "1"
    assert payload.get("role") == "gm"
    assert payload.get("type") == "refresh"


def test_decode_refresh_token_rejects_access_token():
    """access token은 decode_refresh_token에서 None 반환."""
    access = create_access_token("1", "gm")
    payload = decode_refresh_token(access)
    assert payload is None


def test_decode_refresh_token_invalid_returns_none():
    """잘못된/만료된 토큰은 None."""
    assert decode_refresh_token("") is None
    assert decode_refresh_token("invalid.jwt.here") is None


def test_create_refresh_token_with_jti():
    """create_refresh_token_with_jti returns (token, jti, expires_at) and payload has jti."""
    token, jti, expires_at = create_refresh_token_with_jti("1", "gm")
    assert token
    assert jti
    assert len(jti) == 32
    assert expires_at is not None
    payload = decode_refresh_token(token)
    assert payload is not None
    assert payload.get("jti") == jti
