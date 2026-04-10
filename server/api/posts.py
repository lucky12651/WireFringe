from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..dependencies import get_current_user, get_db, require_user
from ..models import User
from ..schemas import PaginatedPostsOut, PostOut, PostUpsert
from ..services import PostService

router = APIRouter()


def get_post_service(db: Session = Depends(get_db)) -> PostService:
    return PostService(db)


# Public post endpoints


@router.get("/posts", response_model=list[PostOut])
def list_posts(service: PostService = Depends(get_post_service)) -> list[PostOut]:
    """List all published posts."""
    return service.list_posts()


@router.get("/posts/{post_id}", response_model=PostOut)
def get_post(
    post_id: str, service: PostService = Depends(get_post_service)
) -> PostOut:
    """Get a single post by ID."""
    return service.get_post(post_id)


@router.get("/post", response_model=PostOut)
def get_post_by_query(
    id: str, service: PostService = Depends(get_post_service)
) -> PostOut:
    """Get a post by ID (query param version)."""
    return service.get_post(id)


@router.get("/post/by-slug", response_model=PostOut)
def get_post_by_slug(
    slug: str, service: PostService = Depends(get_post_service)
) -> PostOut:
    """Get a post by its URL slug."""
    return service.get_post_by_slug(slug)


# Admin post endpoints


@router.get("/admin/posts", response_model=PaginatedPostsOut)
def admin_list_posts(
    request: Request,
    offset: int = 0,
    limit: int | None = 20,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> PaginatedPostsOut:
    """List posts for admin (filtered by role)."""
    user = require_user(request, db)
    creator = user.username if user.role == "author" else None
    
    if limit is None or limit <= 0:
        # Fetch all posts if limit is not provided
        posts = service.list_posts_by_creator(creator) if creator else service.list_posts()
        return PaginatedPostsOut(posts=posts, total=len(posts))
        
    posts, total = service.list_posts_paginated(offset, limit, creator)
    return PaginatedPostsOut(posts=posts, total=total)


@router.get("/admin/post", response_model=PostOut)
def admin_get_post(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> PostOut:
    """Get a post for editing (admin)."""
    user = require_user(request, db)
    post = service.get_post(id)
    # Additional permission check
    post_model = service.post_repo.get(id)
    if user.role == "author" and (post_model.creator or "").strip() != user.username:
        raise HTTPException(status_code=403, detail="Not allowed")
    return post


@router.post("/admin/posts", response_model=PostOut)
def admin_create_post(
    payload: PostUpsert,
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> PostOut:
    """Create a new post."""
    user = require_user(request, db)
    return service.create_post(payload, user)


@router.put("/admin/posts/{post_id}", response_model=PostOut)
def admin_update_post(
    post_id: str,
    payload: PostUpsert,
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> PostOut:
    """Update an existing post."""
    user = require_user(request, db)
    return service.update_post(post_id, payload, user)


@router.put("/admin/post", response_model=PostOut)
def admin_update_post_query(
    id: str,
    payload: PostUpsert,
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> PostOut:
    """Update a post (query param version)."""
    user = require_user(request, db)
    return service.update_post(id, payload, user)


@router.post("/admin/posts/{post_id}/publish", response_model=PostOut)
def admin_publish_post(
    post_id: str,
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> PostOut:
    """Publish a post."""
    user = require_user(request, db)
    return service.publish_post(post_id, user)


@router.post("/admin/post/publish", response_model=PostOut)
def admin_publish_post_query(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> PostOut:
    """Publish a post (query param version)."""
    user = require_user(request, db)
    return service.publish_post(id, user)


@router.delete("/admin/posts/{post_id}")
def admin_delete_post(
    post_id: str,
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> dict:
    """Delete a post."""
    user = require_user(request, db)
    service.delete_post(post_id, user)
    return {"ok": True}


@router.delete("/admin/post")
def admin_delete_post_query(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> dict:
    """Delete a post (query param version)."""
    user = require_user(request, db)
    service.delete_post(id, user)
    return {"ok": True}
