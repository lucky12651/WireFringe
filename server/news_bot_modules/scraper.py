import logging
from typing import Tuple, Optional

import newspaper
from bs4 import BeautifulSoup
import httpx

from .utils import extract_clean_url

logger = logging.getLogger(__name__)


async def scrape_article(url: str, http_client: httpx.AsyncClient) -> Tuple[Optional[str], Optional[str], Optional[str], str]:
    """
    Fetch article content using newspaper4k.
    Returns (content, image, title, resolved_url)
    """
    import asyncio

    target_url = extract_clean_url(url)
    resolved_url = target_url

    try:
        logger.info(f"Attempting execution parse chain via newspaper4k: {target_url}")

        def fetch_article():
            art = newspaper.article(target_url)
            return {
                "text": art.text,
                "image": art.top_image,
                "title": art.title,
                "url": art.url
            }

        data = await asyncio.to_thread(fetch_article)
        cleaned_text = data.get("text", "").strip()
        og_img = data.get("image")
        scraped_title = data.get("title")
        resolved_url = data.get("url", target_url)

        if not cleaned_text or len(cleaned_text) < 400:
            logger.info(f"Content layer below validation index, deploying direct scraper fallback for: {resolved_url}")

            if "news.google.com" in resolved_url:
                logger.info("Resolving tracking destination head via HTTP client...")
                head_res = await http_client.head(resolved_url)
                if head_res.status_code in [301, 302, 307, 308] and "Location" in head_res.headers:
                    resolved_url = head_res.headers["Location"]

            response = await http_client.get(resolved_url)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")

            if not og_img:
                og_tag = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "og:image"})
                if og_tag:
                    og_img = og_tag.get("content")

            main_content = None
            for selector in ["article", "main", "[role='main']", ".post-content", ".article-content", ".entry-content"]:
                main_content = soup.select_one(selector)
                if main_content:
                    break

            search_target = main_content if main_content else soup
            for tag in search_target(["script", "style", "nav", "footer", "header", "aside", "form", "button", "iframe"]):
                tag.decompose()

            text = search_target.get_text(separator="\n")
            lines = [line.strip() for line in text.splitlines() if line.strip()]
            cleaned_text = "\n".join(lines)

        if len(cleaned_text) < 400:
            logger.warning(f"Skipping resource track: content below validation layout rules ({len(cleaned_text)} chars).")
            return None, None, None, resolved_url

        return cleaned_text, og_img, scraped_title, resolved_url
    except Exception as e:
        logger.error(f"Error executing extraction routine for content maps at target {target_url}: {e}")
        return None, None, None, resolved_url
