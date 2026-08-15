from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import ContactMessage
from .base import BaseRepository


class ContactRepository(BaseRepository[ContactMessage]):
    def __init__(self, db: Session):
        super().__init__(db, ContactMessage)

    def list_newest(self) -> list[ContactMessage]:
        stmt = select(ContactMessage).order_by(
            ContactMessage.created_at.desc(), ContactMessage.id.desc()
        )
        return list(self.db.execute(stmt).scalars().all())

    def unread_count(self) -> int:
        count = self.db.execute(
            select(func.count(ContactMessage.id)).where(ContactMessage.is_read.is_(False))
        ).scalar_one()
        return int(count or 0)
