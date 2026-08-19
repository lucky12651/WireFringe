"""Editor-facing bot catalog: countries, site sections, and preset RSS feeds."""

from __future__ import annotations

COUNTRIES = [
    {"id": "india", "label": "India"},
    {"id": "us", "label": "United States"},
    {"id": "uk", "label": "United Kingdom"},
    {"id": "world", "label": "World"},
]

SECTIONS = [
    "Tech",
    "AI & Future Tech",
    "Business & Markets",
    "Personal Finance",
    "India News",
    "Sports",
    "World",
]

DEFAULT_WRITER_PROMPT = (
    "You are a professional news editor for Wirefringe. Rewrite the source into original, "
    "neutral journalistic English. Keep names, numbers, dates, and quotes accurate. "
    "Do not invent facts. Write for a global reader; explain local terms briefly. "
    "Prefer a clean news-desk voice, not marketing copy."
)

DEFAULT_FOCUS_NOTE = ""

# Preset RSS. enabled=True are the current India desk plus a few global sources.
FEED_CATALOG: list[dict] = [
    # India (current engine)
    {"id": "in-tech-ie", "country": "india", "section": "Tech", "label": "Indian Express Gadgets", "url": "https://indianexpress.com/section/technology/gadgets/feed/", "enabled": True},
    {"id": "in-ai-ndtv", "country": "india", "section": "AI & Future Tech", "label": "NDTV Gadgets", "url": "https://feeds.feedburner.com/ndtvgadgets-latest", "enabled": True},
    {"id": "in-tech-ht", "country": "india", "section": "Tech", "label": "Hindustan Times Tech", "url": "https://www.hindustantimes.com/feeds/rss/technology/rssfeed.xml", "enabled": True},
    {"id": "in-sports-ndtv", "country": "india", "section": "Sports", "label": "NDTV Sports", "url": "https://feeds.feedburner.com/ndtvsports-latest", "enabled": True},
    {"id": "in-world-ie", "country": "india", "section": "World", "label": "Indian Express World", "url": "https://indianexpress.com/section/world/feed/", "enabled": True},
    {"id": "in-india-ht", "country": "india", "section": "India News", "label": "Hindustan Times India", "url": "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml", "enabled": True},
    {"id": "in-biz-ie", "country": "india", "section": "Business & Markets", "label": "Indian Express Economy", "url": "https://indianexpress.com/section/business/economy/feed/", "enabled": True},
    {"id": "in-biz-ndtv", "country": "india", "section": "Business & Markets", "label": "NDTV Profit", "url": "https://feeds.feedburner.com/ndtvprofit-latest", "enabled": True},
    {"id": "in-pf-mint", "country": "india", "section": "Personal Finance", "label": "LiveMint Money", "url": "https://www.livemint.com/rss/money", "enabled": True},
    # United States
    {"id": "us-tech-verge", "country": "us", "section": "Tech", "label": "The Verge", "url": "https://www.theverge.com/rss/index.xml", "enabled": True},
    {"id": "us-tech-ars", "country": "us", "section": "Tech", "label": "Ars Technica", "url": "https://feeds.arstechnica.com/arstechnica/index", "enabled": False},
    {"id": "us-ai-verge", "country": "us", "section": "AI & Future Tech", "label": "The Verge AI", "url": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", "enabled": True},
    {"id": "us-world-nyt", "country": "us", "section": "World", "label": "NYT World", "url": "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", "enabled": False},
    {"id": "us-biz-nyt", "country": "us", "section": "Business & Markets", "label": "NYT Business", "url": "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", "enabled": False},
    # United Kingdom
    {"id": "uk-tech-bbc", "country": "uk", "section": "Tech", "label": "BBC Technology", "url": "https://feeds.bbci.co.uk/news/technology/rss.xml", "enabled": True},
    {"id": "uk-world-bbc", "country": "uk", "section": "World", "label": "BBC World", "url": "https://feeds.bbci.co.uk/news/world/rss.xml", "enabled": True},
    {"id": "uk-biz-bbc", "country": "uk", "section": "Business & Markets", "label": "BBC Business", "url": "https://feeds.bbci.co.uk/news/business/rss.xml", "enabled": False},
    {"id": "uk-sport-bbc", "country": "uk", "section": "Sports", "label": "BBC Sport", "url": "https://feeds.bbci.co.uk/sport/rss.xml", "enabled": False},
    # World
    {"id": "wd-all-aja", "country": "world", "section": "World", "label": "Al Jazeera", "url": "https://www.aljazeera.com/xml/rss/all.xml", "enabled": True},
    {"id": "wd-tech-wired", "country": "world", "section": "Tech", "label": "Wired", "url": "https://www.wired.com/feed/rss", "enabled": False},
]


def merge_feed_catalog(saved: list | None) -> list[dict]:
    saved_list = [f for f in (saved or []) if isinstance(f, dict) and f.get("id")]
    by_id = {str(f["id"]): f for f in saved_list}
    out: list[dict] = []
    for preset in FEED_CATALOG:
        cur = by_id.pop(preset["id"], None)
        row = dict(preset)
        if cur:
            if "enabled" in cur:
                row["enabled"] = bool(cur.get("enabled"))
            if str(cur.get("url") or "").strip():
                row["url"] = str(cur["url"]).strip()
            if str(cur.get("label") or "").strip():
                row["label"] = str(cur["label"]).strip()
            if str(cur.get("section") or "").strip() in SECTIONS:
                row["section"] = str(cur["section"]).strip()
        out.append(row)
    for extra in by_id.values():
        url = str(extra.get("url") or "").strip()
        if not url.startswith("http"):
            continue
        out.append(
            {
                "id": str(extra.get("id")),
                "country": str(extra.get("country") or "world").strip() or "world",
                "section": extra.get("section") if extra.get("section") in SECTIONS else "World",
                "label": str(extra.get("label") or "Custom feed").strip()[:80],
                "url": url,
                "enabled": bool(extra.get("enabled", True)),
            }
        )
    return out


def active_feeds(bot_cfg: dict) -> list[dict]:
    countries = {str(c).strip().lower() for c in (bot_cfg.get("countries") or [])}
    sections = {str(s).strip() for s in (bot_cfg.get("sections") or [])}
    feeds = merge_feed_catalog(bot_cfg.get("feeds"))
    out = []
    for feed in feeds:
        if not feed.get("enabled"):
            continue
        if countries and feed.get("country") not in countries:
            continue
        if sections and feed.get("section") not in sections:
            continue
        if not str(feed.get("url") or "").startswith("http"):
            continue
        out.append(feed)
    return out
