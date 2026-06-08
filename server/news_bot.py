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
from .news_bot_modules.constants import FEEDS
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
        raw_content, scraped_img, parsed_title, resolved_url = await scrape_article(source_url, self.http_client)

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

        article_data = await generate_article(
            raw_content, source_url, category, item.title, scraped_img, parsed_title,
            internal_links=internal_links
        )
        if not article_data:
            update_queue_status(db, source_url, "failed_gen")
            return False

        slug = slugify(article_data.title)
        if db.query(Post).filter(Post.id == slug).first():
            slug = f"{slug}-{str(uuid.uuid4())[:8]}"

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
            published_at=datetime.now(timezone.utc)
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

    async def process_item_with_semaphore(self, db, item: NewsQueue):
        """Wraps process_item with a semaphore to control concurrency."""
        async with self.semaphore:
            result = await self.process_item(db, item)
            # Small delay between items to be polite and avoid rate limits
            await asyncio.sleep(2)
            return result

    async def run_cycle(self):
        logger.info("NewsBot engine loop initiated: Stage 1 - Gathering tracking feeds...")

        db = SessionLocal()
        try:
            # Step 0: Cleanup old items
            cleanup_old_queue_items(db, hours=24)
            cleanup_recent_cache(db, hours=2)

            all_items = []
            for category, url in FEEDS.items():
                items = await self.fetch_rss_items(category, url)
                all_items.extend(items[:5])

            logger.info("Syncing discovered items into the staging database queue...")
            self.save_to_queue(db, all_items)

            pending = get_pending_from_queue(db)
            if pending:
                logger.info(f"🚀 Stage 2 - Initiating concurrent extraction for {len(pending)} articles...")
                
                # Use asyncio.gather to process items concurrently
                tasks = [self.process_item_with_semaphore(db, item) for item in pending]
                results = await asyncio.gather(*tasks)
                
                success_count = sum(1 for r in results if r)
                logger.info(f"✨ Successfully finished processing {success_count}/{len(pending)} items.")
            else:
                logger.info("ℹ️ No pending news items to process in this cycle.")

            # Step 3: Update personalized recommendations once per day at 2 AM IST (20:30 UTC)
            now_utc = datetime.now(timezone.utc)
            # We run it if the hour is 20 (UTC) which is 1:30 AM - 2:30 AM IST
            if now_utc.hour == 20:
                logger.info("🚀 Stage 3 - Scheduled Time (2 AM IST): Updating personalized recommendations...")
                rec_service = RecommendationService(db)
                rec_service.update_all_recommendations()
            else:
                logger.info(f"ℹ️ Skipping Stage 3 - Current time {now_utc.strftime('%H:%M')} UTC is not the scheduled 20:30 UTC (2 AM IST).")
            
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
            logger.info("Sleeping for 1 hour...")
            await asyncio.sleep(3600)
    except asyncio.CancelledError:
        logger.info("NewsBot engine routine safely interrupted.")
    finally:
        await bot.close()
