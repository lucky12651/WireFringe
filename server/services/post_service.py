from __future__ import annotations

import csv
import os
import re
import unicodedata
import uuid
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models import Post, User, NewsQueue, UserInteraction, PersonalizedFeed
from ..repositories import CommentRepository, PostRepository, UserRepository
from ..schemas import (
    CreatorCountOut,
    MonthCountOut,
    NewsQueueItem,
    PostGrowthCountsOut,
    PostOut,
    PostUpsert,
)
from .settings_service import BOT_CREATOR_KEYS, SettingsService

_ACCENT_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")


def normalize_accent_color(value: str | None) -> str | None:
    """Accept #RRGGBB only. Empty/invalid → None (site default on the frontend)."""
    if value is None:
        return None
    v = str(value).strip()
    if not v:
        return None
    if _ACCENT_RE.fullmatch(v):
        return v.upper()
    return None


class PostService:
    """Service layer for Post operations."""

    def __init__(self, db: Session):
        self.db = db
        self.post_repo = PostRepository(db)
        self.comment_repo = CommentRepository(db)
        self.user_repo = UserRepository(db)

    @staticmethod
    def _slugify_title(title: str) -> str:
        """Convert title to URL-friendly slug."""
        s = str(title or "")
        s = unicodedata.normalize("NFKD", s)
        s = "".join(ch for ch in s if not unicodedata.combining(ch))
        s = s.lower().strip().replace("&", " and ")
        s = re.sub(r"[^a-z0-9]+", "-", s)
        s = re.sub(r"^-+|-+$", "", s)
        s = re.sub(r"-+", "-", s)
        s = s[:90] or "post"
        return s

    def _build_post_out(
        self,
        post: Post,
        author_lookup: dict[str, User] | None = None,
        comment_counts: dict[str, int] | None = None,
    ) -> PostOut:
        """Convert Post model to PostOut schema with author info."""
        if author_lookup is None:
            author_lookup = self.user_repo.build_author_lookup()
        creator_raw = (post.creator or "").strip() or None
        author = None
        if creator_raw:
            key = creator_raw.lower()
            author = author_lookup.get(key)
            # Fuzzy match: ignore spaces/punctuation so "Wirefringe" / "Wire Fringe" resolve
            if author is None:
                compact = re.sub(r"[^a-z0-9]+", "", key)
                for lookup_key, user in author_lookup.items():
                    if re.sub(r"[^a-z0-9]+", "", lookup_key) == compact:
                        author = user
                        break

        brand_byline = False
        brand_logo: str | None = None
        if author is not None:
            creator_name = (author.display_name or author.username).strip() or author.username
            creator_avatar = (author.avatar_url or "").strip() or None
            brand_byline = bool(getattr(author, "brand_byline_enabled", False))
            brand_logo = (getattr(author, "brand_logo_url", None) or "").strip() or None
            if brand_byline and not brand_logo:
                # Sensible default for brand accounts without a custom upload yet
                uname = (author.username or "").strip().lower().replace(" ", "")
                if "wirefringe" in uname:
                    brand_logo = "/wirefringe.png"
        else:
            creator_name = creator_raw
            creator_avatar = None

        comment_count = 0
        if comment_counts is not None:
            comment_count = int(comment_counts.get(str(post.id), 0) or 0)
        else:
            # Single-post path: load approved count for this post only
            counts = self.comment_repo.count_approved_by_post_ids([str(post.id)])
            comment_count = int(counts.get(str(post.id), 0) or 0)

        return PostOut(
            id=post.id,
            title=post.title,
            link=post.link,
            creator=post.creator,
            creatorName=creator_name,
            creatorAvatarUrl=creator_avatar,
            creatorBrandByline=brand_byline,
            creatorBrandLogoUrl=brand_logo if brand_byline else None,
            content=post.content,
            excerpt=post.excerpt,
            bucket=post.bucket,
            readMinutes=post.read_minutes,
            ogImg=post.og_img,
            accentColor=getattr(post, "accent_color", None) or None,
            metaDescription=post.meta_description,
            keywords=post.keywords,
            commentCount=comment_count,
            date=post.published_at,
        )

    def _comment_counts_for_posts(self, posts: list[Post]) -> dict[str, int]:
        ids = [str(p.id) for p in posts if getattr(p, "id", None) is not None]
        return self.comment_repo.count_approved_by_post_ids(ids)

    def _public_list_flags(self) -> tuple[bool, bool]:
        """Return (public_only, hide_bot) for public feed filtering."""
        try:
            bot = SettingsService(self.db).get_bot()
            hide_bot = bool(bot.get("hideArticles"))
        except Exception:
            hide_bot = False
        return True, hide_bot

    def list_posts(self, *, public: bool = True) -> list[PostOut]:
        """List posts. Public listing respects hidden/bot visibility settings."""
        if public:
            public_only, hide_bot = self._public_list_flags()
            posts = self.post_repo.list_published(public_only=public_only, hide_bot=hide_bot)
        else:
            posts = self.post_repo.list_published()
        author_lookup = self.user_repo.build_author_lookup()
        comment_counts = self._comment_counts_for_posts(posts)
        return [self._build_post_out(p, author_lookup, comment_counts) for p in posts]

    def list_posts_by_creator(self, creator: str) -> list[PostOut]:
        """List posts by a specific creator."""
        posts = self.post_repo.get_by_creator(creator)
        author_lookup = self.user_repo.build_author_lookup()
        comment_counts = self._comment_counts_for_posts(posts)
        return [self._build_post_out(p, author_lookup, comment_counts) for p in posts]

    def list_posts_paginated(
        self, offset: int = 0, limit: int = 20, creator: str | None = None
    ) -> tuple[list[PostOut], int]:
        """List posts with pagination and return total count."""
        posts = self.post_repo.list_paginated(offset, limit, creator)
        total_count = self.post_repo.count(creator)
        author_lookup = self.user_repo.build_author_lookup()
        comment_counts = self._comment_counts_for_posts(posts)
        return [self._build_post_out(p, author_lookup, comment_counts) for p in posts], total_count

    def count_posts_by_creator(self, creator: str | None = None) -> list[CreatorCountOut]:
        """Return post counts grouped by creator username."""
        rows = self.post_repo.count_by_creator(creator)
        return [CreatorCountOut(username=username, count=count) for username, count in rows]

    def get_post_growth_counts(
        self, days: int = 30, creator: str | None = None
    ) -> PostGrowthCountsOut:
        """Count published posts in the last N days vs previous N days."""
        days = max(1, min(int(days or 30), 365))
        now = datetime.utcnow()
        start_current = now - timedelta(days=days)
        start_prev = now - timedelta(days=2 * days)

        current = self.post_repo.count_published_since(start_current, creator)
        prev = self.post_repo.count_published_between(start_prev, start_current, creator)
        return PostGrowthCountsOut(current=current, prev=prev)

    def get_posts_by_month_counts(
        self, months: int = 6, creator: str | None = None
    ) -> list[MonthCountOut]:
        """Count published posts per month for the last N months (inclusive)."""
        months = max(1, min(int(months or 6), 24))

        now = datetime.utcnow()
        keys: list[str] = []
        for i in range(months - 1, -1, -1):
            year = now.year
            month = now.month - i
            while month <= 0:
                month += 12
                year -= 1
            keys.append(f"{year:04d}-{month:02d}")

        # Range filter (best effort) to keep the aggregation tight.
        y0, m0 = keys[0].split("-")
        since = datetime(int(y0), int(m0), 1)
        y1 = now.year
        m1 = now.month + 1
        if m1 == 13:
            m1 = 1
            y1 += 1
        until = datetime(int(y1), int(m1), 1)

        rows = self.post_repo.count_published_by_month(since, until, creator)
        count_by_key = {k: int(c) for k, c in rows}
        return [MonthCountOut(key=k, count=int(count_by_key.get(k, 0))) for k in keys]

    def _is_publicly_visible(self, post: Post) -> bool:
        if getattr(post, "is_hidden", False):
            return False
        try:
            if SettingsService(self.db).get_bot().get("hideArticles"):
                if getattr(post, "is_bot", False):
                    return False
                creator = (post.creator or "").strip().lower()
                if creator in BOT_CREATOR_KEYS:
                    return False
        except Exception:
            pass
        return True

    def get_post(self, post_id: str, *, public: bool = True) -> PostOut:
        """Get a single post by ID."""
        post = self.post_repo.get(post_id)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")
        if public and not self._is_publicly_visible(post):
            raise HTTPException(status_code=404, detail="Post not found")
        return self._build_post_out(post)

    def get_post_by_slug(self, slug: str, *, public: bool = True) -> PostOut:
        """Get a post by its slug."""
        slug = (slug or "").strip().lower()
        if not slug:
            raise HTTPException(status_code=400, detail="Missing slug")

        posts = self.post_repo.list_all_ordered()
        author_lookup = self.user_repo.build_author_lookup()
        for p in posts:
            if self._slugify_title(p.title) == slug:
                if public and not self._is_publicly_visible(p):
                    raise HTTPException(status_code=404, detail="Post not found")
                return self._build_post_out(p, author_lookup)

        raise HTTPException(status_code=404, detail="Post not found")

    def create_post(self, payload: PostUpsert, user: User) -> PostOut:
        """Create a new post."""
        post_id = str(uuid.uuid4())
        excerpt = payload.excerpt
        if excerpt is None:
            excerpt = (payload.content or "").strip()[:180]

        post = Post(
            id=post_id,
            title=payload.title,
            link=None,
            creator=(user.username if user.role == "author" else (payload.creator or user.username)),
            content=payload.content or "",
            excerpt=excerpt or "",
            bucket=payload.bucket or "Tech",
            read_minutes=payload.readMinutes or 1,
            og_img=payload.ogImg,
            accent_color=normalize_accent_color(payload.accentColor),
            meta_description=payload.metaDescription,
            keywords=payload.keywords,
            published_at=None,
        )
        created = self.post_repo.create(post)
        return self._build_post_out(created)

    def update_post(self, post_id: str, payload: PostUpsert, user: User) -> PostOut:
        """Update an existing post."""
        post = self.post_repo.get(post_id)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")

        if user.role == "author" and (post.creator or "").strip() != user.username:
            raise HTTPException(status_code=403, detail="Not allowed")

        post.title = payload.title
        post.bucket = payload.bucket or post.bucket
        post.content = payload.content or post.content
        post.excerpt = payload.excerpt or post.excerpt
        post.og_img = payload.ogImg or post.og_img
        if "accentColor" in payload.model_fields_set:
            post.accent_color = normalize_accent_color(payload.accentColor)
        post.read_minutes = payload.readMinutes or post.read_minutes
        post.meta_description = payload.metaDescription or post.meta_description
        post.keywords = payload.keywords or post.keywords

        updated = self.post_repo.update(post)
        return self._build_post_out(updated)

    def get_personalized_feed(self, user_id: int, limit: int = 20) -> list[PostOut]:
        """Fetch pre-calculated personalized feed for the user."""
        # 1. Try to get pre-calculated recommendations (respect public visibility)
        q = (
            self.db.query(Post)
            .join(PersonalizedFeed, Post.id == PersonalizedFeed.post_id)
            .filter(PersonalizedFeed.user_id == user_id)
            .filter(Post.is_hidden.is_(False))
        )
        try:
            if SettingsService(self.db).get_bot().get("hideArticles"):
                q = q.filter(Post.is_bot.is_(False))
        except Exception:
            pass
        recs = (
            q.order_by(PersonalizedFeed.score.desc(), Post.published_at.desc())
            .limit(limit)
            .all()
        )

        if recs:
            author_lookup = self.user_repo.build_author_lookup()
            return [self._build_post_out(p, author_lookup) for p in recs]

        # 2. Fallback: if no pre-calculated recs, return latest posts
        # (This handles new users or cases where the background task hasn't run yet)
        return self.list_posts(public=True)[:limit]

    def get_news_queue(self) -> list[NewsQueueItem]:
        """Get all pending or failed news from the database queue."""
        items = self.db.query(NewsQueue).filter(NewsQueue.status.in_(["pending", "failed_scrape", "failed_gen", "db_error"])).all()
        return [
            NewsQueueItem(
                title=item.title,
                link=item.link,
                category=item.category,
                status=item.status,
            )
            for item in items
        ]

        updated = self.post_repo.update(post)
        return self._build_post_out(updated)

    def publish_post(self, post_id: str, user: User) -> PostOut:
        """Publish a post (admin/editor only)."""
        if user.role == "author":
            raise HTTPException(status_code=403, detail="Editor or admin required")

        post = self.post_repo.get(post_id)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")

        if post.published_at is None:
            post.published_at = datetime.utcnow()

        updated = self.post_repo.update(post)
        return self._build_post_out(updated)

    def delete_post(self, post_id: str, user: User) -> None:
        """Delete a post and all its associated comments."""
        post = self.post_repo.get(post_id)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")

        if user.role == "author" and (post.creator or "").strip() != user.username:
            raise HTTPException(status_code=403, detail="Not allowed")

        # Delete all comments for this post first (to avoid FK constraint violation)
        self.comment_repo.delete_by_post(post_id)
        
        # Then delete the post
        self.post_repo.delete(post)
