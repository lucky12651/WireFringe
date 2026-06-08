import logging
import re
from typing import Optional

from .constants import CATEGORY_IMAGES
from ..schemas import PostUpsert

logger = logging.getLogger(__name__)


def format_to_wp_blocks(raw_content: str) -> str:
    """
    Script-based formatter that converts raw text into WordPress Gutenberg blocks.
    Groups text into paragraphs, detects headings, and handles basic lists.
    """
    if not raw_content:
        return ""

    # Normalize newlines and split into potential blocks by double or more newlines
    raw_blocks = re.split(r'\n\s*\n+', raw_content.strip())
    
    blocks = []
    in_list = False
    list_items = []

    def flush_list():
        nonlocal in_list, list_items
        if in_list and list_items:
            items_html = "".join([f"<li>{item}</li>" for item in list_items])
            blocks.append(f'<!-- wp:list -->\n<ul>{items_html}</ul>\n<!-- /wp:list -->')
            list_items = []
            in_list = False

    for raw_block in raw_blocks:
        lines = [line.strip() for line in raw_block.split('\n') if line.strip()]
        if not lines:
            continue
            
        # Check for list items (starting with -, *, or bullet)
        first_line = lines[0]
        if re.match(r'^[\-\*\•]\s+', first_line):
            if not in_list:
                in_list = True
            # Extract text after the bullet for each line in this block if they all look like list items
            for line in lines:
                clean_item = re.sub(r'^[\-\*\•]\s+', '', line).strip()
                if clean_item:
                    list_items.append(clean_item)
            continue
        
        # If we reach here, we are not in a list block anymore
        flush_list()

        # If a block is just one short line, it might be a heading
        if len(lines) == 1:
            line = lines[0]
            # Heuristic for headings: 
            # - Short (less than 100 chars)
            # - Doesn't end with typical sentence punctuation (except colon)
            # - Not a URL
            is_heading = (
                len(line) < 100 and 
                not line.endswith(('.', '!', '?', ';', '"', ')')) and
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
    
    # Final flush in case content ends with a list
    flush_list()
            
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
            readMinutes=max(1, len(raw_content.split()) // 200)
        )
    except Exception as e:
        logger.error(f"Error in scripted article generation for {source_url}: {e}")
        return None
