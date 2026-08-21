from __future__ import annotations

import logging

from sqlalchemy import inspect, text

from .db import engine

logger = logging.getLogger(__name__)

POST_COLUMNS = {
    "status": "VARCHAR NOT NULL DEFAULT 'draft'",
    "scheduled_at": "TIMESTAMPTZ",
    "is_breaking": "BOOLEAN NOT NULL DEFAULT FALSE",
    "is_pinned": "BOOLEAN NOT NULL DEFAULT FALSE",
    "is_sponsored": "BOOLEAN NOT NULL DEFAULT FALSE",
    "correction": "TEXT",
    "corrected_at": "TIMESTAMPTZ",
    "updated_at": "TIMESTAMPTZ",
    "source_url": "VARCHAR",
    "source_name": "VARCHAR",
    "tags": "TEXT",
    "related_ids": "TEXT",
    "view_count": "INTEGER NOT NULL DEFAULT 0",
    "extra_categories": "TEXT",
    "featured_in": "TEXT",
    "design": "VARCHAR",
    "bot_user_id": "INTEGER REFERENCES users(id)",
}

USER_COLUMNS = {
    "bio": "TEXT",
    "email_verified": "BOOLEAN NOT NULL DEFAULT FALSE",
    "notify_replies": "BOOLEAN NOT NULL DEFAULT TRUE",
    "notify_editorial": "BOOLEAN NOT NULL DEFAULT TRUE",
    "totp_secret": "VARCHAR",
    "totp_enabled": "BOOLEAN NOT NULL DEFAULT FALSE",
    "can_run_bot": "BOOLEAN NOT NULL DEFAULT FALSE",
}

CREATE_TABLES = [
    """
    CREATE TABLE IF NOT EXISTS post_revisions (
        id SERIAL PRIMARY KEY,
        post_id VARCHAR NOT NULL REFERENCES posts(id),
        editor_name VARCHAR,
        editor_user_id INTEGER REFERENCES users(id),
        title VARCHAR NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        excerpt TEXT NOT NULL DEFAULT '',
        status VARCHAR,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR NOT NULL UNIQUE,
        source VARCHAR,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS newsletter_issues (
        id SERIAL PRIMARY KEY,
        subject VARCHAR NOT NULL,
        body TEXT NOT NULL DEFAULT '',
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS tip_messages (
        id SERIAL PRIMARY KEY,
        contact VARCHAR,
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS user_follows (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        kind VARCHAR NOT NULL,
        target VARCHAR NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_user_follows_target UNIQUE (user_id, kind, target)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS url_redirects (
        id SERIAL PRIMARY KEY,
        from_path VARCHAR NOT NULL UNIQUE,
        to_path VARCHAR NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS auth_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        purpose VARCHAR NOT NULL,
        token VARCHAR NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS media_assets (
        id VARCHAR PRIMARY KEY,
        content_type VARCHAR NOT NULL DEFAULT 'image/jpeg',
        data BYTEA NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    """,
]


