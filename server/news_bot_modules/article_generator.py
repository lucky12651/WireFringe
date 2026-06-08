import logging
import re
from typing import Optional

from .constants import CATEGORY_IMAGES
from .ai_client import groq_client
from ..schemas import PostUpsert

logger = logging.getLogger(__name__)

# Pre-compiled regex patterns for performance and accuracy
IMAGE_URL_PATTERN = re.compile(r'https?://\S+\.(?:jpg|jpeg|png|webp|gif|svg)(?:\?\S+)?', re.IGNORECASE)
TWITTER_URL_PATTERN = re.compile(r'https?://(?:www\.)?(?:twitter\.com|x\.com)/[A-Za-z0-9_]+/status/\d+\S*', re.IGNORECASE)
TWITTER_PIC_PATTERN = re.compile(r'pic\.twitter\.com/\S+|https?://pbs\.twimg\.com/\S+', re.IGNORECASE)
CAPTION_PATTERN = re.compile(r'^(Photo|Image|Source|Credit|Courtesy):\s+.*', re.IGNORECASE)

def format_to_wp_blocks(raw_content: str) -> str:
    """
    Script-based formatter that converts raw text into WordPress Gutenberg blocks.
    Accurately isolates Twitter statuses, handles standalone media URLs, and formats cleanly.
    """
    if not raw_content:
        return ""

    # 1. Pre-processing: Strip common syndicated noise and marketing fluff
    noise_patterns = [
        r'Read Time:.*?\d+ mins',
        r'Share Twitter WhatsApp Facebook Reddit Email',
        r'Essential Business Intelligence, Continuous LIVE TV.*',
        r'\(Except for the headline, this story has not been edited by NDTV staff.*\)',
        r'Featured Video Of The Day.*',
        r'Topics mentioned in this article.*',
        r'Get the Latest Cricket Updates.*',
        r'Like Us On Facebook Or Follow Us On Twitter.*',
        r'You Can Also Download The NDTV Cricket App.*',
        r'Also Read:.*',
        r'Follow us on.*',
        r'Click here for.*',
        r'Subscribe to.*'
    ]
    for pattern in noise_patterns:
        raw_content = re.sub(pattern, '', raw_content, flags=re.IGNORECASE | re.DOTALL)

    # 2. Extract Twitter media handles before line splitting so they don't corrupt content
    # Gutenberg native embeds break if you feed them the raw pic.twitter link instead of the status link
    raw_content = re.sub(TWITTER_PIC_PATTERN, '', raw_content)

    lines = [line.strip() for line in raw_content.split('\n')]
    
    blocks = []
    current_paragraph = []
    list_items = []
    in_list = False

    def flush_paragraph():
        nonlocal current_paragraph
        if current_paragraph:
            text = " ".join(current_paragraph).strip()
            if text:
                # Entity bolding (2+ capitalized words)
                text = re.sub(r'\b([A-Z][a-z]+Scope(?:\s+[A-Z][a-z]+)+)\b', r'<strong>\1</strong>', text)
                
                # HTML Escaping safely
                safe_text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                safe_text = safe_text.replace('&lt;strong&gt;', '<strong>').replace('&lt;/strong&gt;', '</strong>')
                
                blocks.append(f'\n<p>{safe_text}</p>\n')
            current_paragraph = []

    def flush_list():
        nonlocal in_list, list_items
        if in_list and list_items:
            items_html = "".join([f"<li>{item}</li>" for item in list_items])
            blocks.append(f'\n<ul>{items_html}</ul>\n')
            list_items = []
            in_list = False

    for line in lines:
        if not line:
            flush_paragraph()
            flush_list()
            continue

        # Handle Twitter/X Standalone Status URL Embeds
        twitter_match = TWITTER_URL_PATTERN.search(line)
        if twitter_match:
            flush_paragraph()
            flush_list()
            tweet_url = twitter_match.group(0)
            blocks.append(
                f'\n'
                f'<figure class="wp-block-embed is-provider-twitter wp-block-embed-twitter"><div class="wp-block-embed__wrapper">\n'
                f'{tweet_url}\n'
                f'</div></figure>\n'
            )
            continue

        # Handle direct image URLs (with or without query strings like CDN parameters)
        img_match = IMAGE_URL_PATTERN.search(line)
        if img_match:
            flush_paragraph()
            flush_list()
            img_url = img_match.group(0)
            blocks.append(f'\n<figure class="wp-block-image size-full"><img src="{img_url}" alt="Article Image"/></figure>\n')
            continue

        # Handle image captions (e.g., "Photo: PTI")
        if CAPTION_PATTERN.match(line) or (len(line) < 60 and line.startswith(('Photo', 'Image', 'Source'))):
            flush_paragraph()
            flush_list()
            blocks.append(f'\n<p style="font-size:12px; opacity:0.7; font-style:italic; text-align:center">{line}</p>\n')
            continue

        # Check for list items
        list_match = re.match(r'^[\-\+\•]\s+(.*)', line)
        if list_match:
            flush_paragraph()
            if not in_list:
                in_list = True
            list_items.append(list_match.group(1).strip())
            continue
        
        if in_list:
            flush_list()

        # Robust heading heuristic
        is_heading = (
            len(line) < 100 and 
            not line.endswith(('.', '!', '?', ';', '"', ')')) and
            not line.startswith(('http://', 'https://'))
        )

        if is_heading:
            flush_paragraph()
            blocks.append(f'\n<h2 class="wp-block-heading">{line}</h2>\n')
        else:
            current_paragraph.append(line)

    # Final flushes
    flush_paragraph()
    flush_list()
            
    return "\n\n".join(blocks)


