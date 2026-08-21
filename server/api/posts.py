from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..dependencies import get_current_user, get_db, require_user, get_optional_user, require_newsroom, require_staff
from ..models import User
from ..schemas import (
    BotPostCountsOut,
    BulkDeletePostsIn,
    BulkDeletePostsOut,
    CreatorCountOut,
    MonthCountOut,
    NewsQueueItem,
    RecentCacheItem,
    PaginatedPostsOut,
    PostGrowthCountsOut,
    PostOut,
    PostUpsert,
    StatusChangeIn,
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


@router.get("/posts/{post_id}/related", response_model=list[PostOut])
def related_posts(post_id: str, service: PostService = Depends(get_post_service)) -> list[PostOut]:
    post = service.post_repo.get(post_id)
    if post is None:
        # try slug
        try:
            built = service.get_post(post_id, public=True)
            post = service.post_repo.get(built.id)
        except HTTPException:
            raise HTTPException(status_code=404, detail="Post not found")
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return service.related_posts(post)


# Admin post endpoints


def _dash_source(raw: str | None) -> str:
    kind = (raw or "all").strip().lower()
    if kind in {"combined", "both"}:
        return "all"
    if kind in {"non-bot", "nonbot", "human"}:
        return "editorial"
    if kind in {"all", "bot", "editorial"}:
        return kind
    return "all"


def _parse_day(raw: str | None, *, end: bool = False):
    value = (raw or "").strip()
    if not value:
        return None
    try:
        day = datetime.strptime(value[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return None
    if end:
        return day + timedelta(days=1)
    return day


@router.get("/admin/posts", response_model=PaginatedPostsOut)
def admin_list_posts(
    request: Request,
    offset: int = 0,
    limit: int | None = 20,
    source: str = "editorial",
    q: str = "",
    status: str = "",
    date_from: str | None = None,
    date_to: str | None = None,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> PaginatedPostsOut:
    """List posts for admin (filtered by role)."""
    user = require_user(request, db)
    require_newsroom(user)
    creator = user.username if user.role == "author" else None
    kind = (source or "editorial").strip().lower()
    if kind not in {"editorial", "bot", "all"}:
        kind = "editorial"
    start = _parse_day(date_from)
    end = _parse_day(date_to, end=True)
    
    if limit is None or limit <= 0:
        # Fetch all posts if limit is not provided (admin: include hidden/bot)
        if creator:
            posts = service.list_posts_by_creator(creator)
        else:
            posts = service.list_posts(public=False)
            if kind != "all":
                want_bot = kind == "bot"
                posts = [p for p in posts if bool(getattr(p, "isBot", False)) is want_bot]
        return PaginatedPostsOut(posts=posts, total=len(posts))
        
    posts, total = service.list_posts_paginated(
        offset, limit, creator, kind, q, status, start, end
    )
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
    require_newsroom(user)
    creator = user.username if user.role == "author" else None
    return service.count_posts_by_creator(creator)


@router.get("/admin/stats/post-growth", response_model=PostGrowthCountsOut)
def admin_post_growth_stats(
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
    days: int = 30,
    source: str = "all",
) -> PostGrowthCountsOut:
    """Dashboard helper: post growth (last N days vs previous N days)."""
    user = require_user(request, db)
    require_newsroom(user)
    creator = user.username if user.role == "author" else None
    days = max(1, min(int(days or 30), 365))
    kind = "all" if creator else _dash_source(source)
    return service.get_post_growth_counts(days, creator, kind)


@router.get("/admin/stats/bot-posts", response_model=BotPostCountsOut)
def admin_bot_post_stats(
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> BotPostCountsOut:
    """Dashboard helper: published and total bot-authored posts."""
    user = require_user(request, db)
    require_newsroom(user)
    if user.role == "author":
        return BotPostCountsOut(published=0, total=0)
    return service.get_bot_post_counts()


@router.get("/admin/stats/posts-by-month", response_model=list[MonthCountOut])
def admin_posts_by_month_stats(
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
    months: int = 6,
    source: str = "all",
) -> list[MonthCountOut]:
    """Dashboard helper: posts per month for the last N months."""
    user = require_user(request, db)
    require_newsroom(user)
    creator = user.username if user.role == "author" else None
    months = max(1, min(int(months or 6), 24))
    kind = "all" if creator else _dash_source(source)
    return service.get_posts_by_month_counts(months, creator, kind)


@router.get("/admin/posts/queue", response_model=list[NewsQueueItem])
def admin_get_news_queue(
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> list[NewsQueueItem]:
    """Get pending news from CSV queue."""
    user = require_user(request, db)
    require_staff(user)
    return service.get_news_queue()


@router.post("/admin/posts/queue/process")
async def admin_process_queue_item(
    link: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """Manually trigger processing of a queue item."""
    user = require_user(request, db)
    require_staff(user)
    
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
    user = require_user(request, db)
    require_staff(user)
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
    user = require_user(request, db)
    require_staff(user)
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
    user = require_user(request, db)
    require_staff(user)
    
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
    user = require_user(request, db)
    require_staff(user)
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
    user = require_user(request, db)
    require_staff(user)
    
    from ..news_bot import NewsBot
    from ..news_bot_modules.bot_catalog import active_feeds
    from ..news_bot_modules.rss_fetcher import fetch_rss_items
    from ..services.settings_service import SettingsService

    bot = NewsBot()
    try:
        cfg = SettingsService(db).get_bot()
        all_items = []
        for feed in active_feeds(cfg):
            items = await fetch_rss_items(
                feed["section"],
                feed["url"],
                bot.http_client,
                max_age_hours=int(cfg.get("maxAgeHours") or 6),
            )
            all_items.extend(items[:10])
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
    """Get a post for the admin editor, including hidden/bot posts."""
    user = require_user(request, db)
    require_newsroom(user)
    post = service.get_post(id, public=False)
    if user.role == "author" and (post.creator or "").strip() != user.username:
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
    require_newsroom(user)
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
    require_newsroom(user)
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
    require_newsroom(user)
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
    require_staff(user)
    return service.publish_post(post_id, user)


@router.post("/admin/posts/{post_id}/status", response_model=PostOut)
def admin_change_status(
    post_id: str,
    payload: StatusChangeIn,
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> PostOut:
    user = require_user(request, db)
    require_newsroom(user)
    return service.change_status(post_id, payload.status, payload.scheduledAt, user)


@router.get("/admin/posts/{post_id}/revisions")
def admin_list_revisions(
    post_id: str,
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> list:
    user = require_user(request, db)
    require_newsroom(user)
    return service.list_revisions(post_id)


@router.post("/admin/posts/{post_id}/revisions/{revision_id:int}/rollback", response_model=PostOut)
def admin_rollback_revision(
    post_id: str,
    revision_id: int,
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> PostOut:
    user = require_user(request, db)
    require_newsroom(user)
    return service.rollback_revision(post_id, revision_id, user)


@router.post("/admin/post/publish", response_model=PostOut)
def admin_publish_post_query(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> PostOut:
    """Publish a post (query param version)."""
    user = require_user(request, db)
    require_staff(user)
    return service.publish_post(id, user)


@router.post("/admin/posts/bulk-delete", response_model=BulkDeletePostsOut)
def admin_bulk_delete_posts(
    payload: BulkDeletePostsIn,
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> BulkDeletePostsOut:
    """Delete many posts at once."""
    user = require_user(request, db)
    require_newsroom(user)
    return BulkDeletePostsOut(**service.delete_posts_bulk(payload.ids, user))


@router.delete("/admin/posts/{post_id}")
def admin_delete_post(
    post_id: str,
    request: Request,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service),
) -> dict:
    """Delete a post."""
    user = require_user(request, db)
    require_newsroom(user)
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
    require_newsroom(user)
    service.delete_post(id, user)
    return {"ok": True}
