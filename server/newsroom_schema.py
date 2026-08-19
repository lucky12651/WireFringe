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
}

USER_COLUMNS = {
    "bio": "TEXT",
    "email_verified": "BOOLEAN NOT NULL DEFAULT FALSE",
    "notify_replies": "BOOLEAN NOT NULL DEFAULT TRUE",
    "notify_editorial": "BOOLEAN NOT NULL DEFAULT TRUE",
    "totp_secret": "VARCHAR",
    "totp_enabled": "BOOLEAN NOT NULL DEFAULT FALSE",
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

    logger.info("Newsroom schema applied.")
