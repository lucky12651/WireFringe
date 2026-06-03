import logging
import re
from datetime import datetime, timedelta, timezone
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .utils import clean_url
from ..models import NewsQueue, Post

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

        is_published = db.query(Post).filter(
            or_(
                Post.link == link,
                Post.title == title,
                Post.title == cleaned_title
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
    """Get all pending items from database news_queue."""
    return db.query(NewsQueue).filter(NewsQueue.status == "pending").all()


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
    """Check if post is a duplicate by link (original or resolved) or title."""
    filters = [Post.link == source_url]
    if resolved_url and resolved_url != source_url:
        filters.append(Post.link == resolved_url)

    if title:
        filters.append(Post.title == title)

    query = db.query(Post).filter(or_(*filters))
    return query.first() is not None
