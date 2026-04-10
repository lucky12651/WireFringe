from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile

from config import settings
from schemas import MediaFileOut


class MediaService:
    """Service layer for media/file operations."""

    def __init__(self):
        self.uploads_dir = settings.uploads_dir
        self.max_size = settings.max_upload_size

    async def store_uploaded_image(self, file: UploadFile) -> str:
        """Store an uploaded image file."""
        content_type = (file.content_type or "").lower()
        if not content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image uploads are allowed")

        self.uploads_dir.mkdir(parents=True, exist_ok=True)

        # Keep extension if present; otherwise derive from content-type.
        suffix = Path(file.filename or "").suffix.lower()
        if not suffix:
            suffix = ".png" if content_type == "image/png" else ".jpg"

        name = f"{uuid.uuid4().hex}{suffix}"
        dest = self.uploads_dir / name

        # Size limit check
        data = await file.read()
        if len(data) > self.max_size:
            raise HTTPException(
                status_code=413, detail=f"Image too large (max {self.max_size // (1024*1024)}MB)"
            )
        dest.write_bytes(data)

        return f"/static/uploads/{name}"

    def list_media_files(self) -> list[MediaFileOut]:
        """List all uploaded media files."""
        self.uploads_dir.mkdir(parents=True, exist_ok=True)

        items: list[MediaFileOut] = []
        for p in self.uploads_dir.glob("*"):
            if not p.is_file():
                continue
            name = p.name
            if name.startswith("."):
                continue

            st = p.stat()
            modified = datetime.fromtimestamp(st.st_mtime, tz=timezone.utc)
            items.append(
                MediaFileOut(
                    name=name,
                    url=f"/static/uploads/{name}",
                    size=int(st.st_size),
                    modifiedAt=modified,
                )
            )

        items.sort(key=lambda x: x.modifiedAt, reverse=True)
        return items
