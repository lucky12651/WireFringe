from __future__ import annotations

import uuid
import bleach
from datetime import datetime, timedelta

from fastapi import HTTPException, Request
from sqlalchemy.orm import Session

from ..models import Comment, User
from ..repositories import CommentRepository, PostRepository
from ..schemas import (
    AdminCommentOut,
    CommentCreateRequest,
    CommentOut,
    CommentTrendOut,
    PendingCountOut,
)


class CommentService:
    """Service layer for Comment operations."""

    def __init__(self, db: Session):
        self.db = db
        self.comment_repo = CommentRepository(db)
        self.post_repo = PostRepository(db)

    @staticmethod
    def _get_or_create_visitor_id(request: Request) -> str:
        """Get existing visitor ID or create new one."""
        from ..dependencies import get_existing_visitor_id

        existing = get_existing_visitor_id(request)
        if existing:
            return existing
        visitor_id = uuid.uuid4().hex
        request.session["visitor_id"] = visitor_id
        return visitor_id

    def _build_comment_out(self, comment: Comment, my_vote: str | None = None) -> CommentOut:
        """Convert Comment model to CommentOut schema."""
        return CommentOut(
            id=comment.id,
            postId=comment.post_id,
            name=comment.name,
            comment=comment.body,
            likes=comment.likes,
            dislikes=comment.dislikes,
            myVote=my_vote,
            createdAt=comment.created_at,
        )

    def list_comments(self, post_id: str, request: Request) -> list[CommentOut]:
        """List approved comments for a post."""
        comments = self.comment_repo.get_by_post(post_id, approved_only=True)

        from ..dependencies import get_existing_visitor_id

        visitor_id = get_existing_visitor_id(request)
        vote_by_comment_id: dict[int, str] = {}
        if visitor_id and comments:
            ids = [int(c.id) for c in comments]
            vote_by_comment_id = self.comment_repo.get_votes_by_visitor(ids, visitor_id)

        return [
            self._build_comment_out(c, vote_by_comment_id.get(int(c.id)))
            for c in comments
        ]

    def create_comment(self, post_id: str, payload: CommentCreateRequest) -> CommentOut:
        """Create a new comment (pending approval)."""
        post = self.post_repo.get(post_id)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")

        name = (payload.name or "").strip()
        email = (payload.email or "").strip()
        body = (payload.comment or "").strip()

        if not name:
            raise HTTPException(status_code=400, detail="Name is required")
        if len(name) > 60:
            raise HTTPException(status_code=400, detail="Name too long (max 60 chars)")

        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        if len(email) > 160:
            raise HTTPException(status_code=400, detail="Email too long (max 160 chars)")
        if "@" not in email or "." not in email:
            raise HTTPException(status_code=400, detail="Email looks invalid")

        if not body:
            raise HTTPException(status_code=400, detail="Comment is required")
        if len(body) > 5000:
            raise HTTPException(status_code=400, detail="Comment too long (max 5000 chars)")

        # Sanitize body to prevent XSS
        body = bleach.clean(body, tags=[], attributes={}, strip=True)

        comment = Comment(
            post_id=post_id,
            name=name,
            email=email,
            body=body,
            likes=0,
            dislikes=0,
            approved=False,
        )
        created = self.comment_repo.create(comment)
        return self._build_comment_out(created)

    def vote_comment(
        self, comment_id: int, direction: str, request: Request
    ) -> CommentOut:
        """Vote on a comment (like/dislike)."""
        comment = self.comment_repo.get(comment_id)
        if comment is None:
            raise HTTPException(status_code=404, detail="Comment not found")

        if not bool(getattr(comment, "approved", False)):
            raise HTTPException(status_code=404, detail="Comment not found")

        visitor_id = self._get_or_create_visitor_id(request)

        existing = self.comment_repo.get_vote(comment_id, visitor_id)
        likes = int(comment.likes or 0)
        dislikes = int(comment.dislikes or 0)
        my_vote: str | None = None

        if existing is None:
            self.comment_repo.create_vote(comment_id, visitor_id, direction)
            if direction == "like":
                likes += 1
            else:
                dislikes += 1
            my_vote = direction
        else:
            prev = (existing.direction or "").strip().lower()
            if prev == direction:
                # Toggle off
                self.comment_repo.delete_vote(existing)
                if direction == "like":
                    likes = max(0, likes - 1)
                else:
                    dislikes = max(0, dislikes - 1)
                my_vote = None
            else:
                # Switch vote
                self.comment_repo.update_vote(existing, direction)
                if prev == "like":
                    likes = max(0, likes - 1)
                elif prev == "dislike":
                    dislikes = max(0, dislikes - 1)

                if direction == "like":
                    likes += 1
                else:
                    dislikes += 1
                my_vote = direction

        comment.likes = likes
        comment.dislikes = dislikes
        self.db.commit()
        self.db.refresh(comment)

        return self._build_comment_out(comment, my_vote)

    # Admin methods

    def list_all_comments(self, creator: str | None = None) -> list[AdminCommentOut]:
        """List all comments with post titles (admin view)."""
        rows = self.comment_repo.list_with_post_titles(creator)
        out: list[AdminCommentOut] = []
        for c, post_title in rows:
            out.append(
                AdminCommentOut(
                    id=c.id,
                    postId=c.post_id,
                    postTitle=post_title,
                    name=c.name,
                    email=c.email,
                    comment=c.body,
                    likes=c.likes,
                    dislikes=c.dislikes,
                    approved=bool(getattr(c, "approved", True)),
                    createdAt=c.created_at,
                )
            )
        return out

    def get_pending_count(self, creator: str | None = None) -> PendingCountOut:
        """Get count of pending comments."""
        count = self.comment_repo.get_pending_count(creator)
        return PendingCountOut(count=count)

    def approve_comment(self, comment_id: int) -> None:
        """Approve a pending comment."""
        comment = self.comment_repo.get(comment_id)
        if comment is None:
            raise HTTPException(status_code=404, detail="Comment not found")

        if not bool(getattr(comment, "approved", False)):
            comment.approved = True
            self.comment_repo.update(comment)

    def disapprove_comment(self, comment_id: int) -> None:
        """Delete a pending (unapproved) comment."""
        comment = self.comment_repo.get(comment_id)
        if comment is None:
            raise HTTPException(status_code=404, detail="Comment not found")

        if bool(getattr(comment, "approved", False)):
            raise HTTPException(status_code=400, detail="Comment is already approved")

        self.comment_repo.delete_votes_for_comment(comment_id)
        self.comment_repo.delete(comment)

    def delete_comment(self, comment_id: int) -> None:
        """Delete any comment (admin only)."""
        comment = self.comment_repo.get(comment_id)
        if comment is None:
            raise HTTPException(status_code=404, detail="Comment not found")

        self.comment_repo.delete_votes_for_comment(comment_id)
        self.comment_repo.delete(comment)

    def get_trending(
        self, days: int = 15, limit: int = 8, creator: str | None = None
    ) -> list[CommentTrendOut]:
        """Get trending comments."""
        days = max(1, min(int(days or 15), 365))
        limit = max(1, min(int(limit or 8), 25))
        since = datetime.utcnow() - timedelta(days=days)

        rows = self.comment_repo.list_trending(since, limit, creator)
        out: list[CommentTrendOut] = []
        for c, post_title in rows:
            preview = (c.body or "").strip().replace("\n", " ")
            preview = " ".join(preview.split())
            preview = (preview[:140] + "…") if len(preview) > 140 else preview
            out.append(
                CommentTrendOut(
                    id=c.id,
                    postId=c.post_id,
                    postTitle=post_title,
                    name=c.name,
                    commentPreview=preview,
                    likes=c.likes,
                    createdAt=c.created_at,
                )
            )
        return out
