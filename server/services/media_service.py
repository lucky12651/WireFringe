from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile

from ..config import settings
from ..schemas import MediaFileOut


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

        # Basic extension whitelist
        allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
        suffix = Path(file.filename or "").suffix.lower()
        if suffix and suffix not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Extension {suffix} not allowed")

        self.uploads_dir.mkdir(parents=True, exist_ok=True)

        # Deriving suffix if not present
        if not suffix:
            if content_type == "image/png": suffix = ".png"
            elif content_type == "image/jpeg": suffix = ".jpg"
            elif content_type == "image/gif": suffix = ".gif"
            elif content_type == "image/webp": suffix = ".webp"
            else: suffix = ".jpg"

        name = f"{uuid.uuid4().hex}{suffix}"
        dest = self.uploads_dir / name

        # Size limit check
        data = await file.read()
        if len(data) > self.max_size:
            raise HTTPException(
                status_code=413, detail=f"Image too large (max {self.max_size // (1024*1024)}MB)"
            )

        # Basic magic byte check (first 4 bytes)
        # PNG: 89 50 4E 47, JPEG: FF D8 FF
        if content_type == "image/png" and not data.startswith(b"\x89PNG"):
            raise HTTPException(status_code=400, detail="Invalid PNG file")
        if content_type in ["image/jpeg", "image/jpg"] and not data.startswith(b"\xff\xd8"):
            raise HTTPException(status_code=400, detail="Invalid JPEG file")

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
