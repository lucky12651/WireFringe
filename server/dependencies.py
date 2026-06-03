from __future__ import annotations

from typing import Generator

from fastapi import Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .auth import decode_access_token
from .db import SessionLocal
from .models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/login", auto_error=False)


def get_db() -> Generator[Session, None, None]:
    """Dependency to get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    request: Request, 
    db: Session = Depends(get_db), 
    token: str | None = Depends(oauth2_scheme)
) -> User:
    """Get the currently authenticated user from JWT or session."""
    user = get_optional_user(request, db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def get_optional_user(
    request: Request,
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme)
) -> User | None:
    """Get the user if authenticated, otherwise return None."""
    user_id = None
    
    # 1. Try JWT token
    # Handle the case where token might be a Depends object if called manually
    actual_token = token if isinstance(token, str) else None
    
    # If called manually without token, try to extract from headers
    if not actual_token and "authorization" in request.headers:
        auth_header = request.headers["authorization"]
        if auth_header.startswith("Bearer "):
            actual_token = auth_header[7:]

    if actual_token:
        payload = decode_access_token(actual_token)
        if payload:
            user_id = payload.get("sub")
    
    # 2. Fallback to session
    if not user_id:
        user_id = request.session.get("user_id")
        
    if not user_id:
        return None
        
    user = db.get(User, int(user_id))
    if user is None:
        if request.session:
            request.session.clear()
        return None
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
