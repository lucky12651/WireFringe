from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .api import api_router
from .config import settings
from .db import Base, SessionLocal, engine
from . import models
from .services import CategoryService
from .news_bot import start_news_bot_loop
from .db_logger import setup_db_logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Setup DB logging
setup_db_logging()

# Setup Rate Limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for the FastAPI application."""
    # Ensure all tables are created
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")

    # Lightweight schema upgrades (create_all does not add columns)
    try:
        _ensure_user_profile_columns()
        _ensure_comment_moderation_columns()
        _ensure_post_visibility_columns()
        _ensure_post_accent_column()
        _seed_default_categories()
        settings.uploads_dir.mkdir(parents=True, exist_ok=True)
        _migrate_disk_avatars_into_db()
        logger.info("Schema upgrades / seed complete.")
    except Exception as e:
        logger.error(f"Error during schema upgrade/seed: {e}")

    # Check for insecure default secrets
    if settings.session_secret == "dev-secret-change-me":
        logger.warning("SECURITY WARNING: Using default BLOG_SESSION_SECRET. Please change it in .env!")
    if settings.jwt_secret == "dev-jwt-secret-change-me":
        logger.warning("SECURITY WARNING: Using default JWT_SECRET. Please change it in .env!")
    if settings.revalidate_secret == "dev-revalidate-secret":
        logger.warning("SECURITY WARNING: Using default REVALIDATE_SECRET. Please change it in .env!")

    # Start the news bot loop in the background
    bot_task = asyncio.create_task(start_news_bot_loop())
    yield
    # Shutdown logic
    bot_task.cancel()
    try:
        await bot_task
    except asyncio.CancelledError:
        pass


def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(title=settings.app_title, lifespan=lifespan)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=settings.cors_allow_methods,
        allow_headers=settings.cors_allow_headers,
    )

    # Session middleware
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.session_secret,
        session_cookie=settings.session_cookie,
        same_site=settings.same_site,
        https_only=settings.https_only,
    )

    # Static files
    if settings.static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(settings.static_dir)), name="static")

    # Include API routes
    app.include_router(api_router, prefix="/api")

    # Root endpoint
    @app.get("/")
    def root() -> dict:
        return {
            "ok": True,
            "service": settings.app_title,
            "ui": settings.ui_url,
        }

    # Health check
    @app.get("/api/health")
    def health() -> dict:
        return {"ok": True}

    # Legacy UI disabled endpoints
    @app.get("/admin")
    def admin_ui_disabled() -> None:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404, detail=f"UI is served by Next.js ({settings.ui_url})"
        )

    @app.get("/admin/post")
    def admin_post_ui_disabled() -> None:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404, detail=f"UI is served by Next.js ({settings.ui_url})"
        )

    @app.get("/post")
    def post_ui_disabled() -> None:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404, detail=f"UI is served by Next.js ({settings.ui_url})"
        )

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=settings.backend_port,
        reload=True
    )


def _ensure_user_profile_columns() -> None:
    """Best-effort, migration-less schema upgrade for user profile fields."""
    from sqlalchemy import inspect, text

    with engine.begin() as conn:
        inspector = inspect(conn)
        if "users" not in inspector.get_table_names():
            return

        existing = {c["name"] for c in inspector.get_columns("users")}

        if "display_name" not in existing:
            conn.execute(text("ALTER TABLE users ADD COLUMN display_name VARCHAR"))
        if "email" not in existing:
            conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR"))
        if "avatar_url" not in existing:
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR"))
        if "avatar_data" not in existing:
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar_data BYTEA"))
        if "avatar_content_type" not in existing:
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar_content_type VARCHAR"))
        added_brand_byline = False
        if "brand_byline_enabled" not in existing:
            conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN brand_byline_enabled BOOLEAN NOT NULL DEFAULT FALSE"
                )
            )
            added_brand_byline = True
        if "brand_logo_url" not in existing:
            conn.execute(text("ALTER TABLE users ADD COLUMN brand_logo_url VARCHAR"))
        if "brand_logo_data" not in existing:
            conn.execute(text("ALTER TABLE users ADD COLUMN brand_logo_data BYTEA"))
        if "brand_logo_content_type" not in existing:
            conn.execute(text("ALTER TABLE users ADD COLUMN brand_logo_content_type VARCHAR"))

        # One-time default for Wirefringe when feature columns are first introduced
        if added_brand_byline:
            conn.execute(
                text(
                    """
                    UPDATE users
                    SET brand_byline_enabled = TRUE,
                        brand_logo_url = COALESCE(
                            NULLIF(TRIM(brand_logo_url), ''),
                            '/wirefringe.png'
                        )
                    WHERE lower(username) = 'wirefringe'
                    """
                )
            )
        else:
            # Keep a default logo path only if Wirefringe never set one
            conn.execute(
                text(
                    """
                    UPDATE users
                    SET brand_logo_url = '/wirefringe.png'
                    WHERE lower(username) = 'wirefringe'
                      AND (brand_logo_url IS NULL OR TRIM(brand_logo_url) = '')
                    """
                )
            )


