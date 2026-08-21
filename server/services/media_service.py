from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..config import settings
from ..models import MediaAsset
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

    def _try_write_disk(self, name: str, data: bytes) -> str | None:
        try:
            self.uploads_dir.mkdir(parents=True, exist_ok=True)
            dest = self.uploads_dir / name
            dest.write_bytes(data)
            return f"/static/uploads/{name}"
        except OSError:
            return None

    async def store_uploaded_image(self, file: UploadFile, db: Session | None = None) -> str:
        """Store an uploaded image. Disk if writable; otherwise Postgres (RushDeploy)."""
        data, content_type, suffix = await self.read_validated_image(file)
        name = f"{uuid.uuid4().hex}{suffix}"

        disk_url = self._try_write_disk(name, data)
        if disk_url:
            return disk_url

        if db is None:
            raise HTTPException(
                status_code=500,
                detail="Upload folder is not writable on this server.",
            )
        db.add(
            MediaAsset(
                id=name,
                content_type=content_type,
                data=data,
                created_at=datetime.now(timezone.utc),
            )
        )
        db.commit()
        return f"/api/media/{name}"

    def list_media_files(self, db: Session | None = None) -> list[MediaFileOut]:
        """List uploaded media from disk and the database."""
        items: list[MediaFileOut] = []
        try:
            self.uploads_dir.mkdir(parents=True, exist_ok=True)
            for p in self.uploads_dir.glob("*"):
                if not p.is_file() or p.name.startswith("."):
                    continue
                st = p.stat()
                items.append(
                    MediaFileOut(
                        name=p.name,
                        url=f"/static/uploads/{p.name}",
                        size=int(st.st_size),
                        modifiedAt=datetime.fromtimestamp(st.st_mtime, tz=timezone.utc),
                    )
                )
        except OSError:
            pass

        if db is not None:
            seen = {i.name for i in items}
            for row in db.query(MediaAsset).order_by(MediaAsset.created_at.desc()).all():
                if row.id in seen:
                    continue
                items.append(
                    MediaFileOut(
                        name=row.id,
                        url=f"/api/media/{row.id}",
                        size=len(row.data or b""),
                        modifiedAt=row.created_at,
                    )
                )

        items.sort(key=lambda x: x.modifiedAt or datetime.now(timezone.utc), reverse=True)
        return items
