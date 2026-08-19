from __future__ import annotations

import asyncio
import logging
import re
from datetime import datetime, timezone
import uuid
from slugify import slugify

import httpx

from .config import settings
from .db import SessionLocal
from .models import Post, NewsQueue
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
from .services.recommendation_service import RecommendationService
from .services.settings_service import SettingsService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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

    def save_to_queue(self, db, items: list):
        return save_to_queue(db, items)

    async def process_item(self, db, item: NewsQueue) -> bool:
        """Process a single RSS item from the queue."""
        source_url = item.link
        category = item.category

        logger.info(f"Processing: {source_url}")
        raw_content, scraped_img, parsed_title, resolved_url, extra_images = await scrape_article(
            source_url, self.http_client
        )
        logger.info(f"Scraped raw content length: {len(raw_content) if raw_content else 0}")

        final_title = parsed_title if (parsed_title and len(parsed_title) > 5) else item.title
        final_title = re.split(r' - \w+', final_title)[0].strip()

        if is_duplicate(db, source_url, resolved_url, final_title):
            logger.info(f"Skipping duplicate: {source_url}")
            update_queue_status(db, source_url, "duplicate")
            return False

        if not raw_content:
            update_queue_status(db, source_url, "failed_scrape")
            return False

        # Fetch recent posts for internal linking context
        recent_posts = db.query(Post).order_by(Post.published_at.desc()).limit(15).all()
        internal_links = [
            {"title": p.title, "url": f"{settings.ui_url}/post/{p.id}"} 
            for p in recent_posts
        ]

        bot_cfg = SettingsService(db).get_bot()
        article_data = await generate_article(
            raw_content, source_url, category, item.title, scraped_img, parsed_title,
            internal_links=internal_links,
            writer_prompt=bot_cfg.get("writerPrompt"),
            focus_note=bot_cfg.get("focusNote"),
        )
        if not article_data:
            update_queue_status(db, source_url, "failed_gen")
            return False

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
        if not article_data.ogImg:
            logger.info("Dropping story with no real photo: %s", source_url)
            update_queue_status(db, source_url, "failed_image")
            return False

        auto_publish = bool(bot_cfg.get("autoPublish"))
        now = datetime.now(timezone.utc)
        source_name = None
        try:
            from urllib.parse import urlparse

            source_name = (urlparse(resolved_url).netloc or "").replace("www.", "") or None
        except Exception:
            source_name = None
        new_post = Post(
            id=slug,
            title=article_data.title,
            link=resolved_url,
            creator=article_data.creator,
            content=article_data.content,
            excerpt=article_data.excerpt,
            bucket=article_data.bucket,
            read_minutes=article_data.readMinutes,
            og_img=article_data.ogImg,
            meta_description=article_data.metaDescription,
            keywords=article_data.keywords,
            published_at=now if auto_publish else None,
            is_bot=True,
            is_hidden=not auto_publish or bool(bot_cfg.get("hideArticles")),
            status="published" if auto_publish else "review",
            source_url=resolved_url,
            source_name=source_name,
        )

        try:
            db.add(new_post)
            db.commit()
            logger.info(f"🚀 INSTANTLY PUBLISHED: {article_data.title}")
            
            # Add to recent cache for uniqueness check
            add_to_recent_cache(db, article_data.title, resolved_url)
            
            update_queue_status(db, source_url, "published")
            await self.trigger_revalidation()
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Error writing schema parameters into relational storage rows: {e}")
            update_queue_status(db, source_url, "db_error")
            return False

    async def run_cycle(self):
        logger.info("NewsBot engine loop initiated: Stage 1 - Gathering tracking feeds...")

        db = SessionLocal()
        try:
            bot_cfg = SettingsService(db).get_bot()
            if not bot_cfg.get("enabled", True):
                logger.info("NewsBot is disabled in admin settings. Skipping cycle.")
                return

            daily_limit = int(bot_cfg.get("dailyLimit") or 12)
            gap_minutes = int(bot_cfg.get("gapMinutes") or 120)
            gap_seconds = max(0, gap_minutes * 60)
            queue_cleanup_hours = int(bot_cfg.get("queueCleanupHours") or 24)
            recent_cache_hours = int(bot_cfg.get("recentCacheHours") or 2)
            max_items_per_feed = int(bot_cfg.get("maxItemsPerFeed") or 5)
            process_per_cycle = int(bot_cfg.get("processPerCycle") or 1)

            # Step 0: Cleanup old items
            cleanup_old_queue_items(db, hours=queue_cleanup_hours)
            cleanup_recent_cache(db, hours=recent_cache_hours)

            max_age_hours = int(bot_cfg.get("maxAgeHours") or 6)
            feeds = active_feeds(bot_cfg)
            logger.info("Fetching %s enabled editorial feeds", len(feeds))
            all_items = []
            for feed in feeds:
                items = await fetch_rss_items(
                    feed["section"], feed["url"], self.http_client, max_age_hours=max_age_hours
                )
                all_items.extend(items[:max_items_per_feed])

            logger.info("Syncing discovered items into the staging database queue...")
            self.save_to_queue(db, all_items)

            # Check daily post limit
            now = datetime.now(timezone.utc)
            start_of_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
            posts_today = (
                db.query(Post)
                .filter(Post.published_at >= start_of_day, Post.is_bot.is_(True))
                .count()
            )
            remaining_slots = max(0, daily_limit - posts_today)

            # Enforce gap between bot publications
            last_post = (
                db.query(Post)
                .filter(Post.is_bot.is_(True))
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
                        f"Time gap restriction: Only {elapsed.total_seconds() / 60:.1f} minutes "
                        f"elapsed since last bot post. Need to wait another {remaining_minutes} minutes."
                    )

            logger.info(
                f"Daily limit status: {posts_today}/{daily_limit} bot posts published today. "
                f"Remaining slots: {remaining_slots}"
            )

            pending = get_pending_from_queue(db)
            if pending and remaining_slots > 0 and time_gap_ok:
                logger.info(
                    f"🚀 Stage 2 - Initiating sequential extraction for up to "
                    f"{process_per_cycle} article(s) (slots: {remaining_slots})..."
                )

                success_count = 0
                for item in pending:
                    if success_count >= process_per_cycle or success_count >= remaining_slots:
                        break
                    success = await self.process_item(db, item)
                    if success:
                        success_count += 1
                    else:
                        await asyncio.sleep(2)

                logger.info(f"✨ Successfully finished processing {success_count} items in this cycle.")
            elif not pending:
                logger.info("ℹ️ No pending news items to process in this cycle.")
            elif not time_gap_ok:
                logger.info(f"ℹ️ Skipping news extraction due to {gap_minutes}-minute gap restriction.")
            else:
                logger.info(f"ℹ️ Daily limit of {daily_limit} bot posts already reached. Skipping news extraction.")

            # Step 3: Update personalized recommendations once per day at 2 AM IST (20:30 UTC)
            now_utc = datetime.now(timezone.utc)
            if now_utc.hour == 20:
                logger.info("🚀 Stage 3 - Scheduled Time (2 AM IST): Updating personalized recommendations...")
                rec_service = RecommendationService(db)
                rec_service.update_all_recommendations()
            else:
                logger.info(
                    f"ℹ️ Skipping Stage 3 - Current time {now_utc.strftime('%H:%M')} UTC "
                    f"is not the scheduled 20:30 UTC (2 AM IST)."
                )

        finally:
            db.close()
        logger.info("NewsBot loop segment complete.")

    async def close(self):
        await self.http_client.aclose()


async def start_news_bot_loop():
    bot = NewsBot()
    try:
        while True:
            await bot.run_cycle()
            # Read sleep interval from settings each cycle
            sleep_seconds = 3600
            try:
                db = SessionLocal()
                try:
                    sleep_seconds = int(SettingsService(db).get_bot().get("sleepSeconds") or 3600)
                finally:
                    db.close()
            except Exception as e:
                logger.warning(f"Could not read bot sleepSeconds; using 3600: {e}")
            sleep_seconds = max(60, sleep_seconds)
            logger.info(f"Sleeping for {sleep_seconds} seconds...")
            await asyncio.sleep(sleep_seconds)
    except asyncio.CancelledError:
        logger.info("NewsBot engine routine safely interrupted.")
    finally:
        await bot.close()
