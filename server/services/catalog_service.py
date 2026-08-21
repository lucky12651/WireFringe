"""Central catalog: categories, site sections, and placements.

One JSON document in app_settings (key=site_catalog) is the source of truth
for header, homepage, sidebar, the post editor, and RSS destinations.
"""

from __future__ import annotations

import json
import logging
import re
import uuid
from typing import Any

from sqlalchemy.orm import Session

from ..models import Category, Post
from .settings_service import SettingsService

logger = logging.getLogger(__name__)

CATALOG_KEY = "site_catalog"

# Post.bucket values currently used on the live site (and bot).
DEFAULT_CATEGORIES: list[dict[str, Any]] = [
    {"id": "tech", "name": "Tech", "enabled": True, "sort": 10},
    {"id": "gadgets", "name": "Gadgets", "enabled": True, "sort": 20},
    {"id": "ai", "name": "AI & Future Tech", "enabled": True, "sort": 30},
    {"id": "business", "name": "Business & Markets", "enabled": True, "sort": 40},
    {"id": "finance", "name": "Personal Finance", "enabled": True, "sort": 50},
    {"id": "india", "name": "India News", "enabled": True, "sort": 60},
    {"id": "sports", "name": "Sports", "enabled": True, "sort": 70},
    {"id": "world", "name": "World", "enabled": True, "sort": 80},
]

