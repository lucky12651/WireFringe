from __future__ import annotations

import asyncio
import logging
import re
from datetime import datetime, timezone
import uuid
from slugify import slugify

import httpx

from .bot_scope import bot_byline, bot_operator_users, bot_user_scope
from .config import settings
from .db import SessionLocal
from .models import Post, NewsQueue, User
from .news_bot_modules.bot_catalog import active_feeds
from .news_bot_modules.rss_fetcher import fetch_rss_items
from .news_bot_modules.queue_ops import (
    save_to_queue, 
    get_pending_from_queue, 
    update_queue_status, 
    is_duplicate, 
    cleanup_old_queue_items,
    add_to_recent_cache,
    cleanup_recent_cache
)
from .news_bot_modules.scraper import scrape_article
from .news_bot_modules.article_generator import generate_article
from .news_bot_modules.utils import is_unusable_story
from .services.recommendation_service import RecommendationService
from .services.settings_service import SettingsService
from .services.post_service import random_post_design

from sqlalchemy import text

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_wake_event: asyncio.Event | None = None
_wake_pending = False


def request_bot_cycle() -> None:
    """Wake the bot immediately (e.g. after editorial / RSS settings save)."""
    global _wake_pending
    ev = _wake_event
    if ev is None:
        _wake_pending = True
        return
    ev.set()


def ping_session(db) -> None:
    """Checkout a live connection after long HTTP awaits (idle tunnel/server drops)."""
    try:
        db.rollback()
        db.execute(text("SELECT 1"))
    except Exception as e:
        logger.warning("Resetting dead DB connection: %s", e)
        try:
            db.rollback()
        except Exception:
            pass
        try:
            db.close()
        except Exception:
            pass


