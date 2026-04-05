from __future__ import annotations

import base64
import hashlib
import hmac
import os
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import User


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


def authenticate(db: Session, username: str, password: str) -> AuthUser | None:
    user = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
    if user is None:
        return None
    if not verify_password(password, user.password_hash, user.password_salt):
        return None
    return AuthUser(id=user.id, username=user.username, role=user.role)
