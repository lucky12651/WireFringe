import logging
import re
from datetime import datetime, timedelta, timezone
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from .utils import clean_url, is_unusable_story
from ..models import NewsQueue, Post, RecentNewsCache

logger = logging.getLogger(__name__)


def save_to_queue(db: Session, items: List[Dict[str, str]]) -> None:
    """Save RSS items to database news_queue if they don't already exist."""
    new_count = 0
    seen_links: set[str] = set()
    for item in items:
        link = clean_url(item.get("link") or "")
        if not link or link in seen_links:
            continue
        seen_links.add(link)
        title = (item.get("title") or "").strip()
        cleaned_title = re.split(r' - \w+', title)[0].strip()

        if is_unusable_story(title, link):
            continue

        in_queue = db.query(NewsQueue).filter(NewsQueue.link == link).first()
        if in_queue:
            continue

        # Check against recent cache for faster uniqueness check
        is_published = db.query(RecentNewsCache).filter(
            or_(
                RecentNewsCache.link == link,
                RecentNewsCache.title == title,
                RecentNewsCache.title == cleaned_title
            )
        ).first()

        if is_published:
            continue

        db.add(
            NewsQueue(
                title=title,
                link=link,
                category=item.get("category") or "World",
                dest_section=(item.get("dest_section") or None),
                status="pending",
            )
        )
        try:
            db.commit()
            new_count += 1
        except IntegrityError:
            db.rollback()
            logger.info("Queue already has %s; skipped duplicate.", link)
    logger.info(f"💾 Step Finished: Saved {new_count} new pending feed links into structural storage.")


def get_pending_from_queue(db: Session, limit: int = 24) -> List[NewsQueue]:
    """Newest pending first, then a few recent photo/AI failures. Skip junk URLs."""
    pending = (
        db.query(NewsQueue)
        .filter(NewsQueue.status == "pending")
        .order_by(NewsQueue.created_at.desc())
        .limit(limit)
        .all()
    )
    remaining = max(0, limit - len(pending))
    retries = []
    if remaining:
        retries = (
            db.query(NewsQueue)
            .filter(NewsQueue.status.in_(["failed_image", "failed_gen"]))
            .order_by(NewsQueue.created_at.desc())
            .limit(remaining)
            .all()
        )

    usable: List[NewsQueue] = []
    for item in [*pending, *retries]:
        if is_unusable_story(item.title, item.link):
            update_queue_status(db, item.link, "skipped")
            continue
        usable.append(item)
    return usable


def cleanup_old_queue_items(db: Session, hours: int = 24) -> int:
    """Delete items from news_queue that are older than specified hours."""
    threshold = datetime.now(timezone.utc) - timedelta(hours=hours)
    # Filter out items older than threshold. 
    # Note: we use >= if we want to keep them, but here we want to delete them.
    deleted = db.query(NewsQueue).filter(NewsQueue.created_at < threshold).delete()
    db.commit()
    if deleted > 0:
        logger.info(f"🧹 Cleaned up {deleted} old items from the news queue (> {hours}h old).")
    return deleted


def update_queue_status(db: Session, link: str, status: str) -> None:
    """Update the status of a specific link in database news_queue."""
    item = db.query(NewsQueue).filter(NewsQueue.link == link).first()
    if item:
        item.status = status
        db.commit()


def is_duplicate(db: Session, source_url: str, resolved_url: str = None, title: str = None) -> bool:
    """Check if post is a duplicate by link (original or resolved) or title using recent cache."""
    filters = [RecentNewsCache.link == source_url]
    if resolved_url and resolved_url != source_url:
        filters.append(RecentNewsCache.link == resolved_url)

    if title:
        filters.append(RecentNewsCache.title == title)

    query = db.query(RecentNewsCache).filter(or_(*filters))
    return query.first() is not None


def add_to_recent_cache(db: Session, title: str, link: str) -> None:
    """Add a published post to the recent cache."""
    try:
        # Check if already in cache to avoid UniqueConstraint errors
        existing = db.query(RecentNewsCache).filter(RecentNewsCache.link == link).first()
        if not existing:
            new_cache_item = RecentNewsCache(title=title, link=link)
            db.add(new_cache_item)
            db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding to recent cache: {e}")


def cleanup_recent_cache(db: Session, hours: int = 2) -> int:
    """Delete items from recent_news_cache that are older than specified hours."""
    threshold = datetime.now(timezone.utc) - timedelta(hours=hours)
    deleted = db.query(RecentNewsCache).filter(RecentNewsCache.created_at < threshold).delete()
    db.commit()
    if deleted > 0:
        logger.info(f"🧹 Cleaned up {deleted} items from the recent news cache (> {hours}h old).")
    return deleted
