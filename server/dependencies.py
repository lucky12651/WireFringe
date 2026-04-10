from __future__ import annotations

from typing import Generator

from fastapi import HTTPException, Request
from sqlalchemy.orm import Session

from db import SessionLocal
from models import User


def get_db() -> Generator[Session, None, None]:
    """Dependency to get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(request: Request, db: Session) -> User:
    """Get the currently authenticated user from session."""
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = db.get(User, int(user_id))
    if user is None:
        request.session.clear()
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def require_user(request: Request, db: Session) -> User:
    """Require authentication - alias for get_current_user."""
    return get_current_user(request, db)


def require_admin(user: User) -> None:
    """Require admin role."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")


def require_staff(user: User) -> None:
    """Require admin or editor role."""
    if user.role not in {"admin", "editor"}:
        raise HTTPException(status_code=403, detail="Admin/editor required")


def get_existing_visitor_id(request: Request) -> str | None:
    """Get existing visitor ID from session if present."""
    raw = request.session.get("visitor_id")
    if not raw:
        return None
    s = str(raw).strip()
    return s or None
