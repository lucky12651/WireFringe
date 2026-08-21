from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import secrets
import struct
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

from fastapi import HTTPException
from sqlalchemy import delete, desc, func, or_, select
from sqlalchemy.orm import Session

from ..auth import find_user_by_login, hash_password
from ..identity import normalize_login_email
from ..models import (
    AuthToken,
    NewsletterIssue,
    NewsletterSubscriber,
    Post,
    TipMessage,
    UrlRedirect,
    User,
    UserFollow,
)
from ..schemas import (
    FollowOut,
    NewsletterIssueOut,
    NewsletterSubOut,
    RedirectOut,
    TipOut,
)
from .settings_service import SettingsService

logger = logging.getLogger(__name__)

FRONTPAGE_KEY = "frontpage"
MASTHEAD_KEY = "masthead"

SECTIONS = {
    "tech": ["Tech", "Gadgets"],
    "ai": ["AI & Future Tech"],
    "business": ["Business & Markets"],
    "finance": ["Personal Finance"],
    "india": ["India News"],
    "sports": ["Sports"],
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _norm_path(path: str) -> str:
    p = (path or "").strip()
    if not p.startswith("/"):
        p = "/" + p
    return p.rstrip() or "/"


class NewsroomService:
    def __init__(self, db: Session):
        self.db = db

    def get_frontpage(self) -> dict:
        raw = SettingsService(self.db)._get_raw(FRONTPAGE_KEY)
        if not raw:
            return {"heroIds": [], "topIds": [], "breakingId": None}
        try:
            data = json.loads(raw)
        except Exception:
            data = {}
        return {
            "heroIds": list(data.get("heroIds") or []),
            "topIds": list(data.get("topIds") or []),
            "breakingId": data.get("breakingId") or None,
        }

    def save_frontpage(self, payload) -> dict:
        data = {
            "heroIds": [str(x) for x in (payload.heroIds or [])][:12],
            "topIds": [str(x) for x in (payload.topIds or [])][:20],
            "breakingId": payload.breakingId or None,
        }
        SettingsService(self.db)._set_raw(FRONTPAGE_KEY, json.dumps(data))
        self.db.commit()
        return data

    def get_masthead(self) -> dict:
        raw = SettingsService(self.db)._get_raw(MASTHEAD_KEY)
        if not raw:
            return {
                "heading": "Masthead",
                "body": "Wirefringe is an independent digital newsroom.",
                "staff": [],
            }
        try:
            return json.loads(raw)
        except Exception:
            return {"heading": "Masthead", "body": raw, "staff": []}

    def save_masthead(self, payload) -> dict:
        data = {
            "heading": (payload.heading or "Masthead").strip(),
            "body": (payload.body or "").strip(),
            "staff": payload.staff or [],
        }
        SettingsService(self.db)._set_raw(MASTHEAD_KEY, json.dumps(data))
        self.db.commit()
        return data

    def subscribe(self, email: str, source: str | None = None) -> NewsletterSubOut:
        addr = normalize_login_email(str(email))
        row = self.db.execute(
            select(NewsletterSubscriber).where(func.lower(NewsletterSubscriber.email) == addr)
        ).scalar_one_or_none()
        if row is None:
            row = NewsletterSubscriber(email=addr, source=source or "site", is_active=True)
            self.db.add(row)
        else:
            row.is_active = True
            if source:
                row.source = source
        self.db.commit()
        self.db.refresh(row)
        return NewsletterSubOut(
            id=row.id, email=row.email, source=row.source, isActive=row.is_active, createdAt=row.created_at
        )

    def list_subscribers(self) -> list[NewsletterSubOut]:
        rows = self.db.execute(
            select(NewsletterSubscriber).order_by(NewsletterSubscriber.created_at.desc())
        ).scalars().all()
        return [
            NewsletterSubOut(
                id=r.id, email=r.email, source=r.source, isActive=r.is_active, createdAt=r.created_at
            )
            for r in rows
        ]

    def create_issue(self, subject: str, body: str) -> NewsletterIssueOut:
        row = NewsletterIssue(subject=subject.strip(), body=body.strip(), sent_at=_now())
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return NewsletterIssueOut(
            id=row.id, subject=row.subject, body=row.body, sentAt=row.sent_at, createdAt=row.created_at
        )

    def list_issues(self) -> list[NewsletterIssueOut]:
        rows = self.db.execute(
            select(NewsletterIssue).order_by(NewsletterIssue.created_at.desc())
        ).scalars().all()
        return [
            NewsletterIssueOut(
                id=r.id, subject=r.subject, body=r.body, sentAt=r.sent_at, createdAt=r.created_at
            )
            for r in rows
        ]

    def create_tip(self, contact: str | None, message: str) -> TipOut:
        row = TipMessage(contact=(contact or "").strip() or None, message=message.strip())
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return TipOut(
            id=row.id, contact=row.contact, message=row.message, isRead=row.is_read, createdAt=row.created_at
        )

    def list_tips(self) -> list[TipOut]:
        rows = self.db.execute(select(TipMessage).order_by(TipMessage.created_at.desc())).scalars().all()
        return [
            TipOut(id=r.id, contact=r.contact, message=r.message, isRead=r.is_read, createdAt=r.created_at)
            for r in rows
        ]

    def mark_tip_read(self, tip_id: int) -> TipOut:
        row = self.db.get(TipMessage, tip_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Tip not found")
        row.is_read = True
        self.db.commit()
        return TipOut(id=row.id, contact=row.contact, message=row.message, isRead=True, createdAt=row.created_at)

    def delete_tip(self, tip_id: int) -> None:
        row = self.db.get(TipMessage, tip_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Tip not found")
        self.db.delete(row)
        self.db.commit()

    def unread_tips(self) -> int:
        return int(
            self.db.execute(select(func.count(TipMessage.id)).where(TipMessage.is_read.is_(False))).scalar()
            or 0
        )

    def follow(self, user_id: int, kind: str, target: str) -> FollowOut:
        t = (target or "").strip()
        if kind not in {"topic", "author", "post"} or not t:
            raise HTTPException(status_code=400, detail="Invalid follow")
        existing = self.db.execute(
            select(UserFollow).where(
                UserFollow.user_id == user_id, UserFollow.kind == kind, UserFollow.target == t
            )
        ).scalar_one_or_none()
        if existing is None:
            self.db.add(UserFollow(user_id=user_id, kind=kind, target=t))
            self.db.commit()
        return FollowOut(kind=kind, target=t)

    def unfollow(self, user_id: int, kind: str, target: str) -> None:
        self.db.execute(
            delete(UserFollow).where(
                UserFollow.user_id == user_id, UserFollow.kind == kind, UserFollow.target == (target or "").strip()
            )
        )
        self.db.commit()

    def list_follows(self, user_id: int) -> list[FollowOut]:
        rows = self.db.execute(select(UserFollow).where(UserFollow.user_id == user_id)).scalars().all()
        return [FollowOut(kind=r.kind, target=r.target) for r in rows]

    def list_redirects(self) -> list[RedirectOut]:
        rows = self.db.execute(select(UrlRedirect).order_by(UrlRedirect.created_at.desc())).scalars().all()
        return [RedirectOut(id=r.id, fromPath=r.from_path, toPath=r.to_path, createdAt=r.created_at) for r in rows]

    def add_redirect(self, from_path: str, to_path: str) -> RedirectOut:
        src = _norm_path(from_path)
        dest = _norm_path(to_path)
        row = self.db.execute(select(UrlRedirect).where(UrlRedirect.from_path == src)).scalar_one_or_none()
        if row is None:
            row = UrlRedirect(from_path=src, to_path=dest)
            self.db.add(row)
        else:
            row.to_path = dest
        self.db.commit()
        self.db.refresh(row)
        return RedirectOut(id=row.id, fromPath=row.from_path, toPath=row.to_path, createdAt=row.created_at)

    def delete_redirect(self, redirect_id: int) -> None:
        row = self.db.get(UrlRedirect, redirect_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Redirect not found")
        self.db.delete(row)
        self.db.commit()

    def lookup_redirect(self, path: str) -> str | None:
        row = self.db.execute(
            select(UrlRedirect).where(UrlRedirect.from_path == _norm_path(path))
        ).scalar_one_or_none()
        return row.to_path if row else None

    def analytics(self) -> dict:
        total_views = int(self.db.execute(select(func.coalesce(func.sum(Post.view_count), 0))).scalar() or 0)
        by_section = self.db.execute(
            select(Post.bucket, func.count(Post.id), func.coalesce(func.sum(Post.view_count), 0))
            .where(Post.status == "published")
            .group_by(Post.bucket)
        ).all()
        top = self.db.execute(
            select(Post.id, Post.title, Post.bucket, Post.view_count)
            .where(Post.status == "published")
            .order_by(desc(Post.view_count), desc(Post.published_at))
            .limit(12)
        ).all()
        return {
            "totalViews": total_views,
            "bySection": [
                {"bucket": b or "Unknown", "posts": int(c or 0), "views": int(v or 0)} for b, c, v in by_section
            ],
            "topStories": [
                {"id": i, "title": t, "bucket": b, "views": int(v or 0)} for i, t, b, v in top
            ],
        }

    def issue_token(self, user_id: int, purpose: str, hours: int = 24, minutes: int | None = None) -> str:
        token = secrets.token_urlsafe(32)
        delta = timedelta(minutes=minutes) if minutes is not None else timedelta(hours=hours)
        self.db.add(
            AuthToken(
                user_id=user_id,
                purpose=purpose,
                token=token,
                expires_at=_now() + delta,
            )
        )
        self.db.commit()
        return token

    def get_valid_token_user(self, token: str, purpose: str) -> tuple[AuthToken, User]:
        row = self.db.execute(
            select(AuthToken).where(AuthToken.token == token, AuthToken.purpose == purpose)
        ).scalar_one_or_none()
        if row is None or row.used_at is not None:
            raise HTTPException(status_code=400, detail="Invalid or expired authenticator session")
        exp = row.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < _now():
            raise HTTPException(status_code=400, detail="Authenticator session expired. Sign in again.")
        user = self.db.get(User, row.user_id)
        if user is None:
            raise HTTPException(status_code=400, detail="Account not found")
        return row, user

    def consume_token(self, token: str, purpose: str) -> User:
        row = self.db.execute(
            select(AuthToken).where(AuthToken.token == token, AuthToken.purpose == purpose)
        ).scalar_one_or_none()
        if row is None or row.used_at is not None:
            raise HTTPException(status_code=400, detail="Invalid or used link")
        exp = row.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < _now():
            raise HTTPException(status_code=400, detail="Link expired")
        user = self.db.get(User, row.user_id)
        if user is None:
            raise HTTPException(status_code=400, detail="Account not found")
        row.used_at = _now()
        self.db.commit()
        return user

    def forgot_password(self, email: str) -> dict:
        user = find_user_by_login(self.db, email)
        # Always succeed so we don't leak accounts.
        if user is None:
            return {"ok": True}
        token = self.issue_token(user.id, "reset", hours=2)
        base = os.environ.get("PUBLIC_SITE_URL") or os.environ.get("NEXT_PUBLIC_SITE_URL") or "http://127.0.0.1:3000"
        url = f"{base.rstrip('/')}/reset-password?token={quote(token)}"
        logger.info("Password reset link for %s: %s", email, url)
        out = {"ok": True}
        if not os.environ.get("SMTP_HOST"):
            out["resetUrl"] = url
        return out

    def reset_password(self, token: str, new_password: str) -> None:
        user = self.consume_token(token, "reset")
        digest, salt = hash_password(new_password)
        user.password_hash = digest
        user.password_salt = salt
        self.db.commit()

    def request_verify(self, user: User) -> dict:
        token = self.issue_token(user.id, "verify", hours=48)
        base = os.environ.get("PUBLIC_SITE_URL") or os.environ.get("NEXT_PUBLIC_SITE_URL") or "http://127.0.0.1:3000"
        url = f"{base.rstrip('/')}/verify-email?token={quote(token)}"
        logger.info("Verify email link for %s: %s", user.email or user.username, url)
        return {"ok": True, "verifyUrl": url}

    def verify_email(self, token: str) -> None:
        user = self.consume_token(token, "verify")
        user.email_verified = True
        self.db.commit()

    def totp_setup(self, user: User) -> dict:
        secret = _b32_secret()
        user.totp_secret = secret
        user.totp_enabled = False
        self.db.commit()
        label = quote(user.email or user.username or "wirefringe")
        uri = f"otpauth://totp/Wirefringe:{label}?secret={secret}&issuer=Wirefringe"
        return {"secret": secret, "otpauth": uri}

    def totp_confirm(self, user: User, code: str) -> None:
        if not user.totp_secret or not _verify_totp(user.totp_secret, code):
            raise HTTPException(status_code=400, detail="Invalid authenticator code")
        user.totp_enabled = True
        self.db.commit()

    def totp_disable(self, user: User) -> None:
        user.totp_enabled = False
        user.totp_secret = None
        self.db.commit()


def _b32_secret() -> str:
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    raw = secrets.token_bytes(20)
    bits = int.from_bytes(raw, "big")
    out = []
    for _ in range(32):
        out.append(alphabet[bits & 31])
        bits >>= 5
    return "".join(reversed(out))


def _verify_totp(secret: str, code: str, window: int = 1) -> bool:
    code = (code or "").strip().replace(" ", "")
    if not code.isdigit() or len(code) not in {6, 8}:
        return False
    key = _b32_decode(secret)
    timestep = int(time.time() // 30)
    for offset in range(-window, window + 1):
        msg = struct.pack(">Q", timestep + offset)
        digest = hmac.new(key, msg, hashlib.sha1).digest()
        offset_b = digest[-1] & 0x0F
        num = struct.unpack(">I", digest[offset_b : offset_b + 4])[0] & 0x7FFFFFFF
        token = f"{num % (10 ** 6):06d}"
        if hmac.compare_digest(token, code.zfill(6)):
            return True
    return False


def _b32_decode(data: str) -> bytes:
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    s = (data or "").upper().replace("=", "")
    bits = 0
    acc = 0
    out = bytearray()
    for ch in s:
        acc = (acc << 5) | alphabet.index(ch)
        bits += 5
        if bits >= 8:
            bits -= 8
            out.append((acc >> bits) & 0xFF)
    return bytes(out)
