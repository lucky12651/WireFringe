from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[str] = mapped_column(String, primary_key=True)

    title: Mapped[str] = mapped_column(String, nullable=False)
    link: Mapped[str | None] = mapped_column(String, nullable=True)
    creator: Mapped[str | None] = mapped_column(String, nullable=True)

    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    excerpt: Mapped[str] = mapped_column(Text, nullable=False, default="")

    bucket: Mapped[str] = mapped_column(String, nullable=False, default="Tech")

    read_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    og_img: Mapped[str | None] = mapped_column(String, nullable=True)

    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String, nullable=False, unique=True)

    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    password_salt: Mapped[str] = mapped_column(String, nullable=False)

    # Roles: "admin" or "editor"
    role: Mapped[str] = mapped_column(String, nullable=False, default="editor")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
