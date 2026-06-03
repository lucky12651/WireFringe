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
    jwt_secret: str = os.environ.get("JWT_SECRET", "dev-jwt-secret-change-me")
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days
    session_cookie: str = "blog_session"
    same_site: str = "lax"
    https_only: bool = os.environ.get("HTTPS_ONLY", "false").lower() == "true"

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8003",
        "http://127.0.0.1:8003",
        "http://10.5.0.2:3000",
        "http://80.225.223.80:3000",
    ]
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
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

    # AI & Automation
    ollama_api_url: str = os.environ.get("OLLAMA_API_URL", "https://api.ollama.cloud/v1")
    ollama_api_key: str = os.environ.get("OLLAMA_API_KEY", "")
    revalidate_secret: str = os.environ.get("REVALIDATE_SECRET", "dev-revalidate-secret")

    class Config:
        env_file = Path(__file__).resolve().parent / ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # Allow extra environment variables without failing


settings = Settings()
