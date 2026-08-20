from __future__ import annotations

import base64
import hashlib
import hmac
import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import jwt
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from .config import settings
from .models import User


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    to_encode.update({"exp": expire})
    encoded = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    if isinstance(encoded, bytes):
        return encoded.decode("utf-8")
    return encoded


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except (jwt.PyJWTError, ValueError):
        return None


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _b64decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("ascii"))


def hash_password(password: str, salt_b64: str | None = None) -> tuple[str, str]:
    if salt_b64 is None:
        salt = os.urandom(16)
        salt_b64 = _b64(salt)
    else:
        salt = _b64decode(salt_b64)

    dk = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        200_000,
    )
    return _b64(dk), salt_b64


def verify_password(password: str, password_hash: str, password_salt: str) -> bool:
    candidate_hash, _ = hash_password(password, password_salt)
    return hmac.compare_digest(candidate_hash, password_hash)


@dataclass(frozen=True)
class AuthUser:
    id: int
    username: str
    role: str


def find_user_by_login(db: Session, login: str) -> User | None:
    ident = (login or "").strip()
    if not ident:
        return None
    ident_l = ident.lower()
    return db.execute(
        select(User).where(
            or_(
                func.lower(User.username) == ident_l,
                func.lower(func.coalesce(User.email, "")) == ident_l,
            )
        )
    ).scalar_one_or_none()


def authenticate(db: Session, username: str, password: str) -> AuthUser | None:
    user = find_user_by_login(db, username)
    if user is None:
        return None
    if not verify_password(password, user.password_hash, user.password_salt):
        return None
    return AuthUser(id=user.id, username=user.username, role=user.role)
