from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from dependencies import get_db, require_staff, require_user
from schemas import (
    AdminCommentOut,
    CommentCreateRequest,
    CommentOut,
    CommentTrendOut,
    CommentVoteRequest,
    PendingCountOut,
)
from services import CommentService, PostService

router = APIRouter()


def get_comment_service(db: Session = Depends(get_db)) -> CommentService:
    return CommentService(db)


def get_post_service(db: Session = Depends(get_db)) -> PostService:
    return PostService(db)


# Public comment endpoints


@router.get("/posts/{post_id}/comments", response_model=list[CommentOut])
def list_comments(
    post_id: str,
    request: Request,
    service: CommentService = Depends(get_comment_service),
) -> list[CommentOut]:
    """List approved comments for a post."""
    return service.list_comments(post_id, request)


@router.post("/posts/{post_id}/comments", response_model=CommentOut)
def create_comment(
    post_id: str,
    payload: CommentCreateRequest,
    service: CommentService = Depends(get_comment_service),
) -> CommentOut:
    """Create a new comment (pending approval)."""
    return service.create_comment(post_id, payload)


@router.post("/comments/{comment_id}/vote", response_model=CommentOut)
def vote_comment(
    comment_id: int,
    payload: CommentVoteRequest,
    request: Request,
    service: CommentService = Depends(get_comment_service),
) -> CommentOut:
    """Vote on a comment."""
    return service.vote_comment(comment_id, payload.direction, request)


# Admin comment endpoints


@router.get("/admin/comments", response_model=list[AdminCommentOut])
def admin_list_comments(
    request: Request,
    db: Session = Depends(get_db),
    service: CommentService = Depends(get_comment_service),
) -> list[AdminCommentOut]:
    """List all comments for admin."""
    user = require_user(request, db)
    creator = user.username if user.role == "author" else None
    return service.list_all_comments(creator)


@router.get("/admin/comments/pending-count", response_model=PendingCountOut)
def admin_pending_comment_count(
    request: Request,
    db: Session = Depends(get_db),
    service: CommentService = Depends(get_comment_service),
) -> PendingCountOut:
    """Get count of pending comments."""
    user = require_user(request, db)
    from dependencies import require_staff

    if user.role == "author":
        return service.get_pending_count(user.username)
    require_staff(user)
    return service.get_pending_count()


@router.post("/admin/comments/{comment_id}/approve")
def admin_approve_comment(
    comment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    service: CommentService = Depends(get_comment_service),
) -> dict:
    """Approve a pending comment."""
    user = require_user(request, db)
    require_staff(user)
    service.approve_comment(comment_id)
    return {"ok": True}


@router.delete("/admin/comments/{comment_id}/disapprove")
def admin_disapprove_comment(
    comment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    service: CommentService = Depends(get_comment_service),
) -> dict:
    """Delete a pending (unapproved) comment."""
    user = require_user(request, db)
    require_staff(user)
    service.disapprove_comment(comment_id)
    return {"ok": True}


@router.get("/admin/comments/trending", response_model=list[CommentTrendOut])
def admin_trending_comments(
    request: Request,
    db: Session = Depends(get_db),
    service: CommentService = Depends(get_comment_service),
    days: int = 15,
    limit: int = 8,
) -> list[CommentTrendOut]:
    """Get trending comments."""
    user = require_user(request, db)
    creator = user.username if user.role == "author" else None
    return service.get_trending(days, limit, creator)


@router.delete("/admin/comments/{comment_id}")
def admin_delete_comment(
    comment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    service: CommentService = Depends(get_comment_service),
) -> dict:
    """Delete any comment (admin only)."""
    from dependencies import require_admin

    user = require_user(request, db)
    require_admin(user)
    service.delete_comment(comment_id)
    return {"ok": True}
