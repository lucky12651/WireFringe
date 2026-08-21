import logging
import re
from datetime import datetime, timedelta, timezone
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from .utils import clean_url, is_unusable_story
from ..models import NewsQueue, RecentNewsCache

logger = logging.getLogger(__name__)


def _uid(user_id) -> int | None:
    try:
        n = int(user_id)
        return n if n else None
    except (TypeError, ValueError):
        return None


def save_to_queue(db: Session, items: List[Dict[str, str]], user_id: int | None = None) -> None:
    """Save RSS items to this account's news_queue if they don't already exist."""
    uid = _uid(user_id)
    new_count = 0
    seen_links: set[str] = set()
    for item in items:
        link = clean_url(item.get("link") or "")
        if not link or link in seen_links:
            continue
        seen_links.add(link)
        title = (item.get("title") or "").strip()
        cleaned_title = re.split(r" - \w+", title)[0].strip()

        if is_unusable_story(title, link):
            continue

        q = db.query(NewsQueue).filter(NewsQueue.link == link)
        q = q.filter(NewsQueue.user_id == uid) if uid else q.filter(NewsQueue.user_id.is_(None))
        if q.first():
            continue

        cache_q = db.query(RecentNewsCache).filter(
            or_(
                RecentNewsCache.link == link,
                RecentNewsCache.title == title,
                RecentNewsCache.title == cleaned_title,
            )
        )
        cache_q = (
            cache_q.filter(RecentNewsCache.user_id == uid)
            if uid
            else cache_q.filter(RecentNewsCache.user_id.is_(None))
        )
        if cache_q.first():
            continue

        db.add(
            NewsQueue(
                title=title,
                link=link,
                category=item.get("category") or "World",
                dest_section=(item.get("dest_section") or None),
                status="pending",
                user_id=uid,
            )
        )
        try:
            db.commit()
            new_count += 1
        except IntegrityError:
            db.rollback()
            logger.info("Queue already has %s; skipped duplicate.", link)
    logger.info("💾 Step Finished: Saved %s new pending feed links into structural storage.", new_count)


def get_pending_from_queue(db: Session, limit: int = 24, user_id: int | None = None) -> List[NewsQueue]:
    """Newest pending first, then a few recent photo/AI failures. Skip junk URLs."""
    uid = _uid(user_id)
    owner = NewsQueue.user_id == uid if uid else NewsQueue.user_id.is_(None)
    pending = (
        db.query(NewsQueue)
        .filter(NewsQueue.status == "pending", owner)
        .order_by(NewsQueue.created_at.desc())
        .limit(limit)
        .all()
    )
    remaining = max(0, limit - len(pending))
    retries = []
    if remaining:
        retries = (
            db.query(NewsQueue)
            .filter(NewsQueue.status.in_(["failed_image", "failed_gen"]), owner)
            .order_by(NewsQueue.created_at.desc())
            .limit(remaining)
            .all()
        )

    usable: List[NewsQueue] = []
    for item in [*pending, *retries]:
        if is_unusable_story(item.title, item.link):
            update_queue_status(db, item.link, "skipped", user_id=uid)
            continue
        usable.append(item)
    return usable


def cleanup_old_queue_items(db: Session, hours: int = 24, user_id: int | None = None) -> int:
    """Delete this account's queue rows older than the given hours."""
    uid = _uid(user_id)
    threshold = datetime.now(timezone.utc) - timedelta(hours=hours)
    q = db.query(NewsQueue).filter(NewsQueue.created_at < threshold)
    q = q.filter(NewsQueue.user_id == uid) if uid else q.filter(NewsQueue.user_id.is_(None))
    deleted = q.delete(synchronize_session=False)
    db.commit()
    if deleted > 0:
        logger.info("🧹 Cleaned up %s old items from the news queue (> %sh old).", deleted, hours)
    return deleted


def update_queue_status(db: Session, link: str, status: str, user_id: int | None = None) -> None:
    """Update the status of a specific link in this account's news_queue."""
    uid = _uid(user_id)
    q = db.query(NewsQueue).filter(NewsQueue.link == link)
    q = q.filter(NewsQueue.user_id == uid) if uid else q.filter(NewsQueue.user_id.is_(None))
    item = q.first()
    if item:
        item.status = status
        db.commit()


def is_duplicate(
    db: Session,
    source_url: str,
    resolved_url: str = None,
    title: str = None,
    user_id: int | None = None,
) -> bool:
    """Check if this account already published the story (recent cache)."""
    uid = _uid(user_id)
    filters = [RecentNewsCache.link == source_url]
    if resolved_url and resolved_url != source_url:
        filters.append(RecentNewsCache.link == resolved_url)
    if title:
        filters.append(RecentNewsCache.title == title)
    query = db.query(RecentNewsCache).filter(or_(*filters))
    query = query.filter(RecentNewsCache.user_id == uid) if uid else query.filter(RecentNewsCache.user_id.is_(None))
    return query.first() is not None


def add_to_recent_cache(db: Session, title: str, link: str, user_id: int | None = None) -> None:
    """Add a published post to this account's recent cache."""
    uid = _uid(user_id)
    try:
        q = db.query(RecentNewsCache).filter(RecentNewsCache.link == link)
        q = q.filter(RecentNewsCache.user_id == uid) if uid else q.filter(RecentNewsCache.user_id.is_(None))
        existing = q.first()
        if not existing:
            db.add(RecentNewsCache(title=title, link=link, user_id=uid))
            db.commit()
    except Exception as e:
        db.rollback()
        logger.error("Error adding to recent cache: %s", e)


def cleanup_recent_cache(db: Session, hours: int = 2, user_id: int | None = None) -> int:
    """Delete this account's recent-cache rows older than the given hours."""
    uid = _uid(user_id)
    threshold = datetime.now(timezone.utc) - timedelta(hours=hours)
    q = db.query(RecentNewsCache).filter(RecentNewsCache.created_at < threshold)
    q = q.filter(RecentNewsCache.user_id == uid) if uid else q.filter(RecentNewsCache.user_id.is_(None))
    deleted = q.delete(synchronize_session=False)
    db.commit()
    if deleted > 0:
        logger.info("🧹 Cleaned up %s items from the recent news cache (> %sh old).", deleted, hours)
    return deleted
