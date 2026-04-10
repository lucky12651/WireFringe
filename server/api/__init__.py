from __future__ import annotations

from fastapi import APIRouter

from .posts import router as posts_router
from .comments import router as comments_router
from .users import router as users_router
from .categories import router as categories_router
from .media import router as media_router
from .admin import router as admin_router

api_router = APIRouter()

# Public routes
api_router.include_router(posts_router, tags=["posts"])
api_router.include_router(comments_router, tags=["comments"])
api_router.include_router(categories_router, prefix="/categories", tags=["categories"])

# Admin routes
api_router.include_router(users_router, prefix="/admin", tags=["admin-users"])
api_router.include_router(media_router, prefix="/admin", tags=["admin-media"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])

__all__ = ["api_router"]
