from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Post
from repositories.base import BaseRepository


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

    def list_published(self) -> list[Post]:
        """List all posts ordered by published date."""
        return (
            self.db.execute(
                select(Post).order_by(Post.published_at.desc().nullslast())
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
        from sqlalchemy import func
        query = select(func.count(Post.id))
        if creator:
            query = query.where(Post.creator == creator)
        return self.db.execute(query).scalar() or 0
