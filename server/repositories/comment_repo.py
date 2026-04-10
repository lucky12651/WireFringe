from __future__ import annotations

from datetime import datetime

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from ..models import Comment, CommentVote, Post
from .base import BaseRepository


class CommentRepository(BaseRepository[Comment]):
    """Repository for Comment entity."""

    def __init__(self, db: Session):
        super().__init__(db, Comment)

    def get_by_post(self, post_id: str, approved_only: bool = True) -> list[Comment]:
        """Get comments for a post."""
        stmt = select(Comment).where(Comment.post_id == post_id)
        if approved_only:
            stmt = stmt.where(Comment.approved.is_(True))
        stmt = stmt.order_by(
            Comment.likes.desc(), Comment.created_at.desc(), Comment.id.desc()
        )
        return self.db.execute(stmt).scalars().all()

    def get_votes_by_visitor(
        self, comment_ids: list[int], visitor_id: str
    ) -> dict[int, str]:
        """Get votes by a visitor for given comment IDs."""
        if not comment_ids:
            return {}

        rows = self.db.execute(
            select(CommentVote.comment_id, CommentVote.direction).where(
                CommentVote.visitor_id == visitor_id,
                CommentVote.comment_id.in_(comment_ids),
            )
        ).all()

        vote_by_comment_id: dict[int, str] = {}
        for cid, direction in rows:
            if cid is None:
                continue
            d = (direction or "").strip().lower()
            if d in {"like", "dislike"}:
                vote_by_comment_id[int(cid)] = d

        return vote_by_comment_id

    def get_vote(
        self, comment_id: int, visitor_id: str
    ) -> CommentVote | None:
        """Get a specific vote."""
        return (
            self.db.execute(
                select(CommentVote)
                .where(CommentVote.comment_id == comment_id)
                .where(CommentVote.visitor_id == visitor_id)
            )
            .scalar_one_or_none()
        )

    def create_vote(
        self, comment_id: int, visitor_id: str, direction: str
    ) -> CommentVote:
        """Create a new vote."""
        now = datetime.utcnow()
        vote = CommentVote(
            comment_id=comment_id,
            visitor_id=visitor_id,
            direction=direction,
            created_at=now,
            updated_at=now,
        )
        self.db.add(vote)
        self.db.commit()
        return vote

    def update_vote(self, vote: CommentVote, direction: str) -> CommentVote:
        """Update an existing vote."""
        vote.direction = direction
        vote.updated_at = datetime.utcnow()
        self.db.commit()
        return vote

    def delete_vote(self, vote: CommentVote) -> None:
        """Delete a vote."""
        self.db.delete(vote)
        self.db.commit()

    def delete_votes_for_comment(self, comment_id: int) -> None:
        """Delete all votes for a comment."""
        self.db.execute(
            delete(CommentVote).where(CommentVote.comment_id == comment_id)
        )
        self.db.commit()

    def list_with_post_titles(
        self, creator: str | None = None
    ) -> list[tuple[Comment, str | None]]:
        """List comments with their post titles."""
        stmt = select(Comment, Post.title).outerjoin(
            Post, Post.id == Comment.post_id
        )
        if creator:
            stmt = stmt.where(Post.creator == creator)
        stmt = stmt.order_by(Comment.created_at.desc(), Comment.id.desc())
        return list(self.db.execute(stmt).all())

    def get_pending_count(self, creator: str | None = None) -> int:
        """Get count of pending comments."""
        if creator:
            count = self.db.execute(
                select(func.count(Comment.id))
                .select_from(Comment)
                .join(Post, Post.id == Comment.post_id)
                .where(Comment.approved.is_(False))
                .where(Post.creator == creator)
            ).scalar_one()
        else:
            count = self.db.execute(
                select(func.count(Comment.id)).where(Comment.approved.is_(False))
            ).scalar_one()
        return int(count or 0)

    def list_trending(
        self, since: datetime, limit: int, creator: str | None = None
    ) -> list[tuple[Comment, str | None]]:
        """Get trending comments since a given date."""
        stmt = (
            select(Comment, Post.title)
            .outerjoin(Post, Post.id == Comment.post_id)
            .where(Comment.created_at >= since)
        )
        if creator:
            stmt = stmt.where(Post.creator == creator)
        stmt = stmt.order_by(
            Comment.likes.desc(), Comment.created_at.desc(), Comment.id.desc()
        ).limit(limit)
        return list(self.db.execute(stmt).all())

    def delete_by_post(self, post_id: str) -> int:
        """Delete all comments for a post, including their votes. Returns count deleted."""
        # First delete all votes for comments on this post
        comment_ids_stmt = select(Comment.id).where(Comment.post_id == post_id)
        self.db.execute(
            delete(CommentVote).where(CommentVote.comment_id.in_(comment_ids_stmt))
        )
        # Then delete the comments
        result = self.db.execute(delete(Comment).where(Comment.post_id == post_id))
        self.db.commit()
        return result.rowcount
