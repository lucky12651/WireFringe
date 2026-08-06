from __future__ import annotations

import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..dependencies import get_current_user, get_db, require_user, get_optional_user
from ..models import User
from ..schemas import (
    CreatorCountOut,
    MonthCountOut,
    NewsQueueItem,
    RecentCacheItem,
    PaginatedPostsOut,
    PostGrowthCountsOut,
    PostOut,
    PostUpsert,
)
from ..services import PostService

logger = logging.getLogger(__name__)

router = APIRouter()


def get_post_service(db: Session = Depends(get_db)) -> PostService:
    return PostService(db)


# Public post endpoints


@router.get("/posts/for-you", response_model=list[PostOut])
async def get_for_you_posts(
    request: Request,
    limit: int = 20,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> list[PostOut]:
    """Get personalized posts for the current user."""
    user = get_optional_user(request, db)

    if not user:
        # Fallback for non-logged in users: just latest posts
        return service.list_posts()[:limit]
    
    return service.get_personalized_feed(user.id, limit)


@router.get("/posts", response_model=list[PostOut])
def list_posts(service: PostService = Depends(get_post_service)) -> list[PostOut]:
    """List all published posts (public visibility rules applied)."""
    return service.list_posts(public=True)


@router.get("/posts/{post_id}", response_model=PostOut)
def get_post(
    post_id: str, service: PostService = Depends(get_post_service)
) -> PostOut:
    """Get a single post by ID."""
    return service.get_post(post_id, public=True)


@router.get("/post", response_model=PostOut)
def get_post_by_query(
    id: str, service: PostService = Depends(get_post_service)
) -> PostOut:
    """Get a post by ID (query param version)."""
    return service.get_post(id, public=True)


@router.get("/post/by-slug", response_model=PostOut)
def get_post_by_slug(
    slug: str, service: PostService = Depends(get_post_service)
) -> PostOut:
    """Get a post by its URL slug."""
    return service.get_post_by_slug(slug, public=True)


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
        # Fetch all posts if limit is not provided (admin: include hidden/bot)
        if creator:
            posts = service.list_posts_by_creator(creator)
        else:
            posts = service.list_posts(public=False)
        return PaginatedPostsOut(posts=posts, total=len(posts))
        
    posts, total = service.list_posts_paginated(offset, limit, creator)
    return PaginatedPostsOut(posts=posts, total=total)


@router.get("/admin/stats/posts-by-member", response_model=list[CreatorCountOut])
def admin_posts_by_member_stats(
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> list[CreatorCountOut]:
    """Dashboard helper: count posts grouped by creator.

    Uses DB aggregation so results are correct regardless of admin post pagination.
    """
    user = require_user(request, db)
    creator = user.username if user.role == "author" else None
    return service.count_posts_by_creator(creator)


@router.get("/admin/stats/post-growth", response_model=PostGrowthCountsOut)
def admin_post_growth_stats(
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
    days: int = 30,
) -> PostGrowthCountsOut:
    """Dashboard helper: post growth (last N days vs previous N days)."""
    user = require_user(request, db)
    creator = user.username if user.role == "author" else None
    days = max(1, min(int(days or 30), 365))
    return service.get_post_growth_counts(days, creator)


@router.get("/admin/stats/posts-by-month", response_model=list[MonthCountOut])
def admin_posts_by_month_stats(
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
    months: int = 6,
) -> list[MonthCountOut]:
    """Dashboard helper: posts per month for the last N months."""
    user = require_user(request, db)
    creator = user.username if user.role == "author" else None
    months = max(1, min(int(months or 6), 24))
    return service.get_posts_by_month_counts(months, creator)


@router.get("/admin/posts/queue", response_model=list[NewsQueueItem])
def admin_get_news_queue(
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> list[NewsQueueItem]:
    """Get pending news from CSV queue."""
    require_user(request, db)
    return service.get_news_queue()


@router.post("/admin/posts/queue/process")
async def admin_process_queue_item(
    link: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """Manually trigger processing of a queue item."""
    require_user(request, db)
    
    from ..news_bot import NewsBot
    bot = NewsBot()
    try:
        # Find the item in DB
        from ..models import NewsQueue
        item = db.query(NewsQueue).filter(NewsQueue.link == link).first()
        if not item:
            raise HTTPException(status_code=404, detail="Queue item not found")
        
        logger.info(f"Manual process triggered for: {link}")
        success = await bot.process_item(db, item)
        
        if not success:
            # Refresh item to get latest status (e.g. failed_scrape)
            db.refresh(item)
            logger.warning(f"Manual process failed for {link}: {item.status}")
            return {
                "success": False, 
                "status": item.status,
                "message": f"Processing failed at stage: {item.status}"
            }
        
        return {"success": True, "message": "Article processed and published."}
    except Exception as e:
        logger.exception(f"Unexpected error during manual process: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await bot.close()


@router.delete("/admin/posts/queue")
def admin_delete_queue_item(
    link: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """Delete an item from the news queue."""
    require_user(request, db)
    from ..models import NewsQueue
    item = db.query(NewsQueue).filter(NewsQueue.link == link).first()
    if not item:
        raise HTTPException(status_code=404, detail="Queue item not found")
    
    db.delete(item)
    db.commit()
    return {"success": True}


@router.post("/admin/posts/queue/bulk-delete")
def admin_bulk_delete_queue_items(
    links: list[str],
    request: Request,
    db: Session = Depends(get_db),
):
    """Bulk delete items from the news queue."""
    require_user(request, db)
    from ..models import NewsQueue
    db.query(NewsQueue).filter(NewsQueue.link.in_(links)).delete(synchronize_session=False)
    db.commit()
    return {"success": True}


@router.post("/admin/posts/queue/bulk-process")
async def admin_bulk_process_queue_items(
    links: list[str],
    request: Request,
    db: Session = Depends(get_db),
):
    """Bulk process items from the news queue."""
    require_user(request, db)
    
    from ..news_bot import NewsBot
    bot = NewsBot()
    results = []
    try:
        from ..models import NewsQueue
        items = db.query(NewsQueue).filter(NewsQueue.link.in_(links)).all()
        
        for item in items:
            success = await bot.process_item(db, item)
            results.append({"link": item.link, "success": success})
            # Add a small delay to be polite to target servers during bulk processing
            await asyncio.sleep(2)
            
        return {"success": True, "results": results}
    finally:
        await bot.close()


@router.get("/admin/posts/queue/recent-cache", response_model=list[RecentCacheItem])
def admin_get_recent_cache(
    request: Request,
    db: Session = Depends(get_db),
) -> list[RecentCacheItem]:
    """Get recently published items from cache."""
    require_user(request, db)
    from ..models import RecentNewsCache
    items = db.query(RecentNewsCache).order_by(RecentNewsCache.created_at.desc()).limit(50).all()
    return [
        RecentCacheItem(
            title=item.title,
            link=item.link,
            createdAt=item.created_at,
        )
        for item in items
    ]


@router.post("/admin/posts/queue/refresh-feeds")
async def admin_refresh_queue_feeds(
    request: Request,
    db: Session = Depends(get_db),
):
    """Manually trigger RSS feed collection to find new links."""
    require_user(request, db)
    
    from ..news_bot import NewsBot, FEEDS
    bot = NewsBot()
    try:
        all_items = []
        for category, url in FEEDS.items():
            items = await bot.fetch_rss_items(category, url)
            all_items.extend(items[:10]) # Get a bit more for manual refresh
        
        bot.save_to_queue(db, all_items)
        return {"success": True, "count": len(all_items)}
    finally:
        await bot.close()


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
