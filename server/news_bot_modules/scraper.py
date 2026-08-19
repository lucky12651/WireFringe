import logging
from typing import Tuple, Optional

import newspaper
from bs4 import BeautifulSoup
import httpx

from .utils import extract_clean_url, clean_url

logger = logging.getLogger(__name__)


async def scrape_article(
    url: str, http_client: httpx.AsyncClient
) -> Tuple[Optional[str], Optional[str], Optional[str], str, list]:
    """
    Fetch article content using newspaper4k.
    Returns (content, image, title, resolved_url)
    """
    import asyncio

    # Clean the URL (remove trackers, fragments) and then extract from Google News if necessary
    target_url = clean_url(url)
    target_url = extract_clean_url(target_url)
    resolved_url = target_url

    # Configure newspaper to use a real browser User-Agent to avoid 403 Forbidden errors
    config = newspaper.Config()
    config.browser_user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    config.request_timeout = 25
    # Add more headers to the config if possible (newspaper4k config might be limited)
    config.headers = {
        "User-Agent": config.browser_user_agent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
    }

    try:
        logger.info(f"Attempting execution parse chain via newspaper4k: {target_url}")

        def fetch_article():
            try:
                # Pass config to newspaper.article
                art = newspaper.article(target_url, config=config)
                # Need to call download() and parse() explicitly if using article() directly usually
                # but newspaper4k's article() might be a wrapper. 
                # Let's use the standard pattern to be safe.
                art.download()
                art.parse()
                return {
                    "text": art.text,
                    "image": art.top_image,
                    "title": art.title,
                    "url": art.url
                }
            except Exception as e:
                logger.error(f"Newspaper4k internal error for {target_url}: {e}")
                return {}

        data = await asyncio.to_thread(fetch_article)
        cleaned_text = data.get("text", "").strip()
        og_img = data.get("image")
        scraped_title = data.get("title")
        resolved_url = data.get("url", target_url)

        extra_images: list[str] = []
        from .image_ops import is_junk_image_url

        if og_img and is_junk_image_url(og_img):
            og_img = None
        need_html = (not cleaned_text or len(cleaned_text) < 400) or not og_img
        html = ""
        if need_html:
            if "news.google.com" in resolved_url:
                logger.info("Resolving tracking destination head via HTTP client...")
                head_res = await http_client.head(resolved_url)
                if head_res.status_code in [301, 302, 307, 308] and "Location" in head_res.headers:
                    resolved_url = head_res.headers["Location"]

            headers = {
                "Referer": "https://www.google.com/",
                "Upgrade-Insecure-Requests": "1",
            }
            response = await http_client.get(resolved_url, headers=headers)
            response.raise_for_status()
            html = response.text
            from .image_ops import collect_html_images

            extra_images = collect_html_images(html, resolved_url)
            if not og_img and extra_images:
                og_img = extra_images[0]

        if not cleaned_text or len(cleaned_text) < 400:
            logger.info(f"Content layer below validation index, deploying direct scraper fallback for: {resolved_url}")
            soup = BeautifulSoup(html or "", "html.parser")

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
            return None, None, None, resolved_url, extra_images

        return cleaned_text, og_img, scraped_title, resolved_url, extra_images
    except Exception as e:
        logger.error(f"Error executing extraction routine for content maps at target {target_url}: {e}")
        return None, None, None, resolved_url, []
