import logging
import re
from typing import Optional

from .constants import CATEGORY_IMAGES
from ..schemas import PostUpsert

logger = logging.getLogger(__name__)


async def generate_article(raw_content: str, source_url: str, category: str, fallback_title: str, scraped_img: Optional[str] = None, parsed_title: Optional[str] = None) -> Optional[PostUpsert]:
    """Assembles article object by directly processing raw content with structural metadata."""
    og_img = scraped_img or CATEGORY_IMAGES.get(category)
    final_title = parsed_title if (parsed_title and len(parsed_title) > 5) else fallback_title

    final_title = re.split(r' - \w+', final_title)[0].strip()

    try:
        content = raw_content.strip()
        content = re.sub(r'\n+', '\n\n', content)
        content += f"\n\n---\n*Source context derived from original reporting via [Google News Search]({source_url}).*"

        excerpt = content[:220].rsplit(' ', 1)[0] + "..." if len(content) > 220 else content

        return PostUpsert(
            title=final_title,
            content=content,
            excerpt=excerpt,
            bucket=category,
            creator="Coffee N Blog",
            ogImg=og_img,
            readMinutes=max(1, len(content.split()) // 220)
        )
    except Exception as e:
        logger.error(f"Error structuring content tracking models for reference {source_url}: {e}")
        return None
