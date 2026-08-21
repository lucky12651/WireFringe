from __future__ import annotations

import csv
import os
import re
import unicodedata
import uuid
from datetime import datetime, timedelta, timezone
from xml.sax.saxutils import escape as xml_escape

from fastapi import HTTPException
from sqlalchemy import delete, func, or_, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..models import (
    Comment,
    CommentReport,
    CommentVote,
    NewsQueue,
    PersonalizedFeed,
    Post,
    PostRevision,
    UrlRedirect,
    User,
    UserInteraction,
)
from ..repositories import CommentRepository, PostRepository, UserRepository
from ..schemas import (
    BotPostCountsOut,
    CreatorCountOut,
    MonthCountOut,
    NewsQueueItem,
    PostGrowthCountsOut,
    PostOut,
    PostUpsert,
)
from .settings_service import BOT_CREATOR_KEYS, SettingsService

_ACCENT_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")

POST_DESIGNS = ("magazine", "split", "banner", "dark")
DEFAULT_POST_DESIGN = "magazine"


def normalize_post_design(value: str | None) -> str:
    """Accept one of the four public article layouts. Anything else → magazine."""
    v = str(value or "").strip().lower()
    return v if v in POST_DESIGNS else DEFAULT_POST_DESIGN


def random_post_design() -> str:
    import random

    return random.choice(POST_DESIGNS)


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
        author_slug = None
        author_bio = None
        if author is not None:
            creator_name = (author.display_name or author.username).strip() or author.username
            creator_avatar = (author.avatar_url or "").strip() or None
            brand_byline = bool(getattr(author, "brand_byline_enabled", False))
            brand_logo = None
            author_bio = getattr(author, "bio", None)
            author_slug = self._slugify_title(creator_name)
        else:
            creator_name = creator_raw
            creator_avatar = None
            if creator_name:
                author_slug = self._slugify_title(creator_name)

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
            design=normalize_post_design(getattr(post, "design", None)),
            metaDescription=post.meta_description,
            keywords=post.keywords,
            commentCount=comment_count,
            date=post.published_at,
            status=getattr(post, "status", None) or ("published" if post.published_at else "draft"),
            scheduledAt=getattr(post, "scheduled_at", None),
            isBreaking=bool(getattr(post, "is_breaking", False)),
            isPinned=bool(getattr(post, "is_pinned", False)),
            isSponsored=bool(getattr(post, "is_sponsored", False)),
            isBot=bool(getattr(post, "is_bot", False)),
            isHidden=bool(getattr(post, "is_hidden", False)),
            correction=getattr(post, "correction", None),
            correctedAt=getattr(post, "corrected_at", None),
            updatedAt=getattr(post, "updated_at", None),
            sourceUrl=getattr(post, "source_url", None),
            sourceName=getattr(post, "source_name", None),
            tags=self._split_csv(getattr(post, "tags", None)),
            relatedIds=self._split_csv(getattr(post, "related_ids", None)),
            viewCount=int(getattr(post, "view_count", 0) or 0),
            authorSlug=author_slug,
            authorBio=author_bio,
            extraCategories=self._json_list(getattr(post, "extra_categories", None)),
            featuredIn=self._json_list(getattr(post, "featured_in", None)),
        )

    @staticmethod
    def _json_list(raw) -> list[str]:
        import json

        if not raw:
            return []
        if isinstance(raw, list):
            return [str(x).strip() for x in raw if str(x).strip()]
        try:
            data = json.loads(raw)
            if isinstance(data, list):
                return [str(x).strip() for x in data if str(x).strip()]
        except Exception:
            pass
        return [x.strip() for x in str(raw).split(",") if x.strip()]

    @staticmethod
    def _dump_list(values: list[str] | None) -> str | None:
        import json

        items = [str(x).strip() for x in (values or []) if str(x).strip()]
        return json.dumps(items) if items else None

    @staticmethod
    def _split_csv(raw: str | None) -> list[str]:
        if not raw:
            return []
        return [p.strip() for p in str(raw).split(",") if p.strip()]

    def _comment_counts_for_posts(self, posts: list[Post]) -> dict[str, int]:
        ids = [str(p.id) for p in posts if getattr(p, "id", None) is not None]
        return self.comment_repo.count_approved_by_post_ids(ids)

    def _public_list_flags(self) -> tuple[bool, bool]:
        """Return (public_only, hide_bot) for public feed filtering.

        Per-account hide is stored on each post as is_hidden, so the extra
        global hide_bot flag is no longer applied here.
        """
        return True, False

    def list_posts(self, *, public: bool = True) -> list[PostOut]:
        """List posts. Public listing respects hidden/bot visibility settings."""
        if public:
            self.publish_due_scheduled()
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
        self,
        offset: int = 0,
        limit: int = 20,
        creator: str | None = None,
        source: str | None = "editorial",
        q: str | None = None,
        status: str | None = None,
        date_from=None,
        date_to=None,
    ) -> tuple[list[PostOut], int]:
        """List posts with pagination and return total count."""
        posts = self.post_repo.list_paginated(
            offset, limit, creator, source, q, status, date_from, date_to
        )
        total_count = self.post_repo.count(creator, source, q, status, date_from, date_to)
        author_lookup = self.user_repo.build_author_lookup()
        comment_counts = self._comment_counts_for_posts(posts)
        return [self._build_post_out(p, author_lookup, comment_counts) for p in posts], total_count

    def count_posts_by_creator(self, creator: str | None = None) -> list[CreatorCountOut]:
        """Return post counts grouped by creator username."""
        rows = self.post_repo.count_by_creator(creator)
        return [CreatorCountOut(username=username, count=count) for username, count in rows]

    def get_bot_post_counts(self) -> BotPostCountsOut:
        """Count bot-authored posts for the dashboard glance."""
        total = int(
            self.db.scalar(select(func.count()).select_from(Post).where(Post.is_bot.is_(True)))
            or 0
        )
        published = int(
            self.db.scalar(
                select(func.count())
                .select_from(Post)
                .where(
                    Post.is_bot.is_(True),
                    func.lower(func.coalesce(Post.status, "")) == "published",
                )
            )
            or 0
        )
        return BotPostCountsOut(published=published, total=total)

    def get_post_growth_counts(
        self, days: int = 30, creator: str | None = None, source: str | None = "all"
    ) -> PostGrowthCountsOut:
        """Count published posts in the last N days vs previous N days."""
        days = max(1, min(int(days or 30), 365))
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        start_current = now - timedelta(days=days)
        start_prev = now - timedelta(days=2 * days)
        kind = "all" if creator else (source or "all")

        current = self.post_repo.count_published_since(start_current, creator, kind)
        prev = self.post_repo.count_published_between(start_prev, start_current, creator, kind)
        return PostGrowthCountsOut(current=current, prev=prev)

    def get_posts_by_month_counts(
        self, months: int = 6, creator: str | None = None, source: str | None = "all"
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

        rows = self.post_repo.count_published_by_month(
            since, until, creator, source if creator else (source or "all")
        )
        count_by_key = {k: int(c) for k, c in rows}
        return [MonthCountOut(key=k, count=int(count_by_key.get(k, 0))) for k in keys]

    def _is_publicly_visible(self, post: Post) -> bool:
        if getattr(post, "is_hidden", False):
            return False
        status = (getattr(post, "status", None) or "").strip().lower()
        if status and status != "published":
            return False
        if post.published_at is None and status != "published":
            return False
        return True

    def publish_due_scheduled(self) -> int:
        now = datetime.now(timezone.utc)
        rows = (
            self.db.query(Post)
            .filter(Post.status == "scheduled", Post.scheduled_at.isnot(None), Post.scheduled_at <= now)
            .all()
        )
        for post in rows:
            post.status = "published"
            post.is_hidden = False
            if post.published_at is None:
                post.published_at = now
            post.updated_at = now
        if rows:
            self.db.commit()
        return len(rows)

    def get_post(self, post_id: str, *, public: bool = True) -> PostOut:
        """Get a single post by ID, or by title slug if the id does not match."""
        key = str(post_id or "").strip()
        post = self.post_repo.get(key) if key else None
        if post is None and key:
            slug = key.lower()
            for p in self.post_repo.list_all_ordered():
                if self._slugify_title(p.title) == slug or str(p.id).lower() == slug:
                    post = p
                    break
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")
        if public and not self._is_publicly_visible(post):
            raise HTTPException(status_code=404, detail="Post not found")
        if public:
            self.record_view(post)
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
                if public:
                    self.record_view(p)
                return self._build_post_out(p, author_lookup)

        raise HTTPException(status_code=404, detail="Post not found")

    def create_post(self, payload: PostUpsert, user: User) -> PostOut:
        """Create a new post."""
        post_id = str(uuid.uuid4())
        excerpt = payload.excerpt
        if excerpt is None:
            excerpt = (payload.content or "").strip()[:180]

        status = (payload.status or "draft").strip().lower()
        if status not in {"draft", "review", "scheduled", "published", "unpublished"}:
            status = "draft"
        if user.role == "author":
            if status == "published":
                status = "review"
            if status == "unpublished":
                status = "draft"
        now = datetime.now(timezone.utc)
        published_at = now if status == "published" else None
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
            design=normalize_post_design(payload.design),
            meta_description=payload.metaDescription,
            keywords=payload.keywords,
            published_at=published_at,
            status=status,
            scheduled_at=payload.scheduledAt,
            is_breaking=bool(payload.isBreaking),
            is_pinned=bool(payload.isPinned) if user.role != "author" else False,
            is_sponsored=bool(payload.isSponsored) if user.role != "author" else False,
            correction=payload.correction,
            source_url=payload.sourceUrl,
            source_name=payload.sourceName,
            tags=payload.tags,
            related_ids=payload.relatedIds,
            extra_categories=self._dump_list(payload.extraCategories),
            featured_in=self._dump_list(payload.featuredIn),
            is_hidden=status not in {"published"},
            updated_at=now,
        )
        created = self.post_repo.create(post)
        self._add_revision(created, user, status)
        return self._build_post_out(created)

    def update_post(self, post_id: str, payload: PostUpsert, user: User) -> PostOut:
        """Update an existing post."""
        post = self.post_repo.get(post_id)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")

        if user.role == "author" and (post.creator or "").strip() != user.username:
            raise HTTPException(status_code=403, detail="Not allowed")

        old_slug = f"/post/{self._slugify_title(post.title)}"
        post.title = payload.title
        post.bucket = payload.bucket or post.bucket
        post.content = payload.content or post.content
        post.excerpt = payload.excerpt or post.excerpt
        post.og_img = payload.ogImg or post.og_img
        if "accentColor" in payload.model_fields_set:
            post.accent_color = normalize_accent_color(payload.accentColor)
        if "design" in payload.model_fields_set:
            post.design = normalize_post_design(payload.design)
        post.read_minutes = payload.readMinutes or post.read_minutes
        post.meta_description = payload.metaDescription or post.meta_description
        post.keywords = payload.keywords or post.keywords
        if payload.extraCategories is not None:
            post.extra_categories = self._dump_list(payload.extraCategories)
        if payload.featuredIn is not None:
            post.featured_in = self._dump_list(payload.featuredIn)
        if payload.status:
            self._apply_status(post, payload.status, payload.scheduledAt, user)
        if payload.scheduledAt is not None:
            post.scheduled_at = payload.scheduledAt
        if payload.isBreaking is not None:
            post.is_breaking = payload.isBreaking
        if user.role != "author":
            if payload.isPinned is not None:
                post.is_pinned = payload.isPinned
            if payload.isSponsored is not None:
                post.is_sponsored = payload.isSponsored
        if payload.correction is not None:
            post.correction = payload.correction
            if payload.correction.strip():
                post.corrected_at = datetime.now(timezone.utc)
        if payload.sourceUrl is not None:
            post.source_url = payload.sourceUrl
        if payload.sourceName is not None:
            post.source_name = payload.sourceName
        if payload.tags is not None:
            post.tags = payload.tags
        if payload.relatedIds is not None:
            post.related_ids = payload.relatedIds
        post.updated_at = datetime.now(timezone.utc)

        updated = self.post_repo.update(post)
        self._add_revision(updated, user, getattr(updated, "status", None))
        new_slug = f"/post/{self._slugify_title(updated.title)}"
        if old_slug != new_slug:
            existing = (
                self.db.query(UrlRedirect).filter(UrlRedirect.from_path == old_slug).one_or_none()
            )
            if existing is None:
                self.db.add(UrlRedirect(from_path=old_slug, to_path=new_slug))
            else:
                existing.to_path = new_slug
            self.db.commit()
        return self._build_post_out(updated)

    def get_personalized_feed(self, user_id: int, limit: int = 20) -> list[PostOut]:
        """Fetch pre-calculated personalized feed for the user."""
        # 1. Try to get pre-calculated recommendations (respect public visibility)
        q = (
            self.db.query(Post)
            .join(PersonalizedFeed, Post.id == PersonalizedFeed.post_id)
            .filter(PersonalizedFeed.user_id == user_id)
            .filter(Post.is_hidden.is_(False), Post.status == "published")
        )
        recs = (
            q.order_by(PersonalizedFeed.score.desc(), Post.published_at.desc())
            .limit(limit)
            .all()
        )

        if recs:
            author_lookup = self.user_repo.build_author_lookup()
            return [self._build_post_out(p, author_lookup) for p in recs]

        # 2. Followed topics / authors
        from ..models import UserFollow

        follows = self.db.query(UserFollow).filter(UserFollow.user_id == user_id).all()
        if follows:
            def _key(value: str | None) -> str:
                return re.sub(r"[^a-z0-9]+", "", (value or "").strip().lower())

            topics = {_key(f.target) for f in follows if f.kind == "topic" and (f.target or "").strip()}
            authors = {_key(f.target) for f in follows if f.kind == "author" and (f.target or "").strip()}
            saved = {str(f.target).strip() for f in follows if f.kind == "post" and (f.target or "").strip()}
            public = self.list_posts(public=True)
            picked = [
                p
                for p in public
                if str(p.id) in saved
                or _key(p.bucket) in topics
                or _key(p.creatorName) in authors
                or _key(p.creator) in authors
            ]
            # Do not fall back to latest — Following must only show followed work.
            return picked[:limit]

        # 3. No follows yet
        return []

    def get_news_queue(self, user_id: int | None = None) -> list[NewsQueueItem]:
        """Get pending or failed news from this account's queue."""
        q = self.db.query(NewsQueue).filter(
            NewsQueue.status.in_(["pending", "failed_scrape", "failed_gen", "db_error"])
        )
        if user_id:
            q = q.filter(NewsQueue.user_id == int(user_id))
        items = q.all()
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

        self._apply_status(post, "published", None, user)
        updated = self.post_repo.update(post)
        self._add_revision(updated, user, "published")
        return self._build_post_out(updated)

    def _apply_status(self, post: Post, status: str, scheduled_at, user: User) -> None:
        status = (status or "").strip().lower()
        if status not in {"draft", "review", "scheduled", "published", "unpublished"}:
            raise HTTPException(status_code=400, detail="Invalid status")
        if user.role == "author":
            current = (getattr(post, "status", None) or "").strip().lower()
            if current == "published":
                status = "published"
            elif status == "published":
                status = "review"
            elif status == "unpublished":
                raise HTTPException(status_code=403, detail="Editor or admin required to unpublish")
        now = datetime.now(timezone.utc)
        post.status = status
        if scheduled_at is not None:
            post.scheduled_at = scheduled_at
        if status == "published":
            post.is_hidden = False
            if post.published_at is None:
                post.published_at = now
        elif status == "unpublished":
            post.is_hidden = True
        elif status == "scheduled":
            post.is_hidden = True
            if post.scheduled_at is None:
                raise HTTPException(status_code=400, detail="scheduledAt is required")
        else:
            post.is_hidden = True
        post.updated_at = now

    def _add_revision(self, post: Post, user: User | None, status: str | None) -> None:
        try:
            self.db.add(
                PostRevision(
                    post_id=post.id,
                    editor_name=(getattr(user, "display_name", None) or getattr(user, "username", None) or None)
                    if user
                    else None,
                    editor_user_id=getattr(user, "id", None) if user else None,
                    title=post.title or "",
                    content=post.content or "",
                    excerpt=post.excerpt or "",
                    status=status,
                )
            )
            self.db.commit()
        except Exception:
            self.db.rollback()

    def list_revisions(self, post_id: str) -> list[dict]:
        rows = (
            self.db.query(PostRevision)
            .filter(PostRevision.post_id == post_id)
            .order_by(PostRevision.created_at.desc())
            .limit(40)
            .all()
        )
        return [
            {
                "id": r.id,
                "postId": r.post_id,
                "editorName": r.editor_name,
                "title": r.title,
                "status": r.status,
                "createdAt": r.created_at,
            }
            for r in rows
        ]

    def rollback_revision(self, post_id: str, revision_id: int, user: User) -> PostOut:
        post = self.post_repo.get(post_id)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")
        if user.role == "author" and (post.creator or "").strip() != user.username:
            raise HTTPException(status_code=403, detail="Not allowed")
        rev = self.db.get(PostRevision, revision_id)
        if rev is None or rev.post_id != post_id:
            raise HTTPException(status_code=404, detail="Revision not found")
        post.title = rev.title
        post.content = rev.content
        post.excerpt = rev.excerpt
        post.updated_at = datetime.now(timezone.utc)
        updated = self.post_repo.update(post)
        self._add_revision(updated, user, getattr(updated, "status", None))
        return self._build_post_out(updated)

    def change_status(self, post_id: str, status: str, scheduled_at, user: User) -> PostOut:
        post = self.post_repo.get(post_id)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")
        if user.role == "author" and (post.creator or "").strip() != user.username:
            raise HTTPException(status_code=403, detail="Not allowed")
        self._apply_status(post, status, scheduled_at, user)
        updated = self.post_repo.update(post)
        self._add_revision(updated, user, status)
        return self._build_post_out(updated)

    def record_view(self, post: Post) -> None:
        try:
            post.view_count = int(getattr(post, "view_count", 0) or 0) + 1
            self.db.commit()
        except Exception:
            self.db.rollback()

    def search_posts(self, query: str) -> list[PostOut]:
        self.publish_due_scheduled()
        q = (query or "").strip()
        if len(q) < 2:
            return []
        like = f"%{q}%"
        rows = (
            self.db.query(Post)
            .filter(Post.is_hidden.is_(False), Post.status == "published")
            .filter(
                or_(
                    Post.title.ilike(like),
                    Post.excerpt.ilike(like),
                    Post.content.ilike(like),
                    Post.tags.ilike(like),
                    Post.creator.ilike(like),
                    Post.bucket.ilike(like),
                )
            )
            .order_by(Post.published_at.desc().nullslast())
            .limit(50)
            .all()
        )
        author_lookup = self.user_repo.build_author_lookup()
        return [self._build_post_out(p, author_lookup) for p in rows]

    def related_posts(self, post: Post, limit: int = 4) -> list[PostOut]:
        ids = self._split_csv(getattr(post, "related_ids", None))
        found: list[Post] = []
        if ids:
            for pid in ids[:limit]:
                row = self.post_repo.get(pid)
                if row and self._is_publicly_visible(row):
                    found.append(row)
        if len(found) < limit:
            extras = (
                self.db.query(Post)
                .filter(
                    Post.id != post.id,
                    Post.bucket == post.bucket,
                    Post.is_hidden.is_(False),
                    Post.status == "published",
                )
                .order_by(Post.published_at.desc().nullslast())
                .limit(limit * 2)
                .all()
            )
            have = {p.id for p in found}
            for row in extras:
                if row.id not in have:
                    found.append(row)
                if len(found) >= limit:
                    break
        author_lookup = self.user_repo.build_author_lookup()
        return [self._build_post_out(p, author_lookup) for p in found[:limit]]

    def get_author_page(self, slug: str) -> dict:
        slug = (slug or "").strip().lower()
        users = self.user_repo.list_ordered()
        author = None
        for u in users:
            name = (u.display_name or u.username or "").strip()
            if self._slugify_title(name) == slug:
                author = u
                break
        if author is None:
            raise HTTPException(status_code=404, detail="Author not found")
        keys = {(author.username or "").strip(), (author.display_name or "").strip(), (author.email or "").strip()}
        keys = {k for k in keys if k}
        posts = [
            p
            for p in self.post_repo.list_published(public_only=True)
            if (p.creator or "").strip() in keys
        ]
        author_lookup = self.user_repo.build_author_lookup()
        return {
            "name": (author.display_name or author.username),
            "slug": slug,
            "bio": getattr(author, "bio", None) or "",
            "avatarUrl": author.avatar_url,
            "posts": [self._build_post_out(p, author_lookup) for p in posts],
        }

    def build_rss(self) -> str:
        items = self.list_posts(public=True)[:40]
        parts = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<rss version="2.0"><channel>',
            "<title>Wirefringe</title>",
            "<link>https://wirefringe.com</link>",
            "<description>Tech, business, and culture from Wirefringe.</description>",
        ]
        for p in items:
            link = f"https://wirefringe.com/post/{self._slugify_title(p.title)}"
            parts.append("<item>")
            parts.append(f"<title>{xml_escape(p.title)}</title>")
            parts.append(f"<link>{xml_escape(link)}</link>")
            parts.append(f"<guid>{xml_escape(p.id)}</guid>")
            if p.date:
                parts.append(f"<pubDate>{p.date.strftime('%a, %d %b %Y %H:%M:%S +0000')}</pubDate>")
            parts.append(f"<description>{xml_escape(p.excerpt or '')}</description>")
            parts.append("</item>")
        parts.append("</channel></rss>")
        return "".join(parts)

    def _assert_can_delete_post(self, post: Post, user: User) -> None:
        if user.role == "author" and (post.creator or "").strip() != user.username:
            raise HTTPException(status_code=403, detail="Not allowed")
        if user.role == "author" and (getattr(post, "status", None) or "") == "published":
            raise HTTPException(status_code=403, detail="Ask an editor to unpublish before deleting")

    def _purge_post(self, post: Post) -> None:
        """Remove a post and related rows. Caller owns the transaction."""
        pid = str(post.id)
        # Detach the loaded row so SQLAlchemy does not emit its own DELETE
        # before the child tables are cleared.
        self.db.expunge(post)
        self.db.execute(
            text(
                "DELETE FROM comment_votes WHERE comment_id IN "
                "(SELECT id FROM comments WHERE post_id = :pid)"
            ),
            {"pid": pid},
        )
        self.db.execute(
            text(
                "DELETE FROM comment_reports WHERE comment_id IN "
                "(SELECT id FROM comments WHERE post_id = :pid)"
            ),
            {"pid": pid},
        )
        self.db.execute(text("DELETE FROM comments WHERE post_id = :pid"), {"pid": pid})
        self.db.execute(text("DELETE FROM user_interactions WHERE post_id = :pid"), {"pid": pid})
        self.db.execute(text("DELETE FROM personalized_feeds WHERE post_id = :pid"), {"pid": pid})
        self.db.execute(text("DELETE FROM post_revisions WHERE post_id = :pid"), {"pid": pid})
        self.db.execute(text("DELETE FROM posts WHERE id = :pid"), {"pid": pid})

    def delete_post(self, post_id: str, user: User) -> None:
        """Delete a post and every row that still points at it."""
        post = self.post_repo.get(post_id)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")

        self._assert_can_delete_post(post, user)

        try:
            self._purge_post(post)
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=409,
                detail="Could not delete this post because related records still point at it.",
            ) from exc
        except Exception:
            self.db.rollback()
            raise

    def delete_posts_bulk(self, post_ids: list[str], user: User) -> dict:
        """Delete many posts in one transaction. Skips missing or forbidden ids."""
        seen: list[str] = []
        for raw in post_ids:
            pid = str(raw or "").strip()
            if pid and pid not in seen:
                seen.append(pid)
        if not seen:
            raise HTTPException(status_code=400, detail="No post ids provided")

        deleted = 0
        skipped = 0
        missing = 0
        try:
            for pid in seen:
                post = self.post_repo.get(pid)
                if post is None:
                    missing += 1
                    continue
                try:
                    self._assert_can_delete_post(post, user)
                except HTTPException:
                    skipped += 1
                    continue
                self._purge_post(post)
                deleted += 1
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=409,
                detail="Could not delete these posts because related records still point at them.",
            ) from exc
        except Exception:
            self.db.rollback()
            raise

        return {"ok": True, "deleted": deleted, "skipped": skipped, "missing": missing}
