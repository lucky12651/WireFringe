from __future__ import annotations

import os
from pathlib import Path

from pydantic_settings import BaseSettings

PROJECT_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Application configuration settings."""

    # Database
    database_url: str = os.environ.get("DATABASE_URL", "")
    db_connect_timeout: int = int(os.environ.get("DB_CONNECT_TIMEOUT", "5"))

    # Session/Security
    session_secret: str = os.environ.get("BLOG_SESSION_SECRET", "dev-secret-change-me")
    session_cookie: str = "blog_session"
    same_site: str = "lax"
    https_only: bool = False

    # CORS
    cors_origins: list[str] = ["*"]
    cors_allow_credentials: bool = False
    cors_allow_methods: list[str] = ["*"]
    cors_allow_headers: list[str] = ["*"]

    # File Upload
    max_upload_size: int = 5 * 1024 * 1024  # 5MB
    uploads_dir: Path = PROJECT_ROOT / "static" / "uploads"
    static_dir: Path = PROJECT_ROOT / "static"

    # App
    app_title: str = "Coffee n Blog API"
    ui_url: str = "http://127.0.0.1:3000"
    backend_url: str = "http://127.0.0.1:8003"
    backend_port: int = 8003

    class Config:
        env_file = Path(__file__).resolve().parent / ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # Allow extra environment variables without failing


settings = Settings()
