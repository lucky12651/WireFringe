from __future__ import annotations

import re
import unicodedata
import uuid
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import Post, User
from ..repositories import CommentRepository, PostRepository, UserRepository
from ..schemas import PostOut, PostUpsert


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

    def _build_post_out(self, post: Post, author_lookup: dict[str, User] | None = None) -> PostOut:
        """Convert Post model to PostOut schema with author info."""
        if author_lookup is None:
            author_lookup = self.user_repo.build_author_lookup()
        creator_raw = (post.creator or "").strip() or None
        author = None
        if creator_raw:
            author = author_lookup.get(creator_raw.lower())

        if author is not None:
            creator_name = (author.display_name or author.username).strip() or author.username
            creator_avatar = author.avatar_url or None
        else:
            creator_name = creator_raw
            creator_avatar = None

        return PostOut(
            id=post.id,
            title=post.title,
            link=post.link,
            creator=post.creator,
            creatorName=creator_name,
            creatorAvatarUrl=creator_avatar,
            content=post.content,
            excerpt=post.excerpt,
            bucket=post.bucket,
            readMinutes=post.read_minutes,
            ogImg=post.og_img,
            date=post.published_at,
        )

    def list_posts(self) -> list[PostOut]:
        """List all posts."""
        posts = self.post_repo.list_published()
        author_lookup = self.user_repo.build_author_lookup()
        return [self._build_post_out(p, author_lookup) for p in posts]

    def list_posts_by_creator(self, creator: str) -> list[PostOut]:
        """List posts by a specific creator."""
        posts = self.post_repo.get_by_creator(creator)
        author_lookup = self.user_repo.build_author_lookup()
        return [self._build_post_out(p, author_lookup) for p in posts]

    def list_posts_paginated(
        self, offset: int = 0, limit: int = 20, creator: str | None = None
    ) -> tuple[list[PostOut], int]:
        """List posts with pagination and return total count."""
        posts = self.post_repo.list_paginated(offset, limit, creator)
        total_count = self.post_repo.count(creator)
        author_lookup = self.user_repo.build_author_lookup()
        return [self._build_post_out(p, author_lookup) for p in posts], total_count

    def get_post(self, post_id: str) -> PostOut:
        """Get a single post by ID."""
        post = self.post_repo.get(post_id)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")
        return self._build_post_out(post)

    def get_post_by_slug(self, slug: str) -> PostOut:
        """Get a post by its slug."""
        slug = (slug or "").strip().lower()
        if not slug:
            raise HTTPException(status_code=400, detail="Missing slug")

        posts = self.post_repo.list_all_ordered()
        author_lookup = self.user_repo.build_author_lookup()
        for p in posts:
            if self._slugify_title(p.title) == slug:
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
            read_minutes=payload.readMinutes,
            og_img=payload.ogImg,
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
        post.content = payload.content or ""
        post.creator = user.username if user.role == "author" else (payload.creator or user.username)
        post.og_img = payload.ogImg
        post.read_minutes = payload.readMinutes
        if payload.excerpt is None:
            post.excerpt = (post.content or "").strip()[:180]
        else:
            post.excerpt = payload.excerpt

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
