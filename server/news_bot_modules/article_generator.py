import logging
import re
from typing import Optional

from .constants import CATEGORY_IMAGES
from ..schemas import PostUpsert

logger = logging.getLogger(__name__)


def format_to_wp_blocks(raw_content: str) -> str:
    """
    Script-based formatter that converts raw text into WordPress Gutenberg blocks.
    Groups text into paragraphs and detects headings.
    """
    if not raw_content:
        return ""

    # Normalize newlines and split into potential blocks by double newlines
    # This preserves the paragraph structure from the original content
    raw_blocks = re.split(r'\n\s*\n', raw_content.strip())
    
    blocks = []
    for raw_block in raw_blocks:
        lines = [line.strip() for line in raw_block.split('\n') if line.strip()]
        if not lines:
            continue
            
        # If a block is just one short line, it might be a heading
        if len(lines) == 1:
            line = lines[0]
            # Heuristic for headings: 
            # - Short (less than 120 chars)
            # - Doesn't end with typical sentence punctuation
            # - Not a URL
            is_heading = (
                len(line) < 120 and 
                not line.endswith(('.', '!', '?', ':', ';', '"', ')')) and
                not line.startswith(('http://', 'https://'))
            )
            
            if is_heading:
                blocks.append(f'<!-- wp:heading -->\n<h2 class="wp-block-heading">{line}</h2>\n<!-- /wp:heading -->')
                continue

        # Otherwise, treat as a paragraph (join lines with space)
        full_text = " ".join(lines)
        # Escape basic HTML entities
        safe_text = full_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        blocks.append(f'<!-- wp:paragraph -->\n<p>{safe_text}</p>\n<!-- /wp:paragraph -->')
            
    return "\n\n".join(blocks)


async def generate_article(
    raw_content: str, 
    source_url: str, 
    category: str, 
    fallback_title: str, 
    scraped_img: Optional[str] = None, 
    parsed_title: Optional[str] = None,
    **kwargs  # Accept and ignore extra args like skip_ai
) -> Optional[PostUpsert]:
    """
    Assembles article object by directly processing raw content with structural metadata.
    Now entirely script-based with no AI dependency.
    """
    og_img = scraped_img or CATEGORY_IMAGES.get(category)
    final_title = parsed_title if (parsed_title and len(parsed_title) > 5) else fallback_title

    # Clean up title (remove source suffix like " - CNN")
    final_title = re.split(r' - \w+', final_title)[0].strip()

    try:
        logger.info(f"Generating article for {source_url} using scripted WordPress blocks.")
        
        # Scripted formatting instead of AI
        content = format_to_wp_blocks(raw_content)
        
        # Add source attribution footer
        footer = f"\n\n<!-- wp:paragraph -->\n<p>\nSource context derived from original reporting via <a href=\"{source_url}\">Google News Search</a>.</p>\n<!-- /wp:paragraph -->"
        content += footer

        # Generate excerpt from the first part of the content
        # Strip block markers for the excerpt
        plain_text = re.sub(r'<!--.*?-->', '', content)
        plain_text = re.sub(r'<[^>]+>', '', plain_text).strip()
        excerpt = plain_text[:220].rsplit(' ', 1)[0] + "..." if len(plain_text) > 220 else plain_text

        return PostUpsert(
            title=final_title,
            content=content,
            excerpt=excerpt,
            bucket=category,
            creator="Coffee N Blog",
            ogImg=og_img,
            readMinutes=max(1, len(raw_content.split()) // 220)
        )
    except Exception as e:
        logger.error(f"Error in scripted article generation for {source_url}: {e}")
        return None
