"""Startup schema upgrades that create_all cannot apply."""

from __future__ import annotations

import logging

from .. import models
from ..auth.identity import LOGIN_EMAIL_MAP
from ..core.config import settings
from ..core.database import Base, SessionLocal, engine
from ..models import User
from ..services import CategoryService
from .newsroom import apply_newsroom_schema

logger = logging.getLogger(__name__)


def run_schema_upgrades() -> None:
    """Add missing columns, backfill data, and seed defaults."""
    _ensure_user_profile_columns()
    _migrate_usernames_to_emails()
    _ensure_comment_moderation_columns()
    _ensure_contact_messages_table()
    _ensure_post_visibility_columns()
    _ensure_post_accent_column()
    apply_newsroom_schema()
    _seed_default_categories()
    try:
        from ..services.catalog_service import CatalogService

        catalog_db = SessionLocal()
        try:
            CatalogService(catalog_db).get(seed=True)
        finally:
            catalog_db.close()
    except Exception as exc:
        logger.warning("Catalog seed skipped: %s", exc)
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    _migrate_disk_avatars_into_db()
    logger.info('Schema upgrades / seed complete.')


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
                    WHERE lower(username) IN ('wirefringe', 'team@wirefringe.com')
                       OR lower(coalesce(email, '')) IN ('wirefringe', 'team@wirefringe.com')
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
                    WHERE (
                        lower(username) IN ('wirefringe', 'team@wirefringe.com')
                        OR lower(coalesce(email, '')) IN ('wirefringe', 'team@wirefringe.com')
                    )
                      AND (brand_logo_url IS NULL OR TRIM(brand_logo_url) = '')
                    """
                )
            )


def _migrate_usernames_to_emails() -> None:
    """Use email as the login id. Keep display names. Do not rewrite post bylines."""
    from sqlalchemy import inspect, text

    with engine.begin() as conn:
        inspector = inspect(conn)
        if "users" not in inspector.get_table_names():
            return
        columns = {c["name"] for c in inspector.get_columns("users")}
        if "username" not in columns:
            return

        if "email" not in columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR"))

        for old_username, email in LOGIN_EMAIL_MAP.items():
            rows = conn.execute(
                text(
                    """
                    SELECT id, username, email, display_name
                    FROM users
                    WHERE lower(username) = :old
                       OR lower(coalesce(email, '')) = :old
                       OR lower(coalesce(email, '')) = :email
                    """
                ),
                {"old": old_username, "email": email},
            ).mappings().all()
            if not rows:
                continue
            for row in rows:
                display = (row["display_name"] or "").strip()
                if not display:
                    # Keep the human name that used to live in username.
                    if old_username == "wirefringe":
                        display = "WireFringe"
                    else:
                        display = row["username"] or old_username
                conn.execute(
                    text(
                        """
                        UPDATE users
                        SET username = :email,
                            email = :email,
                            display_name = :display
                        WHERE id = :id
                        """
                    ),
                    {"email": email, "display": display, "id": row["id"]},
                )

        # If a login is already an email, keep the email column in sync.
        conn.execute(
            text(
                """
                UPDATE users
                SET email = username
                WHERE (email IS NULL OR TRIM(email) = '')
                  AND username LIKE '%@%'
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

        tables = set(inspector.get_table_names())
        if "comment_reports" not in tables:
            conn.execute(
                text(
                    """
                    CREATE TABLE comment_reports (
                        id SERIAL PRIMARY KEY,
                        comment_id INTEGER NOT NULL REFERENCES comments(id),
                        reason TEXT NOT NULL,
                        reporter_name VARCHAR,
                        reporter_user_id INTEGER REFERENCES users(id),
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
            )
            conn.execute(text("CREATE INDEX ix_comment_reports_comment_id ON comment_reports (comment_id)"))


def _ensure_contact_messages_table() -> None:
    """Create contact_messages if an older database is missing it."""
    from sqlalchemy import inspect, text

    with engine.begin() as conn:
        inspector = inspect(conn)
        if "contact_messages" in inspector.get_table_names():
            return
        conn.execute(
            text(
                """
                CREATE TABLE contact_messages (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    email VARCHAR NOT NULL,
                    subject VARCHAR NOT NULL,
                    message TEXT NOT NULL,
                    is_read BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
        )


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
        if "design" not in existing:
            conn.execute(text("ALTER TABLE posts ADD COLUMN design VARCHAR"))
