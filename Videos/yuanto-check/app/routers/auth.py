import logging
import time
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter()
logger = logging.getLogger(__name__)
LOGIN_BUCKET: dict[str, list[float]] = {}
LOCKOUT_UNTIL: dict[str, float] = {}
LOGIN_WINDOW_SECONDS = 60
MAX_ATTEMPTS_PER_WINDOW = 5
LOCKOUT_SECONDS = 300


class LoginBody(BaseModel):
    email: str
    password: str


@router.get("/api/v1/status")
def get_status():
    return {"status": "Online", "server": "Yuanto Local Server"}


@router.post("/api/v1/auth/login")
def auth_login(body: LoginBody, db: Session = Depends(get_db)):
    """Login with email and password. Returns JWT and user payload. User must have email and password_hash set."""
    email = (body.email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="El correo es obligatorio.")
    now = time.time()
    locked_until = LOCKOUT_UNTIL.get(email, 0)
    if locked_until > now:
        raise HTTPException(status_code=429, detail="Demasiados intentos. Intente más tarde.")

    attempts = [ts for ts in LOGIN_BUCKET.get(email, []) if (now - ts) <= LOGIN_WINDOW_SECONDS]
    LOGIN_BUCKET[email] = attempts
    if len(attempts) >= MAX_ATTEMPTS_PER_WINDOW:
        LOCKOUT_UNTIL[email] = now + LOCKOUT_SECONDS
        raise HTTPException(status_code=429, detail="Demasiados intentos. Intente más tarde.")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        LOGIN_BUCKET[email].append(now)
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos.")
    if not getattr(user, "password_hash", None) or not user.password_hash.strip():
        LOGIN_BUCKET[email].append(now)
        raise HTTPException(status_code=401, detail="Cuenta sin contraseña. Contacte al administrador.")
    if not verify_password((body.password or "").strip(), user.password_hash.strip()):
        LOGIN_BUCKET[email].append(now)
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos.")
    # Re-hash legacy SHA-256 passwords to bcrypt on successful login
    if len(user.password_hash.strip()) == 64:
        user.password_hash = hash_password((body.password or "").strip())
        db.commit()
    if getattr(user, "is_active", True) is False:
        LOGIN_BUCKET[email].append(now)
        raise HTTPException(status_code=403, detail="Cuenta desactivada.")
    LOGIN_BUCKET.pop(email, None)
    LOCKOUT_UNTIL.pop(email, None)
    token = create_access_token(
        user_id=user.id,
        role=user.role or "staff",
        dept_id=user.dept_id,
        name=user.name,
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name or "",
            "role": (user.role or "staff").lower(),
            "dept_id": user.dept_id,
        },
    }


@router.get("/api/v1/auth/me")
def auth_me(current_user: object = Depends(get_current_user)):
    """Return current user from JWT or X-User-* headers."""
    return {
        "id": getattr(current_user, "id"),
        "name": getattr(current_user, "name") or "",
        "role": (getattr(current_user, "role") or "staff").lower(),
        "dept_id": getattr(current_user, "dept_id"),
    }
