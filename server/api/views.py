from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()

@router.post("/increment")
async def increment_views():
    """No-op endpoint to satisfy frontend view tracking."""
    return {"ok": True}
