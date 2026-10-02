from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.sessions import SessionMiddleware

from .api import api_router
from .bootstrap.upgrades import run_schema_upgrades
from .bots.news import start_news_bot_loop
from .core.config import settings
from .core.database import Base, engine
from .core.limiter import limiter
from .core.logging import setup_db_logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

setup_db_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for the FastAPI application."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")

    try:
        run_schema_upgrades()
    except Exception as e:
        logger.error(f"Error during schema upgrade/seed: {e}")

    insecure_secrets = []
    if settings.session_secret == "dev-secret-change-me":
        insecure_secrets.append("BLOG_SESSION_SECRET")
    if settings.jwt_secret == "dev-jwt-secret-change-me":
        insecure_secrets.append("JWT_SECRET")
    if settings.revalidate_secret == "dev-revalidate-secret":
        insecure_secrets.append("REVALIDATE_SECRET")
    if insecure_secrets and settings.https_only:
        raise RuntimeError(
            "Refusing to start with default secrets while HTTPS_ONLY is true: "
            + ", ".join(insecure_secrets)
        )
    for name in insecure_secrets:
        logger.warning("SECURITY WARNING: Using default %s. Please change it in .env!", name)

    # Restart the loop if a cycle throws. A live API with a dead bot
    # is how publishing silently stops.
    async def _supervised_news_bot():
        while True:
            try:
                await start_news_bot_loop()
                logger.error("NewsBot loop returned unexpectedly; restarting in 15s.")
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("NewsBot loop crashed; restarting in 15s.")
            await asyncio.sleep(15)

    bot_task = asyncio.create_task(_supervised_news_bot())
    yield
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
    app.add_middleware(SlowAPIMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=settings.cors_allow_methods,
        allow_headers=settings.cors_allow_headers,
    )

    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.session_secret,
        session_cookie=settings.session_cookie,
        same_site=settings.same_site,
        https_only=settings.https_only,
    )

    if settings.static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(settings.static_dir)), name="static")

    app.include_router(api_router, prefix="/api")

    @app.get("/")
    def root() -> dict:
        return {
            "ok": True,
            "service": settings.app_title,
            "ui": settings.ui_url,
        }

    @app.get("/api/health")
    def health() -> dict:
        return {"ok": True}

    @app.get("/admin")
    def admin_ui_disabled() -> None:
        raise HTTPException(
            status_code=404, detail=f"UI is served by Next.js ({settings.ui_url})"
        )

    @app.get("/admin/post")
    def admin_post_ui_disabled() -> None:
        raise HTTPException(
            status_code=404, detail=f"UI is served by Next.js ({settings.ui_url})"
        )

    @app.get("/post")
    def post_ui_disabled() -> None:
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
        reload=True,
    )
