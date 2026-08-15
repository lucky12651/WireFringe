from __future__ import annotations

from datetime import datetime

from sqlalchemy import func, literal, not_, or_, select
from sqlalchemy.orm import Session

from ..models import Post
from .base import BaseRepository

BOT_CREATOR_KEYS = (
    "wirefringe",
    "wire fringe",
    "news bot engine",
    "newsbot",
    "news bot",
)


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
        When hide_bot=True, also excludes is_bot posts and known bot creators.
        """
        query = select(Post)
        if public_only:
            # Never show explicitly hidden posts
            query = query.where(Post.is_hidden.is_(False))
            if hasattr(Post, "status"):
                query = query.where(Post.status == "published")
            if hide_bot:
                # Exclude flagged bot posts
                query = query.where(Post.is_bot.is_(False))
                # Belt-and-suspenders: exclude known bot author names even if
                # is_bot flag was never set (legacy / missed tags)
                from sqlalchemy import not_, or_

                creator_key = func.lower(func.trim(Post.creator))
                bot_keys = (
                    "wirefringe",
                    "wire fringe",
                    "news bot engine",
                    "newsbot",
                    "news bot",
                )
                query = query.where(
                    or_(
                        Post.creator.is_(None),
                        Post.creator == "",
                        not_(or_(*[creator_key == k for k in bot_keys])),
                    )
                )
        order = [Post.published_at.desc().nullslast()]
        if hasattr(Post, "is_pinned"):
            order = [Post.is_pinned.desc(), Post.is_breaking.desc(), Post.published_at.desc().nullslast()]
        return (
            self.db.execute(query.order_by(*order))
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

    def _apply_source(self, query, source: str | None):
        kind = (source or "editorial").strip().lower()
        if kind in {"all", ""}:
            return query
        creator_key = func.lower(func.trim(Post.creator))
        known_bot = or_(*[creator_key == k for k in BOT_CREATOR_KEYS])
        is_bot_row = or_(Post.is_bot.is_(True), known_bot)
        if kind == "bot":
            return query.where(is_bot_row)
        return query.where(Post.is_bot.is_(False)).where(
            or_(Post.creator.is_(None), Post.creator == "", not_(known_bot))
        )

    def _apply_filters(
        self,
        query,
        *,
        q: str | None = None,
        status: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ):
        text = (q or "").strip()
        if text:
            like = f"%{text}%"
            query = query.where(or_(Post.title.ilike(like), Post.excerpt.ilike(like)))
        kind = (status or "").strip().lower()
        if kind and kind not in {"all", ""}:
            if kind == "hidden":
                # Hide-from-site only (bot hide / taken down). Drafts are also
                # stored as is_hidden, so they must not appear here.
                query = query.where(
                    Post.is_hidden.is_(True),
                    func.lower(Post.status) == "published",
                )
            else:
                query = query.where(func.lower(Post.status) == kind)
        stamp = func.coalesce(Post.published_at, Post.updated_at)
        if date_from is not None:
            query = query.where(stamp >= date_from)
        if date_to is not None:
            query = query.where(stamp < date_to)
        return query

    def list_paginated(
        self,
        offset: int = 0,
        limit: int = 20,
        creator: str | None = None,
        source: str | None = "editorial",
        q: str | None = None,
        status: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> list[Post]:
        """List posts with pagination."""
        query = select(Post).order_by(
            Post.published_at.desc().nullslast(), Post.id.desc()
        )
        if creator:
            query = query.where(Post.creator == creator)
        else:
            query = self._apply_source(query, source)
        query = self._apply_filters(query, q=q, status=status, date_from=date_from, date_to=date_to)

        return (
            self.db.execute(query.offset(offset).limit(limit))
            .scalars()
            .all()
        )

    def count(
        self,
        creator: str | None = None,
        source: str | None = "editorial",
        q: str | None = None,
        status: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> int:
        """Get total count of posts."""
        query = select(func.count(Post.id))
        if creator:
            query = query.where(Post.creator == creator)
        else:
            query = self._apply_source(query, source)
        query = self._apply_filters(query, q=q, status=status, date_from=date_from, date_to=date_to)
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
