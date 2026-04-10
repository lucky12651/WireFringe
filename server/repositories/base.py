from __future__ import annotations

from typing import Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from db import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository with common CRUD operations."""

    def __init__(self, db: Session, model: type[ModelType]):
        self.db = db
        self.model = model

    def get(self, id: int | str) -> ModelType | None:
        """Get a single record by ID."""
        return self.db.get(self.model, id)

    def get_all(self) -> list[ModelType]:
        """Get all records."""
        return self.db.execute(select(self.model)).scalars().all()

    def create(self, obj: ModelType) -> ModelType:
        """Create a new record."""
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def update(self, obj: ModelType) -> ModelType:
        """Update an existing record."""
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, obj: ModelType) -> None:
        """Delete a record."""
        self.db.delete(obj)
        self.db.commit()
