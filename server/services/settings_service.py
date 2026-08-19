from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..models import AppSetting, Post
from ..news_bot_modules.bot_catalog import (
    COUNTRIES,
    DEFAULT_FOCUS_NOTE,
    DEFAULT_WRITER_PROMPT,
    FEED_CATALOG,
    SECTIONS,
    merge_feed_catalog,
)

logger = logging.getLogger(__name__)

# Creators that are always treated as bot-authored (even if is_bot flag was missed)
BOT_CREATOR_KEYS = (
    "wirefringe",
    "wire fringe",
    "news bot engine",
    "newsbot",
    "news bot",
)


# Empty defaults: credentials live only in admin settings (DB).
# Do not hardcode pub IDs here — deleted credentials must stay deleted.
DEFAULT_ADSENSE: dict[str, Any] = {
    "enabled": False,
    "publisherId": "",
    "clientId": "",
    "defaultSlot": "",
    "slotLeaderboard": "",
    "slotInArticle": "",
    "slotSidebar": "",
    "slotRail": "",
    "adsTxt": "",
    "autoAdsEnabled": False,
    "inArticleEnabled": True,
    "inArticleEveryN": 3,
    "inArticleMinBefore": 2,
    "inArticleMax": 4,
}

DEFAULT_BOT: dict[str, Any] = {
    "enabled": True,
    "hideArticles": False,
    "dailyLimit": 12,
    "gapMinutes": 120,
    "sleepSeconds": 3600,
    "queueCleanupHours": 24,
    "recentCacheHours": 2,
    "maxItemsPerFeed": 5,
    "processPerCycle": 1,
    "autoPublish": False,
    "maxAgeHours": 6,
    "countries": ["india", "us", "uk", "world"],
    "sections": list(SECTIONS),
    "feeds": list(FEED_CATALOG),
    "writerPrompt": DEFAULT_WRITER_PROMPT,
    "focusNote": DEFAULT_FOCUS_NOTE,
}

ADSENSE_KEY = "adsense"
BOT_KEY = "bot"


