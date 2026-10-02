from __future__ import annotations

import re

from fastapi import HTTPException

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

LOGIN_EMAIL_MAP = {
    "wirefringe": "team@wirefringe.com",
    "rishabh81": "rishabh81@gmail.com",
}


def is_email(value: str | None) -> bool:
    text = (value or "").strip()
    return bool(text) and EMAIL_RE.match(text) is not None


def normalize_login_email(value: str | None, *, required: bool = True) -> str:
    email = (value or "").strip().lower()
    if not email:
        if required:
            raise HTTPException(status_code=400, detail="Email is required")
        return ""
    if not is_email(email):
        raise HTTPException(status_code=400, detail="Enter a valid email address")
    if len(email) > 254:
        raise HTTPException(status_code=400, detail="Email too long")
    return email


def first_login_value(*values: str | None) -> str:
    for value in values:
        text = (value or "").strip()
        if text:
            return text
    return ""
