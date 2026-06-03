import logging
import re
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
