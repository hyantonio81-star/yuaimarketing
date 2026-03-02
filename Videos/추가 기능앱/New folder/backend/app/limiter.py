# -*- coding: utf-8 -*-
"""Rate limiter (slowapi). 로그인 등에 적용."""

try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    limiter = Limiter(key_func=get_remote_address)
except Exception:
    limiter = None
