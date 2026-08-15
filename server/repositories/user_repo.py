from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..models import User
from .base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User entity."""

    def __init__(self, db: Session):
        super().__init__(db, User)

    def get_by_username(self, username: str) -> User | None:
        """Get user by login email (username column) or email column."""
        ident = (username or "").strip()
        if not ident:
            return None
        ident_l = ident.lower()
        return (
            self.db.execute(
                select(User).where(
                    or_(
                        func.lower(User.username) == ident_l,
                        func.lower(func.coalesce(User.email, "")) == ident_l,
                    )
                )
            )
            .scalar_one_or_none()
        )

    def build_author_lookup(self) -> dict[str, User]:
        """Build a lookup dictionary for authors by email/username/display_name."""
        users = self.db.execute(select(User).order_by(User.id.asc())).scalars().all()
        lookup: dict[str, User] = {}
        for u in users:
            for raw in (u.username, u.email, u.display_name):
                key = (raw or "").strip().lower()
                if key and key not in lookup:
                    lookup[key] = u

        return lookup

    def list_ordered(self) -> list[User]:
        """List all users ordered by ID."""
        return (
            self.db.execute(select(User).order_by(User.id.asc()))
            .scalars()
            .all()
        )
