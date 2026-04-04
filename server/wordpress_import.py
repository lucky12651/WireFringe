from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET

from sqlalchemy.orm import Session

from .models import Post


WP_EXPORT_NS = "http://wordpress.org/export/1.2/"
DC_NS = "http://purl.org/dc/elements/1.1/"
CONTENT_NS = "http://purl.org/rss/1.0/modules/content/"


@dataclass(frozen=True)
class ParsedPost:
    id: str
    title: str
    link: str | None
    creator: str | None
    content: str
    excerpt: str
    bucket: str
    read_minutes: int | None
    og_img: str | None
    published_at: datetime | None


_TAG_RE = re.compile(r"<[^>]+>")


def strip_html(html: str) -> str:
    if not html:
        return ""
    return _TAG_RE.sub(" ", html).replace("\xa0", " ").strip()


def map_category_to_bucket(cat_text: str | None, nicename: str | None) -> str:
    s = (cat_text or nicename or "").lower()
    if not s:
        return "Tech"
    if "ai" in s or "artificial" in s:
        return "AI & Future Tech"
    if "crypto" in s or "bitcoin" in s:
        return "Business & Markets"
    if "business" in s or "markets" in s:
        return "Business & Markets"
    if "finance" in s or "insurance" in s or "tax" in s:
        return "Personal Finance"
    return "Tech"


def _parse_wp_datetime(value: str) -> datetime | None:
    value = (value or "").strip()
    if not value:
        return None
    try:
        # WordPress export: "YYYY-mm-dd HH:MM:SS" (assume UTC)
        dt = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
        return dt.replace(tzinfo=UTC)
    except ValueError:
        return None


def _parse_rss_pubdate(value: str) -> datetime | None:
    value = (value or "").strip()
    if not value:
        return None
    try:
        dt = parsedate_to_datetime(value)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)
        return dt
    except (TypeError, ValueError, OverflowError):
        return None


def _find_text(item: ET.Element, tag: str, ns: str | None = None) -> str:
    if ns:
        el = item.find(f".//{{{ns}}}{tag}")
    else:
        el = item.find(tag)
    if el is None or el.text is None:
        return ""
    return el.text.strip()


def _iter_postmeta(item: ET.Element) -> Iterable[tuple[str, str]]:
    for pm in item.iter():
        if not str(pm.tag).endswith("postmeta"):
            continue
        key = ""
        value = ""
        for child in list(pm):
            if str(child.tag).endswith("meta_key") and child.text:
                key = child.text.strip()
            elif str(child.tag).endswith("meta_value") and child.text:
                value = child.text.strip()
        if key:
            yield key, value


def _find_post_meta(item: ET.Element, meta_key: str) -> str | None:
    for k, v in _iter_postmeta(item):
        if k == meta_key:
            return v
    return None


def parse_wordpress_export(xml_path: Path) -> list[ParsedPost]:
    tree = ET.parse(xml_path)
    root = tree.getroot()

    items = list(root.iter("item"))
    posts: list[ParsedPost] = []

    for item in items:
        title = _find_text(item, "title")
        link = _find_text(item, "link") or None
        creator = _find_text(item, "creator", DC_NS) or "Coffee n Blog"
        encoded = _find_text(item, "encoded", CONTENT_NS)
        description = _find_text(item, "description")
        post_type = _find_text(item, "post_type", WP_EXPORT_NS) or "post"
        status = _find_text(item, "status", WP_EXPORT_NS) or "publish"
        post_date_raw = _find_text(item, "post_date", WP_EXPORT_NS)
        pub_date_raw = _find_text(item, "pubDate")

        guid = _find_text(item, "guid") or link or title
        if not guid:
            continue

        if post_type != "post" or status != "publish":
            continue

        categories = []
        for cat in item.findall("category"):
            categories.append(
                {
                    "domain": cat.attrib.get("domain", ""),
                    "nicename": cat.attrib.get("nicename", ""),
                    "text": (cat.text or "").strip(),
                }
            )
        main_category = next((c for c in categories if c["domain"] == "category"), None) or (
            categories[0] if categories else None
        )

        yoast_time = _find_post_meta(item, "yoast_wpseo_estimated-reading-time-minutes")
        read_minutes = None
        if yoast_time:
            try:
                read_minutes = int(yoast_time)
            except ValueError:
                read_minutes = None

        og_img = _find_post_meta(item, "yoast_wpseo_opengraph-image") or _find_post_meta(
            item, "_yoast_wpseo_opengraph-image"
        )

        published_at = _parse_wp_datetime(post_date_raw) or _parse_rss_pubdate(pub_date_raw)

        content = encoded or description or ""
        excerpt_src = description if len(description) > 20 else strip_html(content)
        excerpt = (excerpt_src[:180]).strip()

        bucket = map_category_to_bucket(
            main_category["text"] if main_category else None,
            main_category["nicename"] if main_category else None,
        )

        posts.append(
            ParsedPost(
                id=guid,
                title=title or "(untitled)",
                link=link,
                creator=creator,
                content=content,
                excerpt=excerpt,
                bucket=bucket,
                read_minutes=read_minutes,
                og_img=og_img,
                published_at=published_at,
            )
        )

    posts.sort(key=lambda p: p.published_at or datetime.min.replace(tzinfo=UTC), reverse=True)
    return posts


def import_wordpress_export(db: Session, xml_path: Path) -> int:
    posts = parse_wordpress_export(xml_path)
    imported = 0

    for p in posts:
        existing = db.get(Post, p.id)
        if existing is None:
            existing = Post(id=p.id, title=p.title, content=p.content)
            db.add(existing)
            imported += 1

        existing.title = p.title
        existing.link = p.link
        existing.creator = p.creator
        existing.content = p.content
        existing.excerpt = p.excerpt
        existing.bucket = p.bucket
        existing.read_minutes = p.read_minutes
        existing.og_img = p.og_img
        existing.published_at = p.published_at

    db.commit()
    return imported