class SettingsService:
    """Read/write structured app settings stored as JSON in app_settings."""

    def __init__(self, db: Session):
        self.db = db

    def _get_raw(self, key: str) -> str | None:
        row = self.db.get(AppSetting, key)
        if row is None:
            return None
        return row.value

    def _set_raw(self, key: str, value: str) -> None:
        row = self.db.get(AppSetting, key)
        now = datetime.now(timezone.utc)
        if row is None:
            row = AppSetting(key=key, value=value, updated_at=now)
            self.db.add(row)
        else:
            row.value = value
            row.updated_at = now
        self.db.commit()

    def _delete_raw(self, key: str) -> bool:
        row = self.db.get(AppSetting, key)
        if row is None:
            return False
        self.db.delete(row)
        self.db.commit()
        return True

    def _load_json(self, key: str, defaults: dict[str, Any]) -> dict[str, Any]:
        raw = self._get_raw(key)
        if not raw:
            return dict(defaults)
        try:
            data = json.loads(raw)
            if not isinstance(data, dict):
                return dict(defaults)
        except (json.JSONDecodeError, TypeError):
            return dict(defaults)
        merged = dict(defaults)
        merged.update({k: v for k, v in data.items() if k in defaults})
        return merged

    def _save_json(self, key: str, data: dict[str, Any]) -> dict[str, Any]:
        self._set_raw(key, json.dumps(data, ensure_ascii=False))
        return data

    # ── AdSense ──────────────────────────────────────────────

    def get_adsense(self) -> dict[str, Any]:
        return self._load_json(ADSENSE_KEY, DEFAULT_ADSENSE)

    def update_adsense(self, payload: dict[str, Any]) -> dict[str, Any]:
        current = self.get_adsense()
        for k in DEFAULT_ADSENSE:
            if k not in payload:
                continue
            val = payload[k]
            if k in ("inArticleEveryN", "inArticleMinBefore", "inArticleMax"):
                try:
                    val = int(val)
                except (TypeError, ValueError):
                    val = DEFAULT_ADSENSE[k]
                if k == "inArticleEveryN":
                    val = max(1, min(val, 20))
                elif k == "inArticleMinBefore":
                    val = max(0, min(val, 20))
                else:
                    val = max(0, min(val, 20))
            elif k in ("enabled", "autoAdsEnabled", "inArticleEnabled"):
                val = bool(val)
            else:
                val = str(val or "").strip()
            current[k] = val

        # Keep clientId and publisherId in sync when one is provided
        pub = str(current.get("publisherId") or "").strip()
        client = str(current.get("clientId") or "").strip()
        if pub and not client:
            current["clientId"] = pub if pub.startswith("ca-") else f"ca-{pub}"
        if client and not pub:
            current["publisherId"] = client.replace("ca-", "", 1) if client.startswith("ca-") else client
        # Normalize
        if current.get("publisherId"):
            p = str(current["publisherId"]).strip()
            if p.startswith("ca-"):
                p = p[3:]
            current["publisherId"] = p
        if current.get("clientId"):
            c = str(current["clientId"]).strip()
            if c and not c.startswith("ca-") and c.startswith("pub-"):
                current["clientId"] = f"ca-{c}"

        # Auto-build ads.txt line when publisher is set and adsTxt empty-ish
        ads_txt = str(current.get("adsTxt") or "").strip()
        if current.get("publisherId") and not ads_txt:
            current["adsTxt"] = (
                f"google.com, {current['publisherId']}, DIRECT, f08c47fec0942fa0"
            )

        return self._save_json(ADSENSE_KEY, current)

    def clear_adsense(self) -> dict[str, Any]:
        """Wipe credentials and disable ads."""
        empty = {
            "enabled": False,
            "publisherId": "",
            "clientId": "",
            "defaultSlot": "",
            "slotLeaderboard": "",
            "slotInArticle": "",
            "slotSidebar": "",
            "slotRail": "",
            "adsTxt": "",
            "autoAdsEnabled": False,
            "inArticleEnabled": False,
            "inArticleEveryN": 3,
            "inArticleMinBefore": 2,
            "inArticleMax": 4,
        }
        return self._save_json(ADSENSE_KEY, empty)

    def get_adsense_public(self) -> dict[str, Any]:
        """Public-safe AdSense config for the frontend."""
        cfg = self.get_adsense()
        slots = {
            "default": cfg.get("defaultSlot") or "",
            "leaderboard": cfg.get("slotLeaderboard") or cfg.get("defaultSlot") or "",
            "inArticle": cfg.get("slotInArticle") or cfg.get("defaultSlot") or "",
            "sidebar": cfg.get("slotSidebar") or cfg.get("defaultSlot") or "",
            "rail": cfg.get("slotRail") or cfg.get("defaultSlot") or "",
            "multipath": cfg.get("defaultSlot") or "",
        }
        return {
            "enabled": bool(cfg.get("enabled")) and bool(cfg.get("clientId")),
            "clientId": cfg.get("clientId") or "",
            "publisherId": cfg.get("publisherId") or "",
            "slots": slots,
            "autoAdsEnabled": bool(cfg.get("autoAdsEnabled")),
            "inArticleEnabled": bool(cfg.get("inArticleEnabled")),
            "inArticleEveryN": int(cfg.get("inArticleEveryN") or 3),
            "inArticleMinBefore": int(cfg.get("inArticleMinBefore") or 2),
            "inArticleMax": int(cfg.get("inArticleMax") or 4),
            "adsTxt": cfg.get("adsTxt") or "",
        }

    # ── News Bot ─────────────────────────────────────────────

    def get_bot(self) -> dict[str, Any]:
        data = self._load_json(BOT_KEY, DEFAULT_BOT)
        data["feeds"] = merge_feed_catalog(data.get("feeds"))
        # Keep saved empty lists / blank prompt. Defaults already fill missing keys.
        if not isinstance(data.get("countries"), list):
            data["countries"] = list(DEFAULT_BOT["countries"])
        if not isinstance(data.get("sections"), list):
            data["sections"] = list(DEFAULT_BOT["sections"])
        if data.get("writerPrompt") is None:
            data["writerPrompt"] = DEFAULT_WRITER_PROMPT
        if data.get("focusNote") is None:
            data["focusNote"] = DEFAULT_FOCUS_NOTE
        data["catalog"] = {"countries": COUNTRIES, "sections": SECTIONS}
        return data

    def update_bot(self, payload: dict[str, Any]) -> dict[str, Any]:
        current = self.get_bot()
        current.pop("catalog", None)
        prev_hide = bool(current.get("hideArticles"))
        int_keys = {
            "dailyLimit": (1, 100),
            "gapMinutes": (0, 24 * 60),
            "sleepSeconds": (60, 86400),
            "queueCleanupHours": (1, 168),
            "recentCacheHours": (1, 72),
            "maxItemsPerFeed": (1, 50),
            "processPerCycle": (1, 10),
            "maxAgeHours": (1, 72),
        }
        for k in DEFAULT_BOT:
            if k not in payload:
                continue
            val = payload[k]
            if k in ("enabled", "hideArticles", "autoPublish"):
                val = bool(val)
            elif k in int_keys:
                lo, hi = int_keys[k]
                try:
                    val = int(val)
                except (TypeError, ValueError):
                    val = DEFAULT_BOT[k]
                val = max(lo, min(hi, val))
            elif k in ("writerPrompt", "focusNote"):
                val = str(val if val is not None else "").strip()
                val = val[:8000] if k == "writerPrompt" else val[:500]
            elif k == "countries":
                allowed = {c["id"] for c in COUNTRIES}
                val = [str(x).strip().lower() for x in (val or []) if str(x).strip().lower() in allowed]
            elif k == "sections":
                val = [str(x).strip() for x in (val or []) if str(x).strip() in SECTIONS]
            elif k == "feeds":
                val = merge_feed_catalog(val if isinstance(val, list) else [])
            current[k] = val
        saved = self._save_json(BOT_KEY, current)
        if "hideArticles" in payload and bool(saved.get("hideArticles")) != prev_hide:
            self.set_bot_articles_hidden(bool(saved.get("hideArticles")), sync_setting=False)
        return self.get_bot()

    def get_bot_stats(self) -> dict[str, Any]:
        self._retag_bot_posts_from_creators()
        hide_articles = bool(self.get_bot().get("hideArticles"))
        total_bot = (
            self.db.query(Post).filter(Post.is_bot.is_(True)).count()
        )
        # "On site" = what /api/posts actually returns (published + not hidden).
        on_site = (
            self.db.query(Post)
            .filter(
                Post.is_bot.is_(True),
                Post.is_hidden.is_(False),
                func.lower(Post.status) == "published",
            )
            .count()
        )
        visible_bot = 0 if hide_articles else on_site
        hidden_bot = max(0, total_bot - visible_bot)
        return {
            "totalBotPosts": total_bot,
            "hiddenBotPosts": hidden_bot,
            "visibleBotPosts": visible_bot,
        }

    def _retag_bot_posts_from_creators(self) -> int:
        """Mark posts as is_bot when creator is a known bot/brand author.

        Fixes posts that were published as Wirefringe / News Bot Engine but
        never got is_bot=True, so hide-all missed them.
        """
        creator_key = func.lower(func.trim(Post.creator))
        result = (
            self.db.query(Post)
            .filter(
                Post.is_bot.is_(False),
                or_(*[creator_key == key for key in BOT_CREATOR_KEYS]),
            )
            .update({Post.is_bot: True}, synchronize_session=False)
        )
        if result:
            self.db.commit()
            logger.info("Retagged %s legacy bot-creator posts as is_bot=True", result)
        return int(result or 0)

    def set_bot_articles_hidden(
        self, hidden: bool, *, sync_setting: bool = True
    ) -> dict[str, Any]:
        # Catch untagged bot posts first (e.g. creator=Wirefringe, is_bot=false)
        self._retag_bot_posts_from_creators()

        live = or_(
            func.lower(Post.status) == "published",
            func.lower(Post.status) == "unpublished",
            Post.published_at.isnot(None),
        )

        if hidden:
            # Only flag visibility. Do not change status — unpublish-on-hide
            # left posts stuck off the public site after the toggle was turned off.
            updated = (
                self.db.query(Post)
                .filter(Post.is_bot.is_(True), live)
                .update({Post.is_hidden: True}, synchronize_session=False)
            )
        else:
            # Bring previously live bot posts back onto the public site.
            # Public listing requires status=published AND is_hidden=false.
            # Draft / review / scheduled rows are left in the pipeline.
            updated = (
                self.db.query(Post)
                .filter(Post.is_bot.is_(True), live)
                .filter(
                    or_(
                        func.lower(Post.status) == "published",
                        func.lower(Post.status) == "unpublished",
                        Post.published_at.isnot(None),
                    )
                )
                .filter(func.lower(Post.status).notin_(["draft", "review", "scheduled"]))
                .update(
                    {Post.is_hidden: False, Post.status: "published"},
                    synchronize_session=False,
                )
            )

        if sync_setting:
            bot = self.get_bot()
            bot.pop("catalog", None)
            bot["hideArticles"] = bool(hidden)
            row = self.db.get(AppSetting, BOT_KEY)
            now = datetime.now(timezone.utc)
            payload = json.dumps(bot, ensure_ascii=False)
            if row is None:
                self.db.add(AppSetting(key=BOT_KEY, value=payload, updated_at=now))
            else:
                row.value = payload
                row.updated_at = now

        self.db.commit()
        self._trigger_site_revalidate()
        return {
            "updated": int(updated or 0),
            "hidden": bool(hidden),
            **self.get_bot_stats(),
        }

    def _trigger_site_revalidate(self) -> None:
        """Best-effort Next.js ISR revalidate so homepage drops hidden posts."""
        try:
            import httpx
            from ..config import settings

            url = f"{settings.ui_url.rstrip('/')}/api/revalidate"
            httpx.post(
                url,
                json={"secret": settings.revalidate_secret},
                timeout=3.0,
            )
        except Exception as e:
            logger.warning("Could not revalidate UI after bot hide/unhide: %s", e)