# Mirrors the current homepage / header / sidebar. Admins can change these
# later without a deploy. `system` rows cannot be deleted.
DEFAULT_SECTIONS: list[dict[str, Any]] = [
    {
        "id": "hero",
        "name": "Hero",
        "subtitle": "Lead stories at the top of the homepage (programmed on Front page).",
        "kind": "hero",
        "enabled": True,
        "system": True,
        "showHome": True,
        "showHeader": False,
        "showSidebar": False,
        "homeOrder": 0,
        "headerOrder": 0,
        "sidebarOrder": 0,
        "categories": [],
        "maxPosts": 5,
        "pageSlug": None,
    },
    {
        "id": "ai-frontline",
        "name": "AI frontline",
        "subtitle": "Enterprise AI, cyber security, and the tools rewriting how we work.",
        "kind": "package",
        "enabled": True,
        "system": False,
        "showHome": True,
        "showHeader": False,
        "showSidebar": False,
        "homeOrder": 10,
        "headerOrder": 0,
        "sidebarOrder": 0,
        "categories": ["AI & Future Tech", "Future Tech", "Tech", "Technology"],
        "maxPosts": 4,
        "pageSlug": "ai",
    },
    {
        "id": "market-pulse",
        "name": "Market pulse",
        "subtitle": "Business moves, markets, and the strategy stories behind the numbers.",
        "kind": "package",
        "enabled": True,
        "system": False,
        "showHome": True,
        "showHeader": False,
        "showSidebar": False,
        "homeOrder": 20,
        "headerOrder": 0,
        "sidebarOrder": 0,
        "categories": ["Business & Markets", "Business"],
        "maxPosts": 4,
        "pageSlug": "business",
    },
    {
        "id": "most-popular",
        "name": "Most Popular",
        "subtitle": "Stories readers spend the most time with.",
        "kind": "most_popular",
        "enabled": True,
        "system": True,
        "showHome": True,
        "showHeader": False,
        "showSidebar": False,
        "homeOrder": 30,
        "headerOrder": 0,
        "sidebarOrder": 0,
        "categories": [],
        "maxPosts": 5,
        "pageSlug": None,
        "href": "/#most-popular",
    },
    {
        "id": "india-desk",
        "name": "India desk",
        "subtitle": "Politics, policy, and national headlines from across the country.",
        "kind": "package",
        "enabled": True,
        "system": False,
        "showHome": True,
        "showHeader": False,
        "showSidebar": False,
        "homeOrder": 40,
        "headerOrder": 0,
        "sidebarOrder": 0,
        "categories": ["India News"],
        "maxPosts": 4,
        "pageSlug": "india",
    },
    {
        "id": "wallet-watch",
        "name": "Wallet watch",
        "subtitle": "Personal finance, tax, gold, and money moves that hit home.",
        "kind": "package",
        "enabled": True,
        "system": False,
        "showHome": True,
        "showHeader": False,
        "showSidebar": False,
        "homeOrder": 50,
        "headerOrder": 0,
        "sidebarOrder": 0,
        "categories": ["Personal Finance", "Gadgets"],
        "maxPosts": 4,
        "pageSlug": "finance",
    },
    {
        "id": "latest-tech",
        "name": "Latest from Tech",
        "subtitle": "",
        "kind": "category_row",
        "enabled": True,
        "system": False,
        "showHome": True,
        "showHeader": False,
        "showSidebar": False,
        "homeOrder": 60,
        "headerOrder": 0,
        "sidebarOrder": 0,
        "categories": ["Tech"],
        "maxPosts": 4,
        "pageSlug": "tech",
        "href": "/?category=tech",
    },
    {
        "id": "latest-ai",
        "name": "Latest from AI & Future Tech",
        "subtitle": "",
        "kind": "category_row",
        "enabled": True,
        "system": False,
        "showHome": True,
        "showHeader": False,
        "showSidebar": False,
        "homeOrder": 70,
        "headerOrder": 0,
        "sidebarOrder": 0,
        "categories": ["AI & Future Tech"],
        "maxPosts": 4,
        "pageSlug": "ai",
        "href": "/?category=ai-future-tech",
    },
    {
        "id": "latest-biz",
        "name": "Latest from Business & Markets",
        "subtitle": "",
        "kind": "category_row",
        "enabled": True,
        "system": False,
        "showHome": True,
        "showHeader": False,
        "showSidebar": False,
        "homeOrder": 80,
        "headerOrder": 0,
        "sidebarOrder": 0,
        "categories": ["Business & Markets"],
        "maxPosts": 4,
        "pageSlug": "business",
        "href": "/?category=business-markets",
    },
    {
        "id": "latest-finance",
        "name": "Latest from Personal Finance",
        "subtitle": "",
        "kind": "category_row",
        "enabled": True,
        "system": False,
        "showHome": True,
        "showHeader": False,
        "showSidebar": False,
        "homeOrder": 90,
        "headerOrder": 0,
        "sidebarOrder": 0,
        "categories": ["Personal Finance"],
        "maxPosts": 4,
        "pageSlug": "finance",
        "href": "/?category=personal-finance",
    },
    {
        "id": "latest-india",
        "name": "Latest from India News",
        "subtitle": "",
        "kind": "category_row",
        "enabled": True,
        "system": False,
        "showHome": True,
        "showHeader": False,
        "showSidebar": False,
        "homeOrder": 100,
        "headerOrder": 0,
        "sidebarOrder": 0,
        "categories": ["India News"],
        "maxPosts": 4,
        "pageSlug": "india",
        "href": "/?category=india-news",
    },
    {
        "id": "latest-sports",
        "name": "Latest from Sports",
        "subtitle": "",
        "kind": "category_row",
        "enabled": True,
        "system": False,
        "showHome": True,
        "showHeader": False,
        "showSidebar": False,
        "homeOrder": 110,
        "headerOrder": 0,
        "sidebarOrder": 0,
        "categories": ["Sports"],
        "maxPosts": 4,
        "pageSlug": "sports",
        "href": "/?category=sports",
    },
    {
        "id": "nav-tech",
        "name": "Tech",
        "subtitle": "Section page and header link.",
        "kind": "page",
        "enabled": True,
        "system": False,
        "showHome": False,
        "showHeader": True,
        "showSidebar": True,
        "homeOrder": 0,
        "headerOrder": 10,
        "sidebarOrder": 10,
        "categories": ["Tech", "Gadgets"],
        "maxPosts": 40,
        "pageSlug": "tech",
    },
    {
        "id": "nav-ai",
        "name": "AI",
        "subtitle": "Section page and header link.",
        "kind": "page",
        "enabled": True,
        "system": False,
        "showHome": False,
        "showHeader": True,
        "showSidebar": True,
        "homeOrder": 0,
        "headerOrder": 20,
        "sidebarOrder": 20,
        "categories": ["AI & Future Tech"],
        "maxPosts": 40,
        "pageSlug": "ai",
    },
    {
        "id": "nav-business",
        "name": "Business",
        "subtitle": "Section page and header link.",
        "kind": "page",
        "enabled": True,
        "system": False,
        "showHome": False,
        "showHeader": True,
        "showSidebar": True,
        "homeOrder": 0,
        "headerOrder": 30,
        "sidebarOrder": 30,
        "categories": ["Business & Markets"],
        "maxPosts": 40,
        "pageSlug": "business",
    },
    {
        "id": "nav-finance",
        "name": "Finance",
        "subtitle": "Section page and header link.",
        "kind": "page",
        "enabled": True,
        "system": False,
        "showHome": False,
        "showHeader": True,
        "showSidebar": True,
        "homeOrder": 0,
        "headerOrder": 40,
        "sidebarOrder": 40,
        "categories": ["Personal Finance"],
        "maxPosts": 40,
        "pageSlug": "finance",
    },
    {
        "id": "nav-india",
        "name": "India",
        "subtitle": "Section page and header link.",
        "kind": "page",
        "enabled": True,
        "system": False,
        "showHome": False,
        "showHeader": True,
        "showSidebar": True,
        "homeOrder": 0,
        "headerOrder": 50,
        "sidebarOrder": 50,
        "categories": ["India News"],
        "maxPosts": 40,
        "pageSlug": "india",
    },
    {
        "id": "nav-sports",
        "name": "Sports",
        "subtitle": "Section page and header link.",
        "kind": "page",
        "enabled": True,
        "system": False,
        "showHome": False,
        "showHeader": True,
        "showSidebar": True,
        "homeOrder": 0,
        "headerOrder": 60,
        "sidebarOrder": 60,
        "categories": ["Sports"],
        "maxPosts": 40,
        "pageSlug": "sports",
    },
    {
        "id": "stream",
        "name": "Latest stream",
        "subtitle": "Right-rail latest / following feed.",
        "kind": "stream",
        "enabled": True,
        "system": True,
        "showHome": False,
        "showHeader": False,
        "showSidebar": True,
        "homeOrder": 0,
        "headerOrder": 0,
        "sidebarOrder": 0,
        "categories": [],
        "maxPosts": 20,
        "pageSlug": None,
    },
]

