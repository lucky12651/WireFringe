from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import User
from .base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User entity."""

    def __init__(self, db: Session):
        super().__init__(db, User)

    def get_by_username(self, username: str) -> User | None:
        """Get user by username."""
        return (
            self.db.execute(select(User).where(User.username == username))
            .scalar_one_or_none()
        )

    def build_author_lookup(self) -> dict[str, User]:
        """Build a lookup dictionary for authors by username/display_name."""
        users = self.db.execute(select(User).order_by(User.id.asc())).scalars().all()
        lookup: dict[str, User] = {}
        for u in users:
            username_key = (u.username or "").strip().lower()
            if username_key:
                lookup[username_key] = u

            display_key = (u.display_name or "").strip().lower()
            if display_key and display_key not in lookup:
                lookup[display_key] = u

        return lookup

    def list_ordered(self) -> list[User]:
        """List all users ordered by ID."""
        return (
            self.db.execute(select(User).order_by(User.id.asc()))
            .scalars()
            .all()
        )
