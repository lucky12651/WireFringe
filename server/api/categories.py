from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from dependencies import get_db, require_admin, require_user
from schemas import CategoryCreate, CategoryOut, CategoryWithCountOut
from services import CategoryService

router = APIRouter()


def get_category_service(db: Session = Depends(get_db)) -> CategoryService:
    return CategoryService(db)


@router.get("", response_model=list[CategoryOut])
def list_categories(
    service: CategoryService = Depends(get_category_service),
) -> list[CategoryOut]:
    """List all categories."""
    return service.list_categories()


@router.get("/with-counts", response_model=list[CategoryWithCountOut])
def list_categories_with_counts(
    service: CategoryService = Depends(get_category_service),
) -> list[CategoryWithCountOut]:
    """List categories with post counts."""
    return service.list_categories_with_counts()


@router.post("/admin/categories", response_model=CategoryOut)
def admin_create_category(
    payload: CategoryCreate,
    request: Request,
    db: Session = Depends(get_db),
    service: CategoryService = Depends(get_category_service),
) -> CategoryOut:
    """Create a new category."""
    user = require_user(request, db)
    require_admin(user)
    return service.create_category(payload.name)


@router.delete("/admin/categories/{category_id}")
def admin_delete_category(
    category_id: int,
    request: Request,
    db: Session = Depends(get_db),
    service: CategoryService = Depends(get_category_service),
) -> dict:
    """Delete a category."""
    user = require_user(request, db)
    require_admin(user)
    service.delete_category(category_id)
    return {"ok": True}
