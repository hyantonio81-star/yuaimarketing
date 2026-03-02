# -*- coding: utf-8 -*-
"""
FastAPI 앱: 조직도 기반 KPI·리포트 API.
인증, 역할 기반 접근, 감사 로그, 보안 헤더.
"""

import logging
import sys
import time as _time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.report import router as report_router
from .api.v1 import admin_router, auth_router, kpi_router, tasks_router
from .config import CORS_ORIGINS, RATE_LIMIT_ENABLED, RATE_LIMIT_API_PER_MINUTE, SERVER_MODE
from .db import close_pool, get_pool
from .limiter import limiter

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

# API 전역 rate limit (IP별 분당 요청 수, 단일 인스턴스 인메모리)
_api_rate_limit_cache: dict = {}  # (ip, minute_key) -> count


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_pool()
    logger.info("App shutdown.")


app = FastAPI(
    title="KPI 평가 리포트 API",
    description="부서별 이행률·등급 산출 및 월간 경영 평가 리포트 (ISO 9001/42001), 인증·역할·감사 로그",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

try:
    from slowapi.errors import RateLimitExceeded
    from slowapi import _rate_limit_exceeded_handler
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
except Exception:
    pass
if limiter is not None:
    app.state.limiter = limiter


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    # 1) API 전역 rate limit (429 시 여기서 반환)
    if RATE_LIMIT_ENABLED and request.url.path.startswith("/api/"):
        client = request.client and request.client.host or "unknown"
        minute_key = int(_time.time()) // 60
        key = (client, minute_key)
        if key not in _api_rate_limit_cache:
            _api_rate_limit_cache[key] = 0
        _api_rate_limit_cache[key] += 1
        if _api_rate_limit_cache[key] > RATE_LIMIT_API_PER_MINUTE:
            logger.warning("rate_limit_exceeded path=%s client=%s count=%s", request.url.path, client, _api_rate_limit_cache[key])
            return JSONResponse(status_code=429, content={"detail": "요청 한도를 초과했습니다. 잠시 후 다시 시도하세요."})
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "서버 오류가 발생했습니다. 관리자에게 문의하세요."},
    )


app.include_router(report_router)
app.include_router(admin_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(kpi_router, prefix="/api/v1")
app.include_router(tasks_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"service": "KPI Report API", "docs": "/docs", "auth": "Bearer token required for /api/v1"}


@app.get("/api/v1/health")
async def health():
    """로컬/배포 환경에서 DB 연결 여부 확인. 프론트에서 db_connected로 미연결 시 안내."""
    pool = await get_pool()
    return {
        "status": "ok",
        "db_connected": pool is not None,
        "mode": SERVER_MODE,
    }
