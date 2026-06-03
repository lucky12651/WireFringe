import logging
from typing import List, Dict
import xml.etree.ElementTree as ET

import httpx

logger = logging.getLogger(__name__)


async def fetch_rss_items(category: str, url: str, http_client: httpx.AsyncClient) -> List[Dict[str, str]]:
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

        for item in found_elements:
            title_el = item.find("title")
            link_el = item.find("link")

            title = title_el.text if title_el is not None else "No Title"
            link = link_el.text if link_el is not None else ""

            if not link:
                guid_el = item.find("guid")
                if guid_el is not None and guid_el.text and guid_el.text.startswith("http"):
                    link = guid_el.text

            if link:
                items.append({
                    "title": title.strip(),
                    "link": link.strip(),
                    "category": category
                })
        return items
    except Exception as e:
        logger.error(f"Error fetching RSS for {category}: {e}")
        return []
