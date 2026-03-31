"""
AI 에이전트 보안 및 RBAC (Role-Based Access Control).
- 데이터 익명화: Gemini 전송 전 개인정보 마스킹
- 권한 계층: CEO > Director > Manager > Leader > Staff
- Human-in-the-loop: AI는 조회/분석만, DB 수정/삭제는 관리자 승인
- 감사 로그: 모든 AI 참조·응답 요약 저장
- 인증: JWT Bearer 전용 (헤더 기반 우회는 명시적으로 활성화한 개발 환경에서만 허용)
"""
import hashlib
import logging
import os
import re
from datetime import datetime, timedelta
from typing import List, Optional

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, Header, HTTPException, Request
from pydantic import BaseModel

load_dotenv()

logger = logging.getLogger(__name__)

# DEBUG 모드: X-User-* 헤더 우회는 DEBUG + 명시적 플래그 모두 필요
_DEBUG_MODE = os.getenv("DEBUG", "0").strip().lower() in ("1", "true", "yes")
_ALLOW_HEADER_AUTH = os.getenv("ALLOW_HEADER_AUTH", "0").strip().lower() in ("1", "true", "yes")


def header_auth_enabled() -> bool:
    return bool(_DEBUG_MODE and _ALLOW_HEADER_AUTH)

# JWT (로그인 API용)
JWT_SECRET = os.getenv("JWT_SECRET", "yuanto-dev-secret-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

_DEFAULT_JWT_SECRET = "yuanto-dev-secret-change-in-production"
if JWT_SECRET == _DEFAULT_JWT_SECRET:
    if not _DEBUG_MODE:
        raise RuntimeError(
            "JWT_SECRET is set to the default insecure value. "
            "Set a strong JWT_SECRET environment variable before running in production."
        )
    logger.warning("WARNING: JWT_SECRET is using the default insecure value. Set JWT_SECRET env var for production.")


# ---------- 비밀번호 해싱 (bcrypt) ----------
def hash_password(plain: str) -> str:
    """Hash a plain-text password with bcrypt. Returns a UTF-8 string."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify plain-text password against a bcrypt hash.
    Also accepts legacy SHA-256 hashes (hex, 64 chars) for backward compatibility.
    """
    if not plain or not hashed:
        return False
    hashed_bytes = hashed.encode("utf-8") if isinstance(hashed, str) else hashed
    # Legacy SHA-256 detection: 64-char hex string
    if len(hashed.strip()) == 64 and all(c in "0123456789abcdef" for c in hashed.strip().lower()):
        import hashlib as _hashlib
        return _hashlib.sha256(plain.encode("utf-8")).hexdigest() == hashed.strip()
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed_bytes)
    except Exception:
        return False


def create_access_token(user_id: int, role: str, dept_id: Optional[int] = None, name: Optional[str] = None) -> str:
    """Create JWT with user id, role, dept_id, name and exp."""
    payload = {
        "sub": user_id,
        "role": role.lower(),
        "dept_id": dept_id,
        "name": name or "",
        "exp": datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify JWT. Returns payload dict or None."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        return None

# 5단계 권한 (조직도 기반)
ROLES = ["ceo", "director", "manager", "leader", "staff"]
ROLE_ORDER = {r: i for i, r in enumerate(ROLES)}  # 숫자가 작을수록 높은 권한


def role_level(role: str) -> int:
    return ROLE_ORDER.get(role.lower(), 99)


def has_min_role(user_role: str, required: str) -> bool:
    return role_level(user_role) <= role_level(required)


# ---------- API 권한 매트릭스 (엔드포인트별 허용 역할) ----------
ALLOWED_MANAGEMENT_SUMMARY = ["ceo", "director"]
ALLOWED_DASHBOARD_EXCEL_REPORT = ["ceo", "director"]
ALLOWED_AI_COPILOT_REMINDERS = ["ceo", "director", "manager", "leader"]
ALLOWED_TASKS_SUBMIT = ["ceo", "director", "manager", "leader", "staff"]
ALLOWED_ADMIN_USERS = ["ceo", "director"]
ALLOWED_DEPT_MODULE = ["ceo", "director", "manager", "leader"]
ALLOWED_AUDIT_LOG = ["ceo", "director"]


class CurrentUser(BaseModel):
    id: int
    role: str
    dept_id: Optional[int] = None
    name: Optional[str] = None


def _current_user_from_headers(
    x_user_id: Optional[str],
    x_user_role: Optional[str],
    x_user_dept_id: Optional[str],
) -> Optional[CurrentUser]:
    """Build CurrentUser from X-User-* headers (strictly opt-in dev mode)."""
    if not header_auth_enabled():
        return None
    if not x_user_id or not x_user_role:
        return None
    try:
        uid = int(x_user_id)
    except ValueError:
        return None
    role = (x_user_role or "").strip().lower()
    if role not in ROLES:
        return None
    dept = None
    if x_user_dept_id:
        try:
            dept = int(x_user_dept_id)
        except ValueError:
            pass
    return CurrentUser(id=uid, role=role, dept_id=dept)


def get_current_user_optional(
    request: Request,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_dept_id: Optional[str] = Header(None, alias="X-User-Dept-Id"),
) -> Optional[CurrentUser]:
    """JWT Bearer 우선. 개발에서 명시 허용한 경우에만 X-User-* 헤더 사용."""
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        token = auth[7:].strip()
        if token:
            payload = decode_token(token)
            if payload:
                role = (payload.get("role") or "").strip().lower()
                if role in ROLES:
                    return CurrentUser(
                        id=int(payload["sub"]),
                        role=role,
                        dept_id=payload.get("dept_id"),
                        name=payload.get("name") or None,
                    )
    return _current_user_from_headers(x_user_id, x_user_role, x_user_dept_id)


def get_current_user(
    request: Request,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_dept_id: Optional[str] = Header(None, alias="X-User-Dept-Id"),
) -> CurrentUser:
    """JWT 또는 X-User-* 헤더로 사용자 추출. 없으면 401."""
    user = get_current_user_optional(request, x_user_id, x_user_role, x_user_dept_id)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Inicie sesión con email y contraseña. (이메일/비밀번호로 로그인해 주세요.)",
        )
    return user


