import logging
from typing import List, Dict
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

import httpx

from .utils import is_unusable_story

logger = logging.getLogger(__name__)


def _local_tag(tag: str) -> str:
    if not isinstance(tag, str):
        return ""
    return tag.split("}", 1)[-1] if "}" in tag else tag


def _child(el, name: str):
    for child in list(el):
        if _local_tag(child.tag) == name:
            return child
    return None


def _children(el, name: str):
    return [c for c in list(el) if _local_tag(c.tag) == name]


def _text(el) -> str:
    if el is None:
        return ""
    return (el.text or "").strip()


def _parse_date(raw: str):
    raw = (raw or "").strip()
    if not raw:
        return None
    try:
        dt = parsedate_to_datetime(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        pass
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def _entry_link(el) -> str:
    for link_el in _children(el, "link"):
        href = (link_el.get("href") or _text(link_el)).strip()
        rel = (link_el.get("rel") or "alternate").lower()
        if href.startswith("http") and rel in ("alternate", ""):
            return href
    for link_el in _children(el, "link"):
        href = (link_el.get("href") or _text(link_el)).strip()
        if href.startswith("http"):
            return href
    guid = _text(_child(el, "guid") or _child(el, "id"))
    return guid if guid.startswith("http") else ""


def _entry_image(el) -> str:
    enc = _child(el, "enclosure")
    if enc is not None and "image" in (enc.get("type") or ""):
        return (enc.get("url") or "").strip()
    for child in list(el):
        if _local_tag(child.tag) in ("content", "thumbnail") and child.get("url"):
            typ = (child.get("type") or "").lower()
            if not typ or "image" in typ:
                return (child.get("url") or "").strip()
    return ""


def _entry_date(el):
    for name in ("pubDate", "published", "updated", "date"):
        dt = _parse_date(_text(_child(el, name)))
        if dt:
            return dt
    return None


async def fetch_rss_items(
    category: str, url: str, http_client: httpx.AsyncClient, max_age_hours: int = 6
) -> List[Dict[str, str]]:
    """Fetch RSS 2.0 and Atom feeds. Verge/similar Atom feeds have <entry>, not <item>."""
    try:
        response = await http_client.get(url)
        response.raise_for_status()
        root = ET.fromstring(response.content)

        entries = [el for el in root.iter() if _local_tag(el.tag) in ("item", "entry")]
        logger.info(f"🔍 Found {len(entries)} raw XML items for category: {category}")

        now = datetime.now(timezone.utc)
        hours = max(1, min(int(max_age_hours or 6), 72))
        cutoff = now - timedelta(hours=hours)

        items = []
        for el in entries:
            pub_date = _entry_date(el)
            if pub_date is None or pub_date < cutoff:
                continue

            title = _text(_child(el, "title")) or "No Title"
            link = _entry_link(el)
            if not link:
                continue
            if is_unusable_story(title, link):
                continue
            items.append({
                "title": title.strip(),
                "link": link.strip(),
                "category": category,
                "source_category": _text(_child(el, "category")),
                "image": _entry_image(el),
            })
        return items
    except Exception as e:
        logger.error(f"Error fetching RSS for {category}: {e}")
        return []
