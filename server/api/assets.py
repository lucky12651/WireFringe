"""Public asset endpoints (profile photos, brand logos) backed by the database."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..config import settings
from ..dependencies import get_db
from ..models import User

router = APIRouter(tags=["assets"])


def _static_upload_path(url: str | None) -> Path | None:
    """Resolve /static/uploads/... URL to a local file if it still exists."""
    if not url:
        return None
    raw = str(url).split("?", 1)[0].strip()
    if not raw.startswith("/static/uploads/"):
        return None
    name = Path(raw).name
    if not name or name in (".", "..") or "/" in name or "\\" in name:
        return None
    path = settings.uploads_dir / name
    return path if path.is_file() else None


@router.get("/avatars/{user_id}")
def get_user_avatar(user_id: int, db: Session = Depends(get_db)):
    """Public profile photo. Served from DB so redeploys do not remove it."""
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    data = getattr(user, "avatar_data", None)
    if data:
        media_type = (getattr(user, "avatar_content_type", None) or "image/jpeg").split(";")[0]
        return Response(
            content=bytes(data),
            media_type=media_type,
            headers={"Cache-Control": "public, max-age=604800, immutable"},
        )

    path = _static_upload_path(getattr(user, "avatar_url", None))
    if path is not None:
        return FileResponse(path)

    raise HTTPException(status_code=404, detail="Avatar not found")


@router.get("/brand-logos/{user_id}")
def get_user_brand_logo(user_id: int, db: Session = Depends(get_db)):
    """Public brand logo for post bylines. Served from DB so redeploys keep it."""
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    data = getattr(user, "brand_logo_data", None)
    if data:
        media_type = (getattr(user, "brand_logo_content_type", None) or "image/png").split(";")[0]
        return Response(
            content=bytes(data),
            media_type=media_type,
            headers={"Cache-Control": "public, max-age=604800, immutable"},
        )

    path = _static_upload_path(getattr(user, "brand_logo_url", None))
    if path is not None:
        return FileResponse(path)

    raise HTTPException(status_code=404, detail="Brand logo not found")
