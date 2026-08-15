from __future__ import annotations

import bleach
from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import ContactMessage
from ..repositories.contact_repo import ContactRepository
from ..schemas import CONTACT_SUBJECTS, ContactCreate, ContactOut, PendingCountOut


class ContactService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ContactRepository(db)

    def _to_out(self, row: ContactMessage) -> ContactOut:
        return ContactOut(
            id=row.id,
            name=row.name,
            email=row.email,
            subject=row.subject,
            message=row.message,
            isRead=bool(row.is_read),
            createdAt=row.created_at,
        )

    def create(self, payload: ContactCreate) -> ContactOut:
        name = bleach.clean((payload.name or "").strip(), tags=[], attributes={}, strip=True)
        message = bleach.clean((payload.message or "").strip(), tags=[], attributes={}, strip=True)
        subject = (payload.subject or "").strip()
        email = str(payload.email or "").strip().lower()

        if not name or not email or not message:
            raise HTTPException(status_code=400, detail="Name, email, and message are required")
        if subject not in CONTACT_SUBJECTS:
            subject = "Other"

        row = ContactMessage(
            name=name[:120],
            email=email[:254],
            subject=subject,
            message=message[:5000],
            is_read=False,
        )
        created = self.repo.create(row)
        return self._to_out(created)

    def list_messages(self) -> list[ContactOut]:
        return [self._to_out(row) for row in self.repo.list_newest()]

    def unread_count(self) -> PendingCountOut:
        return PendingCountOut(count=self.repo.unread_count())

    def mark_read(self, message_id: int) -> ContactOut:
        row = self.repo.get(message_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Message not found")
        if not row.is_read:
            row.is_read = True
            self.repo.update(row)
        return self._to_out(row)

    def delete(self, message_id: int) -> None:
        row = self.repo.get(message_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Message not found")
        self.repo.delete(row)
