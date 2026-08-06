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

    async def read_validated_image(self, file: UploadFile) -> tuple[bytes, str, str]:
        """Validate and read an image upload.

        Returns (bytes, content_type, suffix). Does not write to disk.
        """
        content_type = (file.content_type or "").lower().strip() or "image/jpeg"
        if not content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image uploads are allowed")

        allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
        suffix = Path(file.filename or "").suffix.lower()
        if suffix and suffix not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Extension {suffix} not allowed")

        if not suffix:
            if content_type == "image/png":
                suffix = ".png"
            elif content_type in ("image/jpeg", "image/jpg"):
                suffix = ".jpg"
            elif content_type == "image/gif":
                suffix = ".gif"
            elif content_type == "image/webp":
                suffix = ".webp"
            else:
                suffix = ".jpg"

        data = await file.read()
        if len(data) > self.max_size:
            raise HTTPException(
                status_code=413,
                detail=f"Image too large (max {self.max_size // (1024 * 1024)}MB)",
            )
        if not data:
            raise HTTPException(status_code=400, detail="Empty image file")

        # Magic-byte checks when content-type claims PNG/JPEG
        if content_type == "image/png" and not data.startswith(b"\x89PNG"):
            raise HTTPException(status_code=400, detail="Invalid PNG file")
        if content_type in ("image/jpeg", "image/jpg") and not data.startswith(b"\xff\xd8"):
            raise HTTPException(status_code=400, detail="Invalid JPEG file")

        # Normalize content type from magic bytes when possible
        if data.startswith(b"\x89PNG"):
            content_type = "image/png"
            suffix = ".png"
        elif data.startswith(b"\xff\xd8"):
            content_type = "image/jpeg"
            suffix = ".jpg"
        elif data.startswith(b"GIF8"):
            content_type = "image/gif"
            suffix = ".gif"
        elif data.startswith(b"RIFF") and b"WEBP" in data[:16]:
            content_type = "image/webp"
            suffix = ".webp"

        return data, content_type, suffix

    async def store_uploaded_image(self, file: UploadFile) -> str:
        """Store an uploaded image file on disk (post media library)."""
        data, content_type, suffix = await self.read_validated_image(file)

        self.uploads_dir.mkdir(parents=True, exist_ok=True)
        name = f"{uuid.uuid4().hex}{suffix}"
        dest = self.uploads_dir / name
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
