from __future__ import annotations

from datetime import datetime

from sqlalchemy import func, literal, select
from sqlalchemy.orm import Session

from ..models import Post
from .base import BaseRepository


class PostRepository(BaseRepository[Post]):
    """Repository for Post entity."""

    def __init__(self, db: Session):
        super().__init__(db, Post)

    def get_by_creator(self, creator: str) -> list[Post]:
        """Get posts by creator username."""
        return (
            self.db.execute(
                select(Post)
                .where(Post.creator == creator)
                .order_by(Post.published_at.desc().nullslast())
            )
            .scalars()
            .all()
        )

    def list_published(self, *, public_only: bool = False, hide_bot: bool = False) -> list[Post]:
        """List posts ordered by published date.

        When public_only=True, excludes is_hidden posts.
        When hide_bot=True, also excludes is_bot posts.
        """
        query = select(Post)
        if public_only:
            # Treat missing columns gracefully via coalesce-style filters
            query = query.where(Post.is_hidden.is_(False))
            if hide_bot:
                query = query.where(Post.is_bot.is_(False))
        return (
            self.db.execute(
                query.order_by(Post.published_at.desc().nullslast())
            )
            .scalars()
            .all()
        )

    def list_all_ordered(self) -> list[Post]:
        """List all posts ordered by published date and ID."""
        return (
            self.db.execute(
                select(Post).order_by(
                    Post.published_at.desc().nullslast(), Post.id.desc()
                )
            )
            .scalars()
            .all()
        )

    def list_paginated(self, offset: int = 0, limit: int = 20, creator: str | None = None) -> list[Post]:
        """List posts with pagination."""
        query = select(Post).order_by(
            Post.published_at.desc().nullslast(), Post.id.desc()
        )
        if creator:
            query = query.where(Post.creator == creator)
        
        return (
            self.db.execute(query.offset(offset).limit(limit))
            .scalars()
            .all()
        )

    def count(self, creator: str | None = None) -> int:
        """Get total count of posts."""
        query = select(func.count(Post.id))
        if creator:
            query = query.where(Post.creator == creator)
        return self.db.execute(query).scalar() or 0

    def count_by_creator(self, creator: str | None = None) -> list[tuple[str, int]]:
        """Get post counts grouped by creator username.

        Normalizes missing/blank creators to "Unknown".
        """

        creator_key = func.coalesce(
            func.nullif(func.trim(Post.creator), ""),
            literal("Unknown"),
        )

        query = (
            select(
                creator_key.label("username"),
                func.count(Post.id).label("count"),
            )
            .group_by(creator_key)
            .order_by(func.count(Post.id).desc())
        )

        if creator:
            query = query.where(Post.creator == creator)

        rows = self.db.execute(query).all()
        return [(str(r.username), int(r.count)) for r in rows]

    def count_published_since(self, since: datetime, creator: str | None = None) -> int:
        """Count published posts since a given datetime (inclusive)."""
        stmt = select(func.count(Post.id)).where(Post.published_at.is_not(None)).where(
            Post.published_at >= since
        )
        if creator:
            stmt = stmt.where(Post.creator == creator)
        return int(self.db.execute(stmt).scalar() or 0)

    def count_published_between(
        self, start: datetime, end: datetime, creator: str | None = None
    ) -> int:
        """Count published posts in [start, end)."""
        stmt = (
            select(func.count(Post.id))
            .where(Post.published_at.is_not(None))
            .where(Post.published_at >= start)
            .where(Post.published_at < end)
        )
        if creator:
            stmt = stmt.where(Post.creator == creator)
        return int(self.db.execute(stmt).scalar() or 0)

    def count_published_by_month(
        self,
        since: datetime,
        until: datetime | None = None,
        creator: str | None = None,
    ) -> list[tuple[str, int]]:
        """Count published posts grouped by month.

        Returns a list of (YYYY-MM, count).
        """

        month_key = func.to_char(func.date_trunc("month", Post.published_at), "YYYY-MM")
        stmt = (
            select(
                month_key.label("key"),
                func.count(Post.id).label("count"),
            )
            .where(Post.published_at.is_not(None))
            .where(Post.published_at >= since)
        )
        if until is not None:
            stmt = stmt.where(Post.published_at < until)
        if creator:
            stmt = stmt.where(Post.creator == creator)
        stmt = stmt.group_by(month_key).order_by(month_key.asc())

        rows = self.db.execute(stmt).all()
        out: list[tuple[str, int]] = []
        for r in rows:
            key = str(getattr(r, "key", "") or "").strip()
            if not key:
                continue
            out.append((key, int(getattr(r, "count", 0) or 0)))
        return out
