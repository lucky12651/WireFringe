import logging
import re
from datetime import datetime, timedelta, timezone
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .utils import clean_url
from ..models import NewsQueue, Post, RecentNewsCache

logger = logging.getLogger(__name__)


def save_to_queue(db: Session, items: List[Dict[str, str]]) -> None:
    """Save RSS items to database news_queue if they don't already exist."""
    new_count = 0
    for item in items:
        link = clean_url(item["link"])
        title = item["title"].strip()
        cleaned_title = re.split(r' - \w+', title)[0].strip()

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

        if not is_published:
            new_item = NewsQueue(
                title=title,
                link=link,
                category=item["category"],
                status="pending"
            )
            db.add(new_item)
            new_count += 1
    db.commit()
    logger.info(f"💾 Step Finished: Saved {new_count} new pending feed links into structural storage.")


def get_pending_from_queue(db: Session) -> List[NewsQueue]:
    """Pending plus retryable failures (photo/AI), not scrape-dead video/liveblogs."""
    return (
        db.query(NewsQueue)
        .filter(NewsQueue.status.in_(["pending", "failed_image", "failed_gen"]))
        .all()
    )


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
