"""Per-account News Bot context (settings, logs, queue)."""

from __future__ import annotations

from contextlib import contextmanager
from contextvars import ContextVar

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

current_bot_user_id: ContextVar[int | None] = ContextVar("current_bot_user_id", default=None)


@contextmanager
def bot_user_scope(user_id: int | None):
    token = current_bot_user_id.set(int(user_id) if user_id is not None else None)
    try:
        yield
    finally:
        current_bot_user_id.reset(token)


def bot_byline(user) -> str:
    name = (getattr(user, "display_name", None) or getattr(user, "username", None) or "").strip()
    return name or "Wirefringe"


def bot_operator_users(db: Session) -> list:
    from .models import User

    return list(
        db.execute(
            select(User)
            .where(or_(func.lower(User.role) == "admin", User.can_run_bot.is_(True)))
            .order_by(User.id.asc())
        ).scalars()
    )


def bot_settings_key(user_id: int) -> str:
    return f"bot:{int(user_id)}"
