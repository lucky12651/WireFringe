from __future__ import annotations

import os
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Application configuration settings."""

    # Database
    database_url: str = Field("", validation_alias="DATABASE_URL")
    db_connect_timeout: int = Field(5, validation_alias="DB_CONNECT_TIMEOUT")

    # Session/Security
    session_secret: str = Field("dev-secret-change-me", validation_alias="BLOG_SESSION_SECRET")
    jwt_secret: str = Field("dev-jwt-secret-change-me", validation_alias="JWT_SECRET")
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days
    session_cookie: str = "blog_session"
    same_site: str = "lax"
    https_only: bool = Field(False, validation_alias="HTTPS_ONLY")

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8003",
        "http://127.0.0.1:8003",
        "http://10.5.0.2:3000",
        "http://80.225.223.80:3000",
        "https://wirefringe.gridwork.me",
        "http://wirefringe.gridwork.me",
    ]
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    cors_allow_headers: list[str] = ["*"]

    # File Upload
    max_upload_size: int = 5 * 1024 * 1024  # 5MB
    uploads_dir: Path = PROJECT_ROOT / "static" / "uploads"
    static_dir: Path = PROJECT_ROOT / "static"

    # App — default 8000 matches GridWork monorepo / Docker (override via BACKEND_URL / BACKEND_PORT)
    app_title: str = "Wirefringe API"
    ui_url: str = "http://127.0.0.1:3000"
    backend_url: str = Field("http://127.0.0.1:8000", validation_alias="BACKEND_URL")
    backend_port: int = Field(8000, validation_alias="BACKEND_PORT")

    # AI & Automation
    ollama_api_url: str = Field("https://api.ollama.cloud/v1", validation_alias="OLLAMA_API_URL")
    ollama_api_key: str = Field("", validation_alias="OLLAMA_API_KEY")
    groq_api_key: str = Field("", validation_alias="GROQ_API_KEY")
    groq_model: str = Field("llama-3.3-70b-versatile", validation_alias="GROQ_MODEL")
    revalidate_secret: str = Field("dev-revalidate-secret", validation_alias="REVALIDATE_SECRET")

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
