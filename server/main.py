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
from .services import CategoryService
from .news_bot import start_news_bot_loop

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Setup Rate Limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for the FastAPI application."""
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
        if "avatar_url" not in existing:
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR"))


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


def _seed_default_categories() -> None:
    """Seed default categories if none exist."""
    with SessionLocal() as db:
        service = CategoryService(db)
        service.seed_defaults()


# Create the application instance
app = create_app()


@app.on_event("startup")
def on_startup() -> None:
    """Startup event handler."""
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Schema migrations
    _ensure_user_profile_columns()
    _ensure_comment_moderation_columns()

    # Seed data
    _seed_default_categories()

    # Ensure uploads directory exists
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
