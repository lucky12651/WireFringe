from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, Float
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

    # SEO Fields
    meta_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    keywords: Mapped[str | None] = mapped_column(Text, nullable=True)  # Comma-separated

    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Bot-generated posts + visibility controls
    is_bot: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String, nullable=False, unique=True)

    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    password_salt: Mapped[str] = mapped_column(String, nullable=False)

    # Roles: "admin", "editor", or "author"
    role: Mapped[str] = mapped_column(String, nullable=False, default="editor")

    # Public-facing profile fields
    display_name: Mapped[str | None] = mapped_column(String, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)

    # Post byline brand treatment (does NOT change site-wide header/footer logo)
    # When enabled, public posts show brand_logo_url instead of the username text.
    brand_byline_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    brand_logo_url: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    post_id: Mapped[str] = mapped_column(String, ForeignKey("posts.id"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)

    likes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    dislikes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Moderation: pending comments are not shown publicly until approved.
    approved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class CommentVote(Base):
    __tablename__ = "comment_votes"
    __table_args__ = (
        UniqueConstraint("comment_id", "visitor_id", name="uq_comment_votes_comment_visitor"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    comment_id: Mapped[int] = mapped_column(Integer, ForeignKey("comments.id"), nullable=False, index=True)
    visitor_id: Mapped[str] = mapped_column(String, nullable=False, index=True)

    # "like" or "dislike"
    direction: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class NewsQueue(Base):
    __tablename__ = "news_queue"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    link: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    category: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class UserInteraction(Base):
    __tablename__ = "user_interactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    post_id: Mapped[str] = mapped_column(String, ForeignKey("posts.id"), nullable=False, index=True)
    
    # "view", "like", "share", etc.
    interaction_type: Mapped[str] = mapped_column(String, nullable=False, default="view")
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class PersonalizedFeed(Base):
    __tablename__ = "personalized_feeds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    post_id: Mapped[str] = mapped_column(String, ForeignKey("posts.id"), nullable=False, index=True)
    
    score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_user_post_recommendation"),
    )

class RecentNewsCache(Base):
    __tablename__ = "recent_news_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String, nullable=False, index=True)
    link: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
 
class BotLog(Base):
    __tablename__ = "bot_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    level: Mapped[str] = mapped_column(String, nullable=False, default="INFO")
    message: Mapped[str] = mapped_column(Text, nullable=False)
    module: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class AppSetting(Base):
    """Key/value app settings (AdSense, news bot, etc.)."""

    __tablename__ = "app_settings"

    key: Mapped[str] = mapped_column(String, primary_key=True)
    value: Mapped[str] = mapped_column(Text, nullable=False, default="")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
