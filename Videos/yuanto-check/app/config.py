"""
Centralized application settings using Pydantic Settings.
All environment variables are validated and documented here.
Usage: from app.config import settings
"""
import os
from typing import List, Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- Database ---
    database_url: str = "sqlite:///./yuanto.db"

    # --- JWT ---
    jwt_secret: str = "yuanto-dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # --- Security ---
    debug: bool = False
    allowed_origins: str = ""
    allowed_ips: str = ""
    internal_api_key: str = ""

    # --- AI ---
    gemini_api_key: str = ""
    use_gemini: bool = True

    # --- Wialon GPS ---
    wialon_token: str = ""
    wialon_base_url: str = "https://hst-api.wialon.com/wialon/ajax.html"

    # --- File Upload ---
    max_upload_size_mb: int = 10
    max_photo_px: int = 1024
    jpeg_quality: int = 80

    # --- App ---
    app_env: str = "development"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    @field_validator("jwt_secret")
    @classmethod
    def warn_default_jwt_secret(cls, v: str) -> str:
        default = "yuanto-dev-secret-change-in-production"
        if v == default:
            import logging
            logging.getLogger(__name__).warning(
                "WARNING: JWT_SECRET is using the default insecure value. "
                "Set JWT_SECRET env var before deploying to production."
            )
        return v

    def get_allowed_origins(self) -> List[str]:
        if not self.allowed_origins.strip():
            if self.app_env.strip().lower() in ("production", "prod"):
                return []
            return [
                "http://localhost:3080",
                "http://localhost:4173",
                "http://127.0.0.1:3080",
                "http://127.0.0.1:4173",
            ]
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    def get_allowed_ips(self) -> Optional[List[str]]:
        if not self.allowed_ips.strip():
            return None
        return [ip.strip() for ip in self.allowed_ips.split(",") if ip.strip()]


settings = Settings()
