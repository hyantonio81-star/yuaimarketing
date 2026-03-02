# -*- coding: utf-8 -*-
"""
Supabase 클라이언트 (선택).
환경 변수 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 설정 시 사용.
Auth Admin, Storage, Realtime 등 서버 측 연동용.
"""
from typing import Optional

from .config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

_supabase = None


def get_supabase():
    """설정된 경우에만 Supabase 클라이언트 반환. 없으면 None."""
    global _supabase
    if _supabase is not None:
        return _supabase
    if not (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY):
        return None
    try:
        from supabase import create_client
        _supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        return _supabase
    except Exception:
        return None