KINDS = ("package", "category_row", "most_popular", "hero", "page", "stream")


def slugify(value: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (value or "").lower()).strip("-")
    return s or str(uuid.uuid4())[:8]


def default_catalog() -> dict[str, Any]:
    return {
        "categories": [dict(c) for c in DEFAULT_CATEGORIES],
        "sections": [dict(s) for s in DEFAULT_SECTIONS],
    }


def _norm_category(raw: dict, index: int) -> dict[str, Any]:
    name = str(raw.get("name") or "").strip() or f"Category {index + 1}"
    cid = str(raw.get("id") or slugify(name))[:64]
    return {
        "id": cid,
        "name": name[:80],
        "enabled": bool(raw.get("enabled", True)),
        "sort": int(raw.get("sort") or (index + 1) * 10),
        "parentId": str(raw["parentId"]) if raw.get("parentId") else None,
    }


def _norm_section(raw: dict, index: int) -> dict[str, Any]:
    name = str(raw.get("name") or "").strip() or f"Section {index + 1}"
    sid = str(raw.get("id") or slugify(name))[:64]
    kind = str(raw.get("kind") or "package")
    if kind not in KINDS:
        kind = "package"
    cats = raw.get("categories") or []
    if not isinstance(cats, list):
        cats = []
    slug = raw.get("pageSlug")
    slug = slugify(str(slug)) if slug else None
    href = str(raw.get("href") or "").strip() or None
    if not href and slug:
        href = f"/section/{slug}"
    return {
        "id": sid,
        "name": name[:80],
        "subtitle": str(raw.get("subtitle") or "")[:200],
        "kind": kind,
        "enabled": bool(raw.get("enabled", True)),
        "system": bool(raw.get("system", False)),
        "showHome": bool(raw.get("showHome", False)),
        "showHeader": bool(raw.get("showHeader", False)),
        "showSidebar": bool(raw.get("showSidebar", False)),
        "homeOrder": int(raw.get("homeOrder") or 0),
        "headerOrder": int(raw.get("headerOrder") or 0),
        "sidebarOrder": int(raw.get("sidebarOrder") or 0),
        "categories": [str(c).strip() for c in cats if str(c).strip()][:20],
        "maxPosts": max(1, min(int(raw.get("maxPosts") or 4), 40)),
        "pageSlug": slug,
        "href": href,
    }


