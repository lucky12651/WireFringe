from __future__ import annotations

from fastapi import APIRouter, Depends, File, Request, UploadFile
from sqlalchemy.orm import Session

from ..dependencies import get_db, require_user, require_newsroom
from ..schemas import MediaFileOut
from ..services import MediaService

router = APIRouter()


def get_media_service() -> MediaService:
    return MediaService()


@router.post("/upload-image")
async def admin_upload_image(
    request: Request,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    service: MediaService = Depends(get_media_service),
) -> dict:
    """Upload an image file."""
    user = require_user(request, db)
    require_newsroom(user)
    url = await service.store_uploaded_image(file)
    return {"url": url}


@router.get("/media", response_model=list[MediaFileOut])
def admin_list_media(
    request: Request,
    db: Session = Depends(get_db),
    service: MediaService = Depends(get_media_service),
) -> list[MediaFileOut]:
    """List all uploaded media files."""
    user = require_user(request, db)
    require_newsroom(user)
    return service.list_media_files()