class NewsBot:
    def __init__(self):
        self.http_client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "cross-site",
                "Cache-Control": "max-age=0",
            }
        )
        self.semaphore = asyncio.Semaphore(2)  # Process up to 2 articles concurrently to avoid rate limits

    async def trigger_revalidation(self):
        try:
            revalidate_url = f"{settings.ui_url}/api/revalidate"
            await self.http_client.post(revalidate_url, json={"secret": settings.revalidate_secret}, timeout=5.0)
        except Exception as e:
            logger.error(f"Error triggering UI frontend route revalidation: {e}")

    async def fetch_rss_items(self, category: str, url: str) -> list:
        return await fetch_rss_items(category, url, self.http_client)

    def save_to_queue(self, db, items: list, user_id: int | None = None):
        return save_to_queue(db, items, user_id=user_id)

    def _mark_queue(self, db, source_url: str, status: str, user_id: int | None = None) -> None:
        try:
            ping_session(db)
            update_queue_status(db, source_url, status, user_id=user_id)
        except Exception:
            s = SessionLocal()
            try:
                update_queue_status(s, source_url, status, user_id=user_id)
            except Exception:
                logger.exception("Could not update queue status for %s", source_url)
            finally:
                s.close()

    async def process_item(self, db, item: NewsQueue, user: User | None = None) -> bool:
        """Process a single RSS item from this account's queue."""
        source_url = item.link
        category = item.category
        owner_id = int(getattr(user, "id", 0) or getattr(item, "user_id", 0) or 0) or None
        try:
            if is_unusable_story(item.title, source_url):
                logger.info("Skipping unusable story: %s", source_url)
                self._mark_queue(db, source_url, "skipped", user_id=owner_id)
                return False

            logger.info(f"Processing: {source_url}")
            raw_content, scraped_img, parsed_title, resolved_url, extra_images = await scrape_article(
                source_url, self.http_client
            )
            ping_session(db)
            logger.info(f"Scraped raw content length: {len(raw_content) if raw_content else 0}")

            final_title = parsed_title if (parsed_title and len(parsed_title) > 5) else item.title
            final_title = re.split(r' - \w+', final_title)[0].strip()

            if is_duplicate(db, source_url, resolved_url, final_title, user_id=owner_id):
                logger.info(f"Skipping duplicate: {source_url}")
                self._mark_queue(db, source_url, "duplicate", user_id=owner_id)
                return False

            if not raw_content:
                self._mark_queue(db, source_url, "failed_scrape", user_id=owner_id)
                return False

            recent_posts = db.query(Post).order_by(Post.published_at.desc()).limit(15).all()
            internal_links = [
                {"title": p.title, "url": f"{settings.ui_url}/post/{p.id}"}
                for p in recent_posts
            ]

            bot_cfg = SettingsService(db).get_bot(user)
            article_data = await generate_article(
                raw_content, source_url, category, item.title, scraped_img, parsed_title,
                internal_links=internal_links,
                writer_prompt=bot_cfg.get("writerPrompt"),
                focus_note=bot_cfg.get("focusNote"),
            )
            ping_session(db)
            if not article_data:
                self._mark_queue(db, source_url, "failed_gen", user_id=owner_id)
                return False

            keywords = article_data.keywords
            if isinstance(keywords, list):
                keywords = ", ".join(str(k) for k in keywords if k)
            elif keywords is not None and not isinstance(keywords, str):
                keywords = str(keywords)

            slug = slugify(article_data.title)
            if db.query(Post).filter(Post.id == slug).first():
                slug = f"{slug}-{str(uuid.uuid4())[:8]}"

            from .news_bot_modules.image_ops import resolve_story_image

            rss_image = getattr(item, "image", None) or ""
            article_data.ogImg = await resolve_story_image(
                db,
                candidates=[scraped_img, rss_image, article_data.ogImg, *(extra_images or [])],
                title=article_data.title,
                category=article_data.bucket or category,
                http_client=self.http_client,
                unique=slug,
            )
            ping_session(db)
            if not article_data.ogImg:
                logger.warning("Publishing without a local photo: %s", source_url)

            auto_publish = bool(bot_cfg.get("autoPublish"))
            now = datetime.now(timezone.utc)
            source_name = None
            try:
                from urllib.parse import urlparse

                source_name = (urlparse(resolved_url).netloc or "").replace("www.", "") or None
            except Exception:
                source_name = None
            dest_section = (getattr(item, "dest_section", None) or "").strip()
            featured_in = None
            if dest_section:
                import json as _json

                featured_in = _json.dumps([dest_section])
            bucket = (item.category or article_data.bucket or "Tech").strip()
            picked_design = random_post_design()
            publish_as = bot_byline(user) if user is not None else (
                str(bot_cfg.get("publishCreator") or article_data.creator or "Wirefringe").strip() or "Wirefringe"
            )
            logger.info("Assigned post design %s for %s (byline %s)", picked_design, article_data.title, publish_as)
            new_post = Post(
                id=slug,
                title=article_data.title,
                link=resolved_url,
                creator=publish_as,
                content=article_data.content,
                excerpt=article_data.excerpt,
                bucket=bucket,
                read_minutes=article_data.readMinutes,
                og_img=article_data.ogImg,
                meta_description=article_data.metaDescription,
                keywords=keywords,
                published_at=now if auto_publish else None,
                is_bot=True,
                is_hidden=not auto_publish or bool(bot_cfg.get("hideArticles")),
                status="published" if auto_publish else "review",
                source_url=resolved_url,
                source_name=source_name,
                featured_in=featured_in,
                design=picked_design,
                bot_user_id=owner_id,
            )

            try:
                db.add(new_post)
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error(f"Error writing schema parameters into relational storage rows: {e}")
                ping_session(db)
                s = SessionLocal()
                try:
                    s.add(Post(
                        id=slug,
                        title=article_data.title,
                        link=resolved_url,
                        creator=publish_as,
                        content=article_data.content,
                        excerpt=article_data.excerpt,
                        bucket=bucket,
                        read_minutes=article_data.readMinutes,
                        og_img=article_data.ogImg,
                        meta_description=article_data.metaDescription,
                        keywords=keywords,
                        published_at=now if auto_publish else None,
                        is_bot=True,
                        is_hidden=not auto_publish or bool(bot_cfg.get("hideArticles")),
                        status="published" if auto_publish else "review",
                        source_url=resolved_url,
                        source_name=source_name,
                        featured_in=featured_in,
                        design=picked_design,
                        bot_user_id=owner_id,
                    ))
                    s.commit()
                except Exception:
                    s.rollback()
                    logger.exception("Retry publish failed for %s", source_url)
                    self._mark_queue(db, source_url, "db_error", user_id=owner_id)
                    return False
                finally:
                    s.close()

            logger.info("🚀 INSTANTLY PUBLISHED [%s]: %s", picked_design, article_data.title)
            add_to_recent_cache(db, article_data.title, resolved_url, user_id=owner_id)
            self._mark_queue(db, source_url, "published", user_id=owner_id)
            await self.trigger_revalidation()
            return True
        except Exception:
            logger.exception("process_item crashed for %s", source_url)
            self._mark_queue(db, source_url, "failed_gen", user_id=owner_id)
            return False

    async def run_cycle(self):
        db = SessionLocal()
        try:
            users = bot_operator_users(db)
        finally:
            db.close()

        if not users:
            logger.info("NewsBot: no accounts with bot access; skipping cycle.")
            return

        for user in users:
            try:
                await self.run_cycle_for_user(user)
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("NewsBot cycle failed for user %s", getattr(user, "username", "?"))

        db = SessionLocal()
        try:
            now_utc = datetime.now(timezone.utc)
            if now_utc.hour == 20:
                rec_service = RecommendationService(db)
                rec_service.update_all_recommendations()
        except Exception:
            logger.exception("Recommendation update failed")
        finally:
            db.close()

    async def run_cycle_for_user(self, user: User):
        uid = int(user.id)
        with bot_user_scope(uid):
            logger.info(
                "NewsBot engine loop initiated for %s: Stage 1 - Gathering tracking feeds...",
                user.username,
            )
            db = SessionLocal()
            try:
                svc = SettingsService(db)
                bot_cfg = svc.get_bot(user)
                if not bot_cfg.get("enabled", True):
                    logger.info("NewsBot is disabled for this account. Skipping cycle.")
                    return

                daily_limit = int(bot_cfg.get("dailyLimit") or 12)
                gap_minutes = int(bot_cfg.get("gapMinutes") or 120)
                gap_seconds = max(0, gap_minutes * 60)
                queue_cleanup_hours = int(bot_cfg.get("queueCleanupHours") or 24)
                recent_cache_hours = int(bot_cfg.get("recentCacheHours") or 2)
                max_items_per_feed = int(bot_cfg.get("maxItemsPerFeed") or 5)
                process_per_cycle = int(bot_cfg.get("processPerCycle") or 1)

                cleanup_old_queue_items(db, hours=queue_cleanup_hours, user_id=uid)
                cleanup_recent_cache(db, hours=recent_cache_hours, user_id=uid)

                max_age_hours = int(bot_cfg.get("maxAgeHours") or 6)
                feeds = active_feeds(bot_cfg)
                logger.info("Fetching %s enabled editorial feeds", len(feeds))
                if not feeds:
                    logger.warning(
                        "No RSS feeds are active after country/section filters "
                        "(countries=%s sections=%s). Editorial settings are blocking harvest.",
                        bot_cfg.get("countries"),
                        bot_cfg.get("sections"),
                    )
                all_items = []
                harvested_at = datetime.now(timezone.utc).isoformat()
                for feed in feeds:
                    items = await fetch_rss_items(
                        feed["section"], feed["url"], self.http_client, max_age_hours=max_age_hours
                    )
                    dest_cat = str(feed.get("destinationCategory") or feed.get("section") or "").strip()
                    dest_sec = str(feed.get("destinationSection") or "").strip()
                    src_cat = str(feed.get("sourceCategory") or "").strip().lower()
                    kept = 0
                    for it in items:
                        if src_cat:
                            hay = f"{it.get('source_category') or ''} {it.get('title') or ''}".lower()
                            if src_cat not in hay:
                                continue
                        if dest_cat:
                            it["category"] = dest_cat
                        if dest_sec:
                            it["dest_section"] = dest_sec
                        all_items.append(it)
                        kept += 1
                        if kept >= max_items_per_feed:
                            break
                    feed["lastFetch"] = harvested_at

                logger.info("Syncing discovered items into this account's staging queue...")
                self.save_to_queue(db, all_items, user_id=uid)

                now = datetime.now(timezone.utc)
                start_of_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
                posts_today = (
                    db.query(Post)
                    .filter(
                        Post.published_at >= start_of_day,
                        Post.bot_user_id == uid,
                    )
                    .count()
                )
                remaining_slots = max(0, daily_limit - posts_today)

                last_post = (
                    db.query(Post)
                    .filter(Post.bot_user_id == uid)
                    .order_by(Post.published_at.desc())
                    .first()
                )
                time_gap_ok = True
                if gap_seconds > 0 and last_post and last_post.published_at:
                    last_at = last_post.published_at
                    if last_at.tzinfo is None:
                        last_at = last_at.replace(tzinfo=timezone.utc)
                    elapsed = now - last_at
                    if elapsed.total_seconds() < gap_seconds:
                        time_gap_ok = False
                        remaining_minutes = int((gap_seconds - elapsed.total_seconds()) / 60)
                        logger.info(
                            "Time gap restriction: Only %.1f minutes elapsed since last bot post. "
                            "Need to wait another %s minutes.",
                            elapsed.total_seconds() / 60,
                            remaining_minutes,
                        )

                logger.info(
                    "Daily limit status: %s/%s bot posts published today. Remaining slots: %s",
                    posts_today,
                    daily_limit,
                    remaining_slots,
                )

                pending = get_pending_from_queue(db, user_id=uid)
                if pending and remaining_slots > 0 and time_gap_ok:
                    logger.info(
                        "🚀 Stage 2 - Initiating sequential extraction for up to %s article(s) (slots: %s)...",
                        process_per_cycle,
                        remaining_slots,
                    )
                    success_count = 0
                    attempts = 0
                    max_attempts = max(process_per_cycle * 8, 8)
                    for item in pending:
                        if success_count >= process_per_cycle or success_count >= remaining_slots:
                            break
                        if attempts >= max_attempts:
                            break
                        attempts += 1
                        try:
                            success = await self.process_item(db, item, user=user)
                        except Exception:
                            logger.exception("Unhandled error processing %s", getattr(item, "link", "?"))
                            success = False
                        ping_session(db)
                        if success:
                            success_count += 1
                        else:
                            await asyncio.sleep(3)
                    logger.info("✨ Successfully finished processing %s items in this cycle.", success_count)
                elif not pending:
                    logger.info("ℹ️ No pending news items to process in this cycle.")
                elif not time_gap_ok:
                    logger.info("ℹ️ Skipping news extraction due to %s-minute gap restriction.", gap_minutes)
                else:
                    logger.info(
                        "ℹ️ Daily limit of %s bot posts already reached. Skipping news extraction.",
                        daily_limit,
                    )
            except Exception:
                logger.exception("NewsBot cycle failed")
                try:
                    db.rollback()
                except Exception:
                    pass
            finally:
                db.close()
            logger.info("NewsBot loop segment complete for %s.", user.username)

    async def close(self):
        await self.http_client.aclose()