def _migrate_disk_avatars_into_db() -> None:
    """If profile/brand images still exist on disk, copy them into DB columns.

    Redeploys wipe the filesystem but keep PostgreSQL, so new uploads go to DB.
    This one-time backfill rescues any remaining on-disk files before the next deploy.
    """
    import hashlib
    from pathlib import Path

    from .models import User

    def _guess_type(path: Path) -> str:
        ext = path.suffix.lower()
        return {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".webp": "image/webp",
        }.get(ext, "image/jpeg")

    def _disk_file(url: str | None) -> Path | None:
        if not url:
            return None
        raw = str(url).split("?", 1)[0].strip()
        if not raw.startswith("/static/uploads/"):
            return None
        name = Path(raw).name
        if not name or name in (".", ".."):
            return None
        path = settings.uploads_dir / name
        return path if path.is_file() else None

    migrated = 0
    with SessionLocal() as db:
        users = db.query(User).all()
        for user in users:
            # Avatar
            if not getattr(user, "avatar_data", None):
                path = _disk_file(getattr(user, "avatar_url", None))
                if path is not None:
                    data = path.read_bytes()
                    user.avatar_data = data
                    user.avatar_content_type = _guess_type(path)
                    ver = hashlib.sha256(data).hexdigest()[:10]
                    user.avatar_url = f"/api/avatars/{user.id}?v={ver}"
                    migrated += 1

            # Brand logo
            if not getattr(user, "brand_logo_data", None):
                path = _disk_file(getattr(user, "brand_logo_url", None))
                if path is not None:
                    data = path.read_bytes()
                    user.brand_logo_data = data
                    user.brand_logo_content_type = _guess_type(path)
                    ver = hashlib.sha256(data).hexdigest()[:10]
                    user.brand_logo_url = f"/api/brand-logos/{user.id}?v={ver}"
                    migrated += 1

        if migrated:
            db.commit()
            logger.info("Migrated %s disk profile/brand image(s) into database.", migrated)


def _ensure_comment_moderation_columns() -> None:
    """Best-effort, migration-less schema upgrade for comment moderation."""
    from sqlalchemy import inspect, text

    with engine.begin() as conn:
        inspector = inspect(conn)
        if "comments" not in inspector.get_table_names():
            return

        existing = {c["name"] for c in inspector.get_columns("comments")}

        if "approved" not in existing:
            conn.execute(
                text("ALTER TABLE comments ADD COLUMN approved BOOLEAN NOT NULL DEFAULT FALSE")
            )
            conn.execute(text("UPDATE comments SET approved = TRUE"))
        if "user_id" not in existing:
            conn.execute(text("ALTER TABLE comments ADD COLUMN user_id INTEGER"))


def _seed_default_categories() -> None:
    """Seed default categories if none exist."""
    with SessionLocal() as db:
        service = CategoryService(db)
        service.seed_defaults()


def _ensure_post_visibility_columns() -> None:
    """Add is_bot / is_hidden on posts and backfill known bot authors."""
    from sqlalchemy import inspect, text

    with engine.begin() as conn:
        inspector = inspect(conn)
        tables = inspector.get_table_names()
        if "posts" not in tables:
            return

        existing = {c["name"] for c in inspector.get_columns("posts")}
        added_is_bot = False
        if "is_bot" not in existing:
            conn.execute(
                text("ALTER TABLE posts ADD COLUMN is_bot BOOLEAN NOT NULL DEFAULT FALSE")
            )
            added_is_bot = True
        if "is_hidden" not in existing:
            conn.execute(
                text("ALTER TABLE posts ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT FALSE")
            )

        # One-time: mark historical Wirefringe bot posts
        if added_is_bot:
            conn.execute(
                text(
                    """
                    UPDATE posts
                    SET is_bot = TRUE
                    WHERE lower(trim(coalesce(creator, ''))) IN ('wirefringe', 'wire fringe')
                    """
                )
            )

    # Ensure app_settings table exists (create_all should handle it; no-op if present)
    try:
        Base.metadata.create_all(bind=engine, tables=[models.AppSetting.__table__])
    except Exception:
        pass


def _ensure_post_accent_column() -> None:
    """Add posts.accent_color for per-article hero/header band."""
    from sqlalchemy import inspect, text

    with engine.begin() as conn:
        inspector = inspect(conn)
        if "posts" not in inspector.get_table_names():
            return
        existing = {c["name"] for c in inspector.get_columns("posts")}
        if "accent_color" not in existing:
            conn.execute(text("ALTER TABLE posts ADD COLUMN accent_color VARCHAR"))


# Create the application instance
app = create_app()
