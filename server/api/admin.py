from __future__ import annotations

from fastapi import APIRouter, Depends, File, Request, UploadFile
from sqlalchemy.orm import Session

from ..dependencies import get_db, require_user
from ..schemas import MeOut, BotLogOut
from ..services import MediaService, UserService
from ..models import BotLog

router = APIRouter()


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)


def get_media_service() -> MediaService:
    return MediaService()


@router.get("/logs", response_model=list[BotLogOut])
def admin_get_logs(
    request: Request,
    db: Session = Depends(get_db),
    limit: int = 100,
) -> list[BotLogOut]:
    """Get recent bot and system logs."""
    require_user(request, db)
    logs = db.query(BotLog).order_by(BotLog.created_at.desc()).limit(limit).all()
    
    # Map to schema manually
    return [
        BotLogOut(
            id=l.id,
            level=l.level,
            message=l.message,
            module=l.module,
            createdAt=l.created_at
        )
        for l in logs
    ]

@router.post("/profile/photo", response_model=MeOut)
async def admin_upload_profile_photo(
    request: Request,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    user_service: UserService = Depends(get_user_service),
    media_service: MediaService = Depends(get_media_service),
) -> MeOut:
    """Upload profile photo for current user."""
    user = require_user(request, db)
    url = await media_service.store_uploaded_image(file)
    return user_service.update_avatar(user, url)
