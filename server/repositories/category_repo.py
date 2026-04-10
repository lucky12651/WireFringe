from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from models import Category, Post
from repositories.base import BaseRepository


class CategoryRepository(BaseRepository[Category]):
    """Repository for Category entity."""

    def __init__(self, db: Session):
        super().__init__(db, Category)

    def get_by_name(self, name: str) -> Category | None:
        """Get category by name."""
        return (
            self.db.execute(select(Category).where(Category.name == name))
            .scalar_one_or_none()
        )

    def list_ordered(self) -> list[Category]:
        """List all categories ordered by name."""
        return (
            self.db.execute(select(Category).order_by(Category.name.asc()))
            .scalars()
            .all()
        )

    def get_post_counts(self) -> dict[str, int]:
        """Get post counts per bucket/category."""
        counts = self.db.execute(
            select(Post.bucket, func.count(Post.id)).group_by(Post.bucket)
        ).all()
        return {bucket: int(cnt or 0) for bucket, cnt in counts if bucket}

    def exists(self) -> bool:
        """Check if any categories exist."""
        return (
            self.db.execute(select(Category)).scalars().first() is not None
        )
