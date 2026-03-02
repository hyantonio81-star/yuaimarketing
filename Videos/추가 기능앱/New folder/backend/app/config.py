# -*- coding: utf-8 -*-
"""
설정: DB, 인증, 알람, 보상, 보안.
환경 변수(.env)로 오버라이드.
"""

import os
from pathlib import Path

_env = os.environ.get
_base = Path(__file__).resolve().parent.parent
_dotenv = _base / ".env"
if _dotenv.exists():
    from dotenv import load_dotenv
    load_dotenv(_dotenv)

# DB (없으면 인메모리/샘플 폴백)
DATABASE_URL = _env("DATABASE_URL", "").strip() or None
# True면 DB 연결 필수(미연결 시 로그인·API 503). 로컬 서버 권장값: true
REQUIRE_DATABASE = _env("REQUIRE_DATABASE", "true").lower() == "true"
# 서버 모드 표시 (health 등): local | production
SERVER_MODE = _env("SERVER_MODE", "local").strip() or "local"

# JWT
JWT_SECRET = _env("JWT_SECRET", "change-me-in-production-use-long-random-string")
JWT_ALGORITHM = _env("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(_env("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(_env("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# 보안
CORS_ORIGINS = [o.strip() for o in _env("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]
RATE_LIMIT_ENABLED = _env("RATE_LIMIT_ENABLED", "true").lower() == "true"
RATE_LIMIT_PER_MINUTE = int(_env("RATE_LIMIT_PER_MINUTE", "60"))
RATE_LIMIT_API_PER_MINUTE = int(_env("RATE_LIMIT_API_PER_MINUTE", "120"))  # /api/* 전역

# 알람 자동화
CAUTION_RATE_THRESHOLD = 80.0

# 보상 체계 연동
REWARD_SYSTEM_ENABLED = True
REWARD_GRADE_WEIGHT = {
    "S (탁월)": 1.2,
    "A (우수)": 1.0,
    "B (보통)": 0.8,
    "C (개선필요)": 0.6,
}

# Supabase (선택: Realtime, Storage, Auth 연동 시 사용. DB는 DATABASE_URL 사용)
SUPABASE_URL = _env("SUPABASE_URL", "").strip() or None
SUPABASE_ANON_KEY = _env("SUPABASE_ANON_KEY", "").strip() or None
SUPABASE_SERVICE_ROLE_KEY = _env("SUPABASE_SERVICE_ROLE_KEY", "").strip() or None
