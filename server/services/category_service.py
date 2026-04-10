from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import Category
from ..repositories import CategoryRepository
from ..schemas import CategoryOut, CategoryWithCountOut


class CategoryService:
    """Service layer for Category operations."""

    def __init__(self, db: Session):
        self.db = db
        self.category_repo = CategoryRepository(db)

    def list_categories(self) -> list[CategoryOut]:
        """List all categories."""
        cats = self.category_repo.list_ordered()
        return [
            CategoryOut(id=c.id, name=c.name, createdAt=c.created_at) for c in cats
        ]

    def list_categories_with_counts(self) -> list[CategoryWithCountOut]:
        """List categories with post counts."""
        cats = self.category_repo.list_ordered()
        count_by_name = self.category_repo.get_post_counts()

        out: list[CategoryWithCountOut] = []
        for c in cats:
            out.append(
                CategoryWithCountOut(
                    id=c.id, name=c.name, count=count_by_name.get(c.name, 0)
                )
            )
        return sorted(out, key=lambda x: (-x.count, x.name))

    def create_category(self, name: str) -> CategoryOut:
        """Create a new category."""
        name = (name or "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="Category name is required")
        if len(name) > 100:
            raise HTTPException(
                status_code=400, detail="Category name too long (max 100 chars)"
            )

        existing = self.category_repo.get_by_name(name)
        if existing is not None:
            raise HTTPException(status_code=409, detail="Category already exists")

        cat = Category(name=name)
        created = self.category_repo.create(cat)
        return CategoryOut(id=created.id, name=created.name, createdAt=created.created_at)

    def delete_category(self, category_id: int) -> None:
        """Delete a category."""
        cat = self.category_repo.get(category_id)
        if cat is None:
            raise HTTPException(status_code=404, detail="Category not found")

        self.category_repo.delete(cat)

    def seed_defaults(self) -> None:
        """Seed default categories if none exist."""
        if self.category_repo.exists():
            return

        defaults = ["Tech", "AI & Future Tech", "Business & Markets", "Personal Finance"]
        for name in defaults:
            self.category_repo.create(Category(name=name))
