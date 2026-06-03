from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..auth import authenticate, hash_password, verify_password
from ..models import User
from ..repositories import UserRepository
from ..schemas import MeOut, UserCreate, UserOut


class UserService:
    """Service layer for User operations."""

    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    @staticmethod
    def _build_me_out(user: User) -> MeOut:
        """Convert User model to MeOut schema."""
        return MeOut(
            id=user.id,
            username=user.username,
            role=user.role,
            displayName=(user.display_name or None),
            avatarUrl=(user.avatar_url or None),
        )

    @staticmethod
    def _build_user_out(user: User) -> UserOut:
        """Convert User model to UserOut schema."""
        return UserOut(
            id=user.id,
            username=user.username,
            role=user.role,
            avatarUrl=(user.avatar_url or None),
            displayName=(user.display_name or None),
        )

    def authenticate_user(self, username: str, password: str) -> User | None:
        """Authenticate a user with credentials."""
        auth_user = authenticate(self.db, username, password)
        if auth_user is None:
            return None
        user = self.user_repo.get(auth_user.id)
        return user

    def get_user(self, user_id: int) -> User | None:
        """Get user by ID."""
        return self.user_repo.get(user_id)

    def get_user_by_username(self, username: str) -> User | None:
        """Get user by username."""
        return self.user_repo.get_by_username(username)

    def list_users(self) -> list[UserOut]:
        """List all users."""
        users = self.user_repo.list_ordered()
        return [self._build_user_out(u) for u in users]

    def create_user(self, payload: UserCreate) -> User:
        """Create a new user."""
        role = payload.role.strip().lower()
        if role not in {"admin", "editor", "author", "user"}:
            raise HTTPException(
                status_code=400, detail="role must be admin, editor, author, or user"
            )

        existing = self.user_repo.get_by_username(payload.username)
        if existing is not None:
            raise HTTPException(status_code=409, detail="Username already exists")

        password_hash, password_salt = hash_password(payload.password)
        new_user = User(
            username=payload.username,
            password_hash=password_hash,
            password_salt=password_salt,
            role=role,
        )
        return self.user_repo.create(new_user)

    def update_profile(self, user: User, display_name: str | None) -> MeOut:
        """Update user profile."""
        if display_name is not None:
            name = (display_name or "").strip()
            if not name:
                user.display_name = None
            else:
                if len(name) > 80:
                    raise HTTPException(
                        status_code=400, detail="Display name too long (max 80 chars)"
                    )
                user.display_name = name

        updated = self.user_repo.update(user)
        return self._build_me_out(updated)

    def update_avatar(self, user: User, avatar_url: str) -> MeOut:
        """Update user avatar URL."""
        user.avatar_url = avatar_url
        updated = self.user_repo.update(user)
        return self._build_me_out(updated)

    def change_password(
        self, user: User, current_password: str, new_password: str
    ) -> None:
        """Change user password."""
        if not verify_password(current_password, user.password_hash, user.password_salt):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        if len(new_password) < 8:
            raise HTTPException(
                status_code=400, detail="New password must be at least 8 characters"
            )

        password_hash, password_salt = hash_password(new_password)
        user.password_hash = password_hash
        user.password_salt = password_salt
        self.user_repo.update(user)

    def delete_user(self, user_id: int, current_user: User) -> None:
        """Delete a user."""
        target = self.user_repo.get(user_id)
        if target is None:
            raise HTTPException(status_code=404, detail="User not found")
        if target.id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot delete your own user")

        self.user_repo.delete(target)
