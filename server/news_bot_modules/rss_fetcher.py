import logging
from typing import List, Dict
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

import httpx

logger = logging.getLogger(__name__)


async def fetch_rss_items(
    category: str, url: str, http_client: httpx.AsyncClient, max_age_hours: int = 6
) -> List[Dict[str, str]]:
    """Fetch and parse RSS items with fallback link extraction."""
    try:
        response = await http_client.get(url)
        response.raise_for_status()
        root = ET.fromstring(response.content)

        ns = {
            'content': 'http://purl.org/rss/1.0/modules/content/',
            'media': 'http://search.yahoo.com/mrss/'
        }

        items = []
        found_elements = root.findall(".//item")
        logger.info(f"🔍 Found {len(found_elements)} raw XML items for category: {category}")

        now = datetime.now(timezone.utc)
        hours = max(1, min(int(max_age_hours or 6), 72))
        one_hour_ago = now - timedelta(hours=hours)

        for item in found_elements:
            # Check publication date - only take news under 1 hour old
            pub_date_el = item.find("pubDate")
            if pub_date_el is not None and pub_date_el.text:
                try:
                    pub_date = parsedate_to_datetime(pub_date_el.text)
                    if pub_date < one_hour_ago:
                        continue
                except Exception:
                    # If date parsing fails, we skip to be safe (strictly latest news)
                    continue
            else:
                # If no pubDate is present, we skip it as we can't verify it's "latest"
                continue

            title_el = item.find("title")
            link_el = item.find("link")

            title = title_el.text if title_el is not None else "No Title"
            link = link_el.text if link_el is not None else ""

            if not link:
                guid_el = item.find("guid")
                if guid_el is not None and guid_el.text and guid_el.text.startswith("http"):
                    link = guid_el.text

            if link:
                image = ""
                enc = item.find("enclosure")
                if enc is not None and "image" in (enc.get("type") or ""):
                    image = enc.get("url") or ""
                media = item.find("{http://search.yahoo.com/mrss/}content") or item.find(
                    "{http://search.yahoo.com/mrss/}thumbnail"
                )
                if media is not None:
                    image = image or media.get("url") or ""
                items.append({
                    "title": title.strip(),
                    "link": link.strip(),
                    "category": category,
                    "image": image.strip(),
                })
        return items
    except Exception as e:
        logger.error(f"Error fetching RSS for {category}: {e}")
        return []