def apply_newsroom_schema() -> None:
    """Add newsroom columns/tables and backfill post status."""
    with engine.begin() as conn:
        inspector = inspect(conn)
        tables = set(inspector.get_table_names())

        if "posts" in tables:
            existing = {c["name"] for c in inspector.get_columns("posts")}
            for name, ddl in POST_COLUMNS.items():
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE posts ADD COLUMN {name} {ddl}"))
            conn.execute(
                text(
                    """
                    UPDATE posts
                    SET status = CASE
                        WHEN is_hidden IS TRUE THEN 'unpublished'
                        WHEN published_at IS NOT NULL THEN 'published'
                        ELSE 'draft'
                    END
                    WHERE status IS NULL OR status = 'draft'
                      AND (published_at IS NOT NULL OR is_hidden IS TRUE)
                    """
                )
            )
            conn.execute(
                text(
                    """
                    UPDATE posts
                    SET status = 'published'
                    WHERE published_at IS NOT NULL
                      AND COALESCE(is_hidden, FALSE) = FALSE
                      AND status = 'draft'
                    """
                )
            )
            # Hide-all used to flip status to unpublished, then unhide only
            # cleared is_hidden. Public feeds require status=published, so
            # those posts stayed invisible while admin stats said "visible".
            # Legitimate editor unpublish always keeps is_hidden=true.
            conn.execute(
                text(
                    """
                    UPDATE posts
                    SET status = 'published'
                    WHERE COALESCE(is_bot, FALSE) = TRUE
                      AND published_at IS NOT NULL
                      AND COALESCE(is_hidden, FALSE) = FALSE
                      AND lower(status) = 'unpublished'
                    """
                )
            )

        if "users" in tables:
            existing = {c["name"] for c in inspector.get_columns("users")}
            for name, ddl in USER_COLUMNS.items():
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {name} {ddl}"))

        for stmt in CREATE_TABLES:
            conn.execute(text(stmt))

        if "news_queue" in tables:
            qcols = {c["name"] for c in inspector.get_columns("news_queue")}
            if "dest_section" not in qcols:
                conn.execute(text("ALTER TABLE news_queue ADD COLUMN dest_section VARCHAR"))
            if "user_id" not in qcols:
                conn.execute(text("ALTER TABLE news_queue ADD COLUMN user_id INTEGER REFERENCES users(id)"))
            conn.execute(text("ALTER TABLE news_queue DROP CONSTRAINT IF EXISTS news_queue_link_key"))
            conn.execute(text("DROP INDEX IF EXISTS news_queue_link_key"))
            conn.execute(
                text(
                    """
                    CREATE UNIQUE INDEX IF NOT EXISTS uq_news_queue_user_link
                    ON news_queue ((COALESCE(user_id, 0)), link)
                    """
                )
            )

        if "recent_news_cache" in tables:
            ccols = {c["name"] for c in inspector.get_columns("recent_news_cache")}
            if "user_id" not in ccols:
                conn.execute(text("ALTER TABLE recent_news_cache ADD COLUMN user_id INTEGER REFERENCES users(id)"))
            conn.execute(text("ALTER TABLE recent_news_cache DROP CONSTRAINT IF EXISTS recent_news_cache_link_key"))
            conn.execute(text("DROP INDEX IF EXISTS recent_news_cache_link_key"))
            conn.execute(
                text(
                    """
                    CREATE UNIQUE INDEX IF NOT EXISTS uq_recent_news_cache_user_link
                    ON recent_news_cache ((COALESCE(user_id, 0)), link)
                    """
                )
            )

        if "bot_logs" in tables:
            lcols = {c["name"] for c in inspector.get_columns("bot_logs")}
            if "user_id" not in lcols:
                conn.execute(text("ALTER TABLE bot_logs ADD COLUMN user_id INTEGER REFERENCES users(id)"))

        owner_id = conn.execute(
            text(
                """
                SELECT id FROM users
                WHERE lower(role) = 'admin'
                ORDER BY id ASC
                LIMIT 1
                """
            )
        ).scalar()
        if owner_id is not None:
            conn.execute(text("UPDATE news_queue SET user_id = :uid WHERE user_id IS NULL"), {"uid": owner_id})
            conn.execute(
                text("UPDATE recent_news_cache SET user_id = :uid WHERE user_id IS NULL"),
                {"uid": owner_id},
            )
            conn.execute(text("UPDATE bot_logs SET user_id = :uid WHERE user_id IS NULL"), {"uid": owner_id})
            conn.execute(
                text(
                    """
                    UPDATE posts
                    SET bot_user_id = :uid
                    WHERE bot_user_id IS NULL
                      AND COALESCE(is_bot, FALSE) = TRUE
                    """
                ),
                {"uid": owner_id},
            )

    logger.info("Newsroom schema applied.")
