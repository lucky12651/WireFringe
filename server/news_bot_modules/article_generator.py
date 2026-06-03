import logging
import re
from typing import Optional

from .constants import CATEGORY_IMAGES
from ..schemas import PostUpsert
from .ai_client import groq_client

logger = logging.getLogger(__name__)


async def generate_article(raw_content: str, source_url: str, category: str, fallback_title: str, scraped_img: Optional[str] = None, parsed_title: Optional[str] = None) -> Optional[PostUpsert]:
    """Assembles article object by directly processing raw content with structural metadata."""
    og_img = scraped_img or CATEGORY_IMAGES.get(category)
    final_title = parsed_title if (parsed_title and len(parsed_title) > 5) else fallback_title

    final_title = re.split(r' - \w+', final_title)[0].strip()

    try:
        # AI Rewrite with Groq using WordPress Gutenberg Block formatting
        system_prompt = (
            "You are a professional blog writer and editor specializing in WordPress content. "
            "Your task is to rewrite news articles into engaging, well-formatted blog posts using WordPress Gutenberg block markers. "
            "IMPORTANT: Follow this exact formatting style for every block:\n"
            "1. Paragraphs: Wrap them in <!-- wp:paragraph -->\\n<p>Content</p>\\n<!-- /wp:paragraph -->\n"
            "2. Headings (H2): Wrap them in <!-- wp:heading -->\\n<h2 class=\"wp-block-heading\" id=\"h-unique-id\">Text</h2>\\n<!-- /wp:heading -->\n"
            "3. Headings (H3): Wrap them in <!-- wp:heading {\"level\":3} -->\\n<h3 class=\"wp-block-heading\" id=\"h-unique-id\">Text</h3>\\n<!-- /wp:heading -->\n"
            "4. Lists: Use <!-- wp:list -->\\n<ul class=\"wp-block-list\">...</ul>\\n<!-- /wp:list --> with <li> items.\n"
            "5. Bold: Use <strong> tag.\n"
            "6. Links: Use <a href=\"...\">Text</a> tag.\n"
            "7. Do NOT include standard Markdown (# or ##). Only use the HTML tags and block comments described above.\n"
            "8. Do NOT include the title in the body.\n"
            "9. Maintain an informative yet conversational tone and improve the flow."
        )
        
        user_prompt = f"Category: {category}\n\nOriginal Content:\n{raw_content[:8000]}"
        
        ai_content = await groq_client.generate_content(user_prompt, system_prompt)
        
        if ai_content:
            content = ai_content.strip()
        else:
            # Fallback to original content if AI fails
            logger.warning(f"AI generation failed for {source_url}, falling back to raw content.")
            content = raw_content.strip()
            content = re.sub(r'\n+', '\n\n', content)
 
        footer = f"\n\n<!-- wp:paragraph -->\n<p>---\n*Source context derived from original reporting via <a href=\"{source_url}\">Google News Search</a>.*</p>\n<!-- /wp:paragraph -->"
        content += footer

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
