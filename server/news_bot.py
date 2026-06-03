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
from .news_bot_modules.queue_ops import save_to_queue, get_pending_from_queue, update_queue_status, is_duplicate
from .news_bot_modules.scraper import scrape_article
from .news_bot_modules.article_generator import generate_article

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
            }
        )

    async def trigger_revalidation(self):
        try:
            revalidate_url = f"{settings.ui_url}/api/revalidate"
            await self.http_client.post(revalidate_url, json={"secret": settings.revalidate_secret}, timeout=5.0)
        except Exception as e:
            logger.error(f"Error triggering UI frontend route revalidation: {e}")

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

        article_data = await generate_article(raw_content, source_url, category, item.title, scraped_img, parsed_title)
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
            published_at=datetime.now(timezone.utc)
        )

        try:
            db.add(new_post)
            db.commit()
            logger.info(f"🚀 INSTANTLY PUBLISHED: {article_data.title}")
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
            all_items = []
            for category, url in FEEDS.items():
                items = await fetch_rss_items(category, url, self.http_client)
                all_items.extend(items[:5])

            logger.info("Syncing discovered items into the staging database queue...")
            save_to_queue(db, all_items)

            pending = get_pending_from_queue(db)
            if pending:
                logger.info(f"🚀 Stage 2 - Initiating extraction for {len(pending)} articles via newspaper4k...")
                for idx, item in enumerate(pending, 1):
                    logger.info(f"📦 [{idx}/{len(pending)}] Extracting clean story context: {item.title}")
                    await self.process_item(db, item)
                    await asyncio.sleep(10)
                logger.info(f"✨ Successfully finished processing all {len(pending)} items.")
            else:
                logger.info("ℹ️ No pending news items to process in this cycle.")
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