class CatalogService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = SettingsService(db)

    def get(self, *, seed: bool = True) -> dict[str, Any]:
        raw = self.settings._get_raw(CATALOG_KEY)
        if not raw:
            data = default_catalog()
            if seed:
                self.save(data)
            return data
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = {}
        if not isinstance(parsed, dict):
            parsed = {}
        cats = parsed.get("categories") or []
        secs = parsed.get("sections") or []
        if not cats:
            cats = default_catalog()["categories"]
        if not secs:
            secs = default_catalog()["sections"]
        return {
            "categories": [_norm_category(c, i) for i, c in enumerate(cats) if isinstance(c, dict)],
            "sections": [_norm_section(s, i) for i, s in enumerate(secs) if isinstance(s, dict)],
        }

    def save(self, payload: dict[str, Any]) -> dict[str, Any]:
        cats_in = payload.get("categories") if isinstance(payload.get("categories"), list) else []
        secs_in = payload.get("sections") if isinstance(payload.get("sections"), list) else []
        data = {
            "categories": [_norm_category(c, i) for i, c in enumerate(cats_in) if isinstance(c, dict)],
            "sections": [_norm_section(s, i) for i, s in enumerate(secs_in) if isinstance(s, dict)],
        }
        if not data["categories"]:
            data["categories"] = default_catalog()["categories"]
        if not data["sections"]:
            data["sections"] = default_catalog()["sections"]
        self.settings._set_raw(CATALOG_KEY, json.dumps(data, ensure_ascii=False))
        self._sync_category_table(data["categories"])
        return data

    def public(self) -> dict[str, Any]:
        data = self.get()
        cats = [c for c in data["categories"] if c.get("enabled")]
        secs = [s for s in data["sections"] if s.get("enabled")]
        return {"categories": cats, "sections": secs}

    def header_nav(self) -> list[dict[str, Any]]:
        secs = [s for s in self.public()["sections"] if s.get("showHeader")]
        secs.sort(key=lambda s: (s.get("headerOrder") or 0, s.get("name") or ""))
        return [
            {
                "id": s["id"],
                "label": s["name"],
                "href": s.get("href") or (f"/section/{s['pageSlug']}" if s.get("pageSlug") else "/"),
            }
            for s in secs
        ]

    def sidebar_nav(self) -> list[dict[str, Any]]:
        secs = [
            s
            for s in self.public()["sections"]
            if s.get("showSidebar") and s.get("kind") != "stream"
        ]
        secs.sort(key=lambda s: (s.get("sidebarOrder") or 0, s.get("name") or ""))
        return [
            {
                "id": s["id"],
                "label": s["name"],
                "href": s.get("href") or (f"/section/{s['pageSlug']}" if s.get("pageSlug") else "/"),
            }
            for s in secs
        ]

    def home_sections(self) -> list[dict[str, Any]]:
        secs = [
            s
            for s in self.public()["sections"]
            if s.get("showHome") and s.get("kind") not in ("page", "stream")
        ]
        secs.sort(key=lambda s: (s.get("homeOrder") or 0, s.get("name") or ""))
        return secs

    def section_buckets(self) -> dict[str, list[str]]:
        """slug -> category names for /section/[slug] pages."""
        out: dict[str, list[str]] = {}
        for s in self.public()["sections"]:
            slug = s.get("pageSlug")
            if not slug:
                continue
            out.setdefault(slug, [])
            for name in s.get("categories") or []:
                if name not in out[slug]:
                    out[slug].append(name)
        return out

    def category_names(self) -> list[str]:
        names = [c["name"] for c in self.get()["categories"] if c.get("enabled")]
        return names or [c["name"] for c in DEFAULT_CATEGORIES]

    def _sync_category_table(self, categories: list[dict]) -> None:
        existing = { (c.name or "").strip() for c in self.db.query(Category).all() }
        for row in categories:
            name = (row.get("name") or "").strip()
            if name and name not in existing:
                self.db.add(Category(name=name))
                existing.add(name)
        self.db.commit()

    def resolve_section_posts(self, section: dict, posts: list[Post]) -> list[Post]:
        """Pick posts for a home/section block: featured first, then matching buckets."""
        cats = {str(c).strip() for c in (section.get("categories") or []) if str(c).strip()}
        sid = section.get("id")
        featured: list[Post] = []
        rest: list[Post] = []
        for p in posts:
            extra = _json_list(getattr(p, "extra_categories", None))
            buckets = {str(p.bucket or "").strip(), *extra}
            featured_in = _json_list(getattr(p, "featured_in", None))
            if sid and sid in featured_in:
                featured.append(p)
                continue
            if cats and buckets.intersection(cats):
                rest.append(p)
            elif not cats:
                rest.append(p)
        limit = int(section.get("maxPosts") or 4)
        ordered = featured + rest
        # de-dupe by id
        seen = set()
        out = []
        for p in ordered:
            if p.id in seen:
                continue
            seen.add(p.id)
            out.append(p)
            if len(out) >= limit:
                break
        return out


def _json_list(raw: Any) -> list[str]:
    if not raw:
        return []
    if isinstance(raw, list):
        return [str(x).strip() for x in raw if str(x).strip()]
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return [str(x).strip() for x in data if str(x).strip()]
    except Exception:
        pass
    return [x.strip() for x in str(raw).split(",") if x.strip()]