async def generate_article(
    raw_content: str, 
    source_url: str, 
    category: str, 
    fallback_title: str, 
    scraped_img: Optional[str] = None, 
    parsed_title: Optional[str] = None,
    **kwargs
) -> Optional[PostUpsert]:
    """
    Assembles article object by directly processing raw content with structural metadata.
    Uses Groq AI with a strict system instruction to structure media blocks cleanly.
    """
    og_img = scraped_img or CATEGORY_IMAGES.get(category)
    final_title = parsed_title if (parsed_title and len(parsed_title) > 5) else fallback_title
    final_title = re.split(r' - \w+', final_title)[0].strip()

    try:
        logger.info(f"Generating article for {source_url} using Groq AI paraphrasing.")
        
        system_prompt = (
            "You are a professional news editor. Paraphrase the provided text into original, neutral journalistic copy while preserving chronological facts.\n\n"
            "CRITICAL FORMATTING INSTRUCTIONS:\n"
            "1. Output the text using WordPress Gutenberg block comments (, , ).\n"
            "2. If you see a Twitter/X link (e.g., twitter.com/user/status/123), extract the URL and output it EXACTLY inside this block format:\n"
            "   \\n<figure class=\"wp-block-embed is-provider-twitter wp-block-embed-twitter\"><div class=\"wp-block-embed__wrapper\">\\nURL\\n</div></figure>\\n\n"
            "3. Clean up raw image references. If an image asset URL is provided inline, map it inside an block.\n"
            "4. Strip out trailing image wrappers or raw 'pic.twitter.com' strings that don't represent standard user paths.\n"
            "5. Strip all syndicated news noise, share icons, and read time estimates.\n"
            "6. Output ONLY raw blocks. No introductions, conversational pleasantries, or wrapping backticks."
        )
        
        paraphrased_content = await groq_client.generate_content(raw_content, system_prompt)
        
        if paraphrased_content == "ERROR_429":
            logger.warning(f"Groq Rate Limit hit for {source_url}. Falling back to manual scripted formatting.")
            content = format_to_wp_blocks(raw_content)
        elif paraphrased_content:
            logger.info(f"Successfully paraphrased article for {source_url} using Groq.")
            # If AI already provided blocks, use them directly; otherwise, fallback to scripted formatting
            if "<!-- wp:" in paraphrased_content:
                content = paraphrased_content
            else:
                content = format_to_wp_blocks(paraphrased_content)
        else:
            logger.warning(f"Groq paraphrasing failed for {source_url}. Falling back to raw content.")
            content = format_to_wp_blocks(raw_content)
        
        # Add source attribution footer
        footer = f"\n\n<!-- wp:paragraph -->\n<p>\nSource context derived from original reporting via <a href=\"{source_url}\">Google News Search</a>.</p>\n<!-- /wp:paragraph -->"
        content += footer

        # Generate cleaner text excerpt
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