from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from ..dependencies import get_db, require_staff, require_user
from ..schemas import ContactCreate, ContactOut, PendingCountOut
from ..services.contact_service import ContactService

router = APIRouter()


def get_contact_service(db: Session = Depends(get_db)) -> ContactService:
    return ContactService(db)


@router.post("/contact", response_model=ContactOut)
def create_contact_message(
    payload: ContactCreate,
    service: ContactService = Depends(get_contact_service),
) -> ContactOut:
    return service.create(payload)


@router.get("/admin/contact", response_model=list[ContactOut])
def admin_list_contact_messages(
    request: Request,
    db: Session = Depends(get_db),
    service: ContactService = Depends(get_contact_service),
) -> list[ContactOut]:
    user = require_user(request, db)
    require_staff(user)
    return service.list_messages()


@router.get("/admin/contact/unread-count", response_model=PendingCountOut)
def admin_contact_unread_count(
    request: Request,
    db: Session = Depends(get_db),
    service: ContactService = Depends(get_contact_service),
) -> PendingCountOut:
    user = require_user(request, db)
    require_staff(user)
    return service.unread_count()


@router.post("/admin/contact/{message_id:int}/read", response_model=ContactOut)
def admin_mark_contact_read(
    message_id: int,
    request: Request,
    db: Session = Depends(get_db),
    service: ContactService = Depends(get_contact_service),
) -> ContactOut:
    user = require_user(request, db)
    require_staff(user)
    return service.mark_read(message_id)


@router.delete("/admin/contact/{message_id:int}")
def admin_delete_contact_message(
    message_id: int,
    request: Request,
    db: Session = Depends(get_db),
    service: ContactService = Depends(get_contact_service),
) -> dict:
    user = require_user(request, db)
    require_staff(user)
    service.delete(message_id)
    return {"ok": True}