def require_roles(allowed: List[str]):
    """허용 역할 목록으로 의존성 생성. 해당 역할이 아니면 403."""

    def _require(current_user: CurrentUser = Depends(get_current_user)):
        if current_user.role.lower() not in [a.lower() for a in allowed]:
            detail = (
                "Inicie sesión como CEO o Director para gestionar usuarios y departamentos. (CEO 또는 Director로 로그인해 주세요.)"
                if set(a.lower() for a in allowed) == {"ceo", "director"}
                else f"Acceso denegado. Roles permitidos: {allowed}. (권한 없음)"
            )
            raise HTTPException(status_code=403, detail=detail)
        return current_user

    return _require


# ---------- 내부 엔드포인트 API 키 ----------
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")


def verify_internal_api_key(request: Request) -> None:
    """내부 크론 엔드포인트 인증: X-Internal-Key 헤더 검증.
    INTERNAL_API_KEY 환경변수가 설정된 경우에만 강제 검증.
    미설정 시 로컬호프(127.0.0.1, ::1)에서만 허용.
    """
    if INTERNAL_API_KEY:
        provided = request.headers.get("X-Internal-Key", "")
        if provided != INTERNAL_API_KEY:
            raise HTTPException(status_code=403, detail="Internal API key required.")
    else:
        if not _DEBUG_MODE:
            raise HTTPException(
                status_code=503,
                detail="INTERNAL_API_KEY must be configured in non-debug environments.",
            )
        client_host = request.client.host if request.client else ""
        if client_host not in ("127.0.0.1", "::1", "localhost"):
            raise HTTPException(
                status_code=403,
                detail="This endpoint is only accessible from localhost. Set INTERNAL_API_KEY for remote access.",
            )


# ---------- IP 허용 목록 (사내망 제한, 선택) ----------
ALLOWED_IPS: Optional[List[str]] = None


def _load_allowed_ips() -> Optional[List[str]]:
    raw = os.getenv("ALLOWED_IPS")
    if not raw or not raw.strip():
        return None
    return [s.strip() for s in raw.split(",") if s.strip()]


def check_client_ip(request: Request) -> None:
    """ALLOWED_IPS 설정 시 해당 IP만 허용. 아니면 403."""
    global ALLOWED_IPS
    if ALLOWED_IPS is None:
        ALLOWED_IPS = _load_allowed_ips()
    if not ALLOWED_IPS:
        return
    client = request.client.host if request.client else None
    if client not in ALLOWED_IPS:
        raise HTTPException(status_code=403, detail="Acceso no permitido desde esta IP. (이 IP에서 접근 불가)")


# ---------- 데이터 익명화 (Gemini 전송 전) ----------
def sanitize_for_ai(text: str, name_map: Optional[dict] = None) -> str:
    """
    AI 외부 API로 보내기 전 개인정보·실명 마스킹.
    name_map: { "실명": "Usuario_A" } 형태로 치환. 없으면 패턴으로 "Usuario_N" 생성.
    """
    if not text or not isinstance(text, str):
        return ""
    out = text
    if name_map:
        for real_name, alias in name_map.items():
            if real_name and alias:
                out = re.sub(re.escape(real_name), alias, out, flags=re.IGNORECASE)
    out = re.sub(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
        "***@***.***",
        out,
    )
    return out


def build_sanitized_context(summary_text: str, name_map: Optional[dict] = None) -> str:
    """build_context_from_summary 결과에 익명화 적용."""
    return sanitize_for_ai(summary_text, name_map)


def context_hash(text: str) -> str:
    """감사용 컨텍스트 해시 (무결성 확인)."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:64]
