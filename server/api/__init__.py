from __future__ import annotations

from fastapi import APIRouter

from .posts import router as posts_router
from .comments import router as comments_router
from .users import router as users_router
from .categories import router as categories_router
from .media import router as media_router
from .admin import router as admin_router
from .views import router as views_router
from .settings import router as settings_router
from .assets import router as assets_router
from .contact import router as contact_router
from .newsroom import router as newsroom_router

api_router = APIRouter()

# Public routes
api_router.include_router(posts_router, tags=["posts"])
api_router.include_router(comments_router, tags=["comments"])
api_router.include_router(contact_router, tags=["contact"])
api_router.include_router(newsroom_router, tags=["newsroom"])
api_router.include_router(categories_router, prefix="/categories", tags=["categories"])
api_router.include_router(views_router, prefix="/views", tags=["views"])
api_router.include_router(settings_router, tags=["settings"])
# Profile photos / brand logos (DB-backed — survive redeploys)
api_router.include_router(assets_router, tags=["assets"])

# Admin routes
api_router.include_router(users_router, prefix="/admin", tags=["admin-users"])
api_router.include_router(media_router, prefix="/admin", tags=["admin-media"])
api_router.include_router(categories_router, prefix="/admin/categories", tags=["admin-categories"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])

__all__ = ["api_router"]
