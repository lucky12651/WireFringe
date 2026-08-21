from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from ..bot_scope import bot_byline, bot_user_scope
from ..dependencies import get_db, require_admin, require_bot_access, require_user
from ..services.settings_service import SettingsService

router = APIRouter()


def get_settings_service(db: Session = Depends(get_db)) -> SettingsService:
    return SettingsService(db)


# ── Schemas ──────────────────────────────────────────────────


class AdSenseUpdate(BaseModel):
    enabled: bool | None = None
    publisherId: str | None = None
    clientId: str | None = None
    defaultSlot: str | None = None
    slotLeaderboard: str | None = None
    slotInArticle: str | None = None
    slotSidebar: str | None = None
    slotRail: str | None = None
    adsTxt: str | None = None
    autoAdsEnabled: bool | None = None
    inArticleEnabled: bool | None = None
    inArticleEveryN: int | None = Field(None, ge=1, le=20)
    inArticleMinBefore: int | None = Field(None, ge=0, le=20)
    inArticleMax: int | None = Field(None, ge=0, le=20)


class BotUpdate(BaseModel):
    # Allow extra keys so a stale process / older schema cannot silently
    # drop editorial fields (countries, prompt, feeds) on save.
    model_config = ConfigDict(extra="allow")

    enabled: bool | None = None
    hideArticles: bool | None = None
    autoPublish: bool | None = None
    dailyLimit: int | None = Field(None, ge=1, le=100)
    gapMinutes: int | None = Field(None, ge=0, le=1440)
    sleepSeconds: int | None = Field(None, ge=60, le=86400)
    queueCleanupHours: int | None = Field(None, ge=1, le=168)
    recentCacheHours: int | None = Field(None, ge=1, le=72)
    maxItemsPerFeed: int | None = Field(None, ge=1, le=50)
    processPerCycle: int | None = Field(None, ge=1, le=10)
    maxAgeHours: int | None = Field(None, ge=1, le=72)
    countries: list[str] | None = None
    sections: list[str] | None = None
    feeds: list[dict] | None = None
    writerPrompt: str | None = None
    focusNote: str | None = None


# ── Public AdSense ───────────────────────────────────────────


@router.get("/adsense/public")
def public_adsense(service: SettingsService = Depends(get_settings_service)) -> dict:
    """Public AdSense config used by the frontend ad units."""
    return service.get_adsense_public()


@router.get("/adsense/ads.txt", response_class=PlainTextResponse)
def public_ads_txt(service: SettingsService = Depends(get_settings_service)) -> Response:
    """Serve ads.txt from admin settings only (empty when credentials deleted)."""
    cfg = service.get_adsense()
    publisher = str(cfg.get("publisherId") or "").strip()
    client = str(cfg.get("clientId") or "").strip()
    body = str(cfg.get("adsTxt") or "").strip()

    # No credentials → empty ads.txt (do not fall back to old hardcoded pub IDs)
    if not publisher and not client and not body:
        return PlainTextResponse(
            content="",
            media_type="text/plain; charset=utf-8",
            headers={"Cache-Control": "no-store, max-age=0"},
        )

    if not body and publisher:
        body = f"google.com, {publisher}, DIRECT, f08c47fec0942fa0"

    return PlainTextResponse(
        content=body + "\n",
        media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "no-store, max-age=0"},
    )


# ── Admin AdSense ────────────────────────────────────────────


@router.get("/admin/adsense")
def admin_get_adsense(
    request: Request,
    db: Session = Depends(get_db),
    service: SettingsService = Depends(get_settings_service),
) -> dict:
    user = require_user(request, db)
    require_admin(user)
    return service.get_adsense()


@router.put("/admin/adsense")
def admin_update_adsense(
    payload: AdSenseUpdate,
    request: Request,
    db: Session = Depends(get_db),
    service: SettingsService = Depends(get_settings_service),
) -> dict:
    user = require_user(request, db)
    require_admin(user)
    data = payload.model_dump(exclude_unset=True)
    return service.update_adsense(data)


@router.delete("/admin/adsense")
def admin_clear_adsense(
    request: Request,
    db: Session = Depends(get_db),
    service: SettingsService = Depends(get_settings_service),
) -> dict:
    """Delete all AdSense credentials and disable ads."""
    user = require_user(request, db)
    require_admin(user)
    return service.clear_adsense()


# ── Admin Bot ────────────────────────────────────────────────


@router.get("/admin/bot")
def admin_get_bot(
    request: Request,
    db: Session = Depends(get_db),
    service: SettingsService = Depends(get_settings_service),
) -> dict:
    user = require_user(request, db)
    require_bot_access(user)
    with bot_user_scope(user.id):
        cfg = service.get_bot(user)
        stats = service.get_bot_stats(user)
    return {
        **cfg,
        "stats": stats,
        "ownerId": user.id,
        "ownerName": bot_byline(user),
    }


@router.put("/admin/bot")
def admin_update_bot(
    payload: BotUpdate,
    request: Request,
    db: Session = Depends(get_db),
    service: SettingsService = Depends(get_settings_service),
) -> dict:
    user = require_user(request, db)
    require_bot_access(user)
    data = payload.model_dump(exclude_unset=True)
    with bot_user_scope(user.id):
        service.update_bot(data, user=user)
        cfg = service.set_bot_operator(user)
        stats = service.get_bot_stats(user)
    try:
        from ..news_bot import request_bot_cycle

        request_bot_cycle()
    except Exception:
        pass
    return {
        **cfg,
        "stats": stats,
        "ownerId": user.id,
        "ownerName": bot_byline(user),
    }


@router.post("/admin/bot/hide-articles")
def admin_hide_bot_articles(
    request: Request,
    db: Session = Depends(get_db),
    service: SettingsService = Depends(get_settings_service),
) -> dict:
    """Hide all bot-generated articles from the public site."""
    user = require_user(request, db)
    require_bot_access(user)
    with bot_user_scope(user.id):
        service.set_bot_operator(user)
        return service.set_bot_articles_hidden(True, user=user)


@router.post("/admin/bot/unhide-articles")
def admin_unhide_bot_articles(
    request: Request,
    db: Session = Depends(get_db),
    service: SettingsService = Depends(get_settings_service),
) -> dict:
    """Unhide all bot-generated articles on the public site."""
    user = require_user(request, db)
    require_bot_access(user)
    with bot_user_scope(user.id):
        service.set_bot_operator(user)
        return service.set_bot_articles_hidden(False, user=user)