async def start_news_bot_loop():
    global _wake_event, _wake_pending
    bot = NewsBot()
    _wake_event = asyncio.Event()
    if _wake_pending:
        _wake_pending = False
        _wake_event.set()
    try:
        while True:
            try:
                await bot.run_cycle()
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("NewsBot cycle crashed; will retry after sleep.")
            sleep_seconds = 3600
            try:
                db = SessionLocal()
                try:
                    svc = SettingsService(db)
                    sleeps = []
                    for u in bot_operator_users(db):
                        cfg = svc.get_bot(u)
                        if cfg.get("enabled", True):
                            sleeps.append(int(cfg.get("sleepSeconds") or 3600))
                    if sleeps:
                        sleep_seconds = min(sleeps)
                finally:
                    db.close()
            except Exception as e:
                logger.warning("Could not read bot sleepSeconds; using 3600: %s", e)
            sleep_seconds = max(60, sleep_seconds)
            woke = _wake_event.is_set()
            _wake_event.clear()
            if woke:
                logger.info("NewsBot woken early by settings change; starting a cycle.")
                continue
            logger.info(f"Sleeping for {sleep_seconds} seconds...")
            try:
                await asyncio.wait_for(_wake_event.wait(), timeout=sleep_seconds)
                logger.info("NewsBot woken early by settings change; starting a cycle.")
            except asyncio.TimeoutError:
                pass
    except asyncio.CancelledError:
        logger.info("NewsBot engine routine safely interrupted.")
        raise
    finally:
        _wake_event = None
        await bot.close()
