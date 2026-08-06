from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.orm import Session

from ..auth import authenticate, hash_password, verify_password
from ..models import (
    Comment,
    CommentVote,
    PersonalizedFeed,
    Post,
    User,
    UserInteraction,
)
from ..repositories import UserRepository
from ..schemas import (
    AdminUserDeleteOut,
    MeOut,
    OrphanActionOut,
    UserCreate,
    UserOut,
)


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
            brandBylineEnabled=bool(getattr(user, "brand_byline_enabled", False)),
            brandLogoUrl=(getattr(user, "brand_logo_url", None) or None),
        )

    def _post_counts_by_creator_key(self) -> dict[str, tuple[str, int]]:
        """Map lower(trim(creator)) -> (original display label, count)."""
        rows = self.db.execute(
            select(
                Post.creator,
                func.count(Post.id),
            ).group_by(Post.creator)
        ).all()
        out: dict[str, tuple[str, int]] = {}
        for raw_creator, count in rows:
            label = (raw_creator or "").strip() or "Unknown"
            key = label.lower()
            prev = out.get(key)
            if prev:
                out[key] = (prev[0], prev[1] + int(count or 0))
            else:
                out[key] = (label, int(count or 0))
        return out

    def _build_user_out(self, user: User, post_count: int | None = None) -> UserOut:
        """Convert User model to UserOut schema."""
        if post_count is None:
            keys = self._creator_keys_for_user(user)
            counts = self._post_counts_by_creator_key()
            post_count = sum(counts.get(k, ("", 0))[1] for k in keys)
        return UserOut(
            id=user.id,
            username=user.username,
            role=user.role,
            avatarUrl=(user.avatar_url or None),
            displayName=(user.display_name or None),
            brandBylineEnabled=bool(getattr(user, "brand_byline_enabled", False)),
            brandLogoUrl=(getattr(user, "brand_logo_url", None) or None),
            postCount=int(post_count or 0),
            isOrphan=False,
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
        """List all login accounts plus orphan post-creators (no account)."""
        counts = self._post_counts_by_creator_key()
        users = self.user_repo.list_ordered()

        # Keys claimed by real accounts (username + display name)
        claimed: set[str] = set()
        result: list[UserOut] = []
        for u in users:
            keys = self._creator_keys_for_user(u)
            for k in keys:
                claimed.add(k)
            post_count = sum(counts.get(k, ("", 0))[1] for k in keys)
            # Also count exact username match even if keys empty edge case
            uname = (u.username or "").strip().lower()
            if uname and uname not in keys:
                post_count += counts.get(uname, ("", 0))[1]
            result.append(self._build_user_out(u, post_count=post_count))

        # Orphan creators: appear on posts but have no matching user account
        for key, (label, count) in sorted(
            counts.items(), key=lambda item: (-item[1][1], item[1][0].lower())
        ):
            if key in claimed or key == "unknown":
                continue
            if count <= 0:
                continue
            # Stable negative id so JSON always has a numeric id (null can be dropped
            # by some clients / serializers). Never collides with real autoincrement ids.
            synthetic_id = -abs(hash(key) % 1_000_000_000) or -1
            result.append(
                UserOut(
                    id=synthetic_id,
                    username=label,
                    role="orphan",
                    avatarUrl=None,
                    displayName=label,
                    brandBylineEnabled=False,
                    brandLogoUrl=None,
                    postCount=count,
                    isOrphan=True,
                )
            )

        return result

    def claim_orphan_author(
        self,
        creator_name: str,
        password: str,
        role: str = "author",
        username: str | None = None,
        display_name: str | None = None,
        reassign_posts: bool = True,
        admin: User | None = None,
    ) -> OrphanActionOut:
        """Create a login account for a post creator that has no users row."""
        if admin is not None and (admin.role or "").strip().lower() != "admin":
            raise HTTPException(status_code=403, detail="Admin required")

        creator = (creator_name or "").strip()
        if not creator:
            raise HTTPException(status_code=400, detail="creatorName is required")

        login_username = (username or creator).strip()
        if len(login_username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")

        role_norm = (role or "author").strip().lower()
        if role_norm not in {"admin", "editor", "author", "user"}:
            raise HTTPException(
                status_code=400, detail="role must be admin, editor, author, or user"
            )

        existing = self.user_repo.get_by_username(login_username)
        if existing is not None:
            raise HTTPException(
                status_code=409,
                detail=f'Username "{login_username}" already exists. Use reassign instead.',
            )

        # Case-insensitive username collision
        collision = self.db.execute(
            select(User).where(func.lower(User.username) == login_username.lower())
        ).scalar_one_or_none()
        if collision is not None:
            raise HTTPException(
                status_code=409,
                detail=f'Username "{login_username}" already exists. Use reassign instead.',
            )

        password_hash, password_salt = hash_password(password)
        disp = (display_name or creator).strip() or None
        new_user = User(
            username=login_username,
            password_hash=password_hash,
            password_salt=password_salt,
            role=role_norm,
            display_name=disp,
        )
        created = self.user_repo.create(new_user)

        posts_affected = 0
        creator_key = creator.lower()
        if reassign_posts and login_username.lower() != creator_key:
            result = self.db.execute(
                update(Post)
                .where(func.lower(func.trim(Post.creator)) == creator_key)
                .values(creator=login_username)
            )
            posts_affected = int(result.rowcount or 0)
            self.db.commit()
        else:
            # Count posts already under this creator label
            posts_affected = int(
                self.db.execute(
                    select(func.count(Post.id)).where(
                        func.lower(func.trim(Post.creator)) == creator_key
                    )
                ).scalar()
                or 0
            )

        return OrphanActionOut(
            ok=True,
            creatorName=creator,
            postsAffected=posts_affected,
            user=self._build_user_out(created),
        )

    def reassign_orphan_posts(
        self, creator_name: str, transfer_to_user_id: int, admin: User
    ) -> OrphanActionOut:
        """Move all posts from a creator string to an existing user account."""
        if (admin.role or "").strip().lower() != "admin":
            raise HTTPException(status_code=403, detail="Admin required")

        creator = (creator_name or "").strip()
        if not creator:
            raise HTTPException(status_code=400, detail="creatorName is required")

        recipient = self.user_repo.get(transfer_to_user_id)
        if recipient is None:
            raise HTTPException(status_code=404, detail="Transfer target user not found")

        transfer_username = (recipient.username or "").strip()
        if not transfer_username:
            raise HTTPException(status_code=400, detail="Transfer target has no username")

        creator_key = creator.lower()
        result = self.db.execute(
            update(Post)
            .where(func.lower(func.trim(Post.creator)) == creator_key)
            .values(creator=transfer_username)
        )
        posts_affected = int(result.rowcount or 0)
        self.db.commit()

        return OrphanActionOut(
            ok=True,
            creatorName=creator,
            postsAffected=posts_affected,
            user=self._build_user_out(recipient),
        )

    def delete_posts_by_creator(self, creator_name: str, admin: User) -> OrphanActionOut:
        """Delete all posts attributed to a creator name (orphan cleanup)."""
        if (admin.role or "").strip().lower() != "admin":
            raise HTTPException(status_code=403, detail="Admin required")

        creator = (creator_name or "").strip()
        if not creator:
            raise HTTPException(status_code=400, detail="creatorName is required")

        creator_key = creator.lower()
        post_ids = [
            str(r[0])
            for r in self.db.execute(
                select(Post.id).where(func.lower(func.trim(Post.creator)) == creator_key)
            ).all()
            if r and r[0] is not None
        ]

        posts_deleted = 0
        if post_ids:
            comment_ids_stmt = select(Comment.id).where(Comment.post_id.in_(post_ids))
            self.db.execute(
                delete(CommentVote).where(CommentVote.comment_id.in_(comment_ids_stmt))
            )
            self.db.execute(delete(Comment).where(Comment.post_id.in_(post_ids)))
            self.db.execute(
                delete(UserInteraction).where(UserInteraction.post_id.in_(post_ids))
            )
            self.db.execute(
                delete(PersonalizedFeed).where(PersonalizedFeed.post_id.in_(post_ids))
            )
            result = self.db.execute(delete(Post).where(Post.id.in_(post_ids)))
            posts_deleted = int(result.rowcount or 0)
            self.db.commit()

        return OrphanActionOut(
            ok=True,
            creatorName=creator,
            postsAffected=posts_deleted,
            user=None,
        )

    def create_user(self, payload: UserCreate) -> User:
        """Create a new user."""
        role = payload.role.strip().lower()
        if role not in {"admin", "editor", "author", "user"}:
            raise HTTPException(
                status_code=400, detail="role must be admin, editor, author, or user"
            )

        if len(payload.password) < 8:
            raise HTTPException(
                status_code=400, detail="Password must be at least 8 characters"
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

    def update_brand_byline(self, user: User, enabled: bool) -> MeOut:
        """Enable/disable post-only brand logo byline for this user."""
        user.brand_byline_enabled = bool(enabled)
        # If enabling without a logo yet, fall back to default brand asset for Wirefringe
        if user.brand_byline_enabled and not (user.brand_logo_url or "").strip():
            username = (user.username or "").strip().lower()
            if "wirefringe" in username.replace(" ", ""):
                user.brand_logo_url = "/wirefringe.png"
        updated = self.user_repo.update(user)
        return self._build_me_out(updated)

    def update_brand_logo(self, user: User, logo_url: str) -> MeOut:
        """Set the post-only brand logo URL (does not change site header/footer)."""
        url = (logo_url or "").strip()
        if not url:
            raise HTTPException(status_code=400, detail="Logo URL is required")
        user.brand_logo_url = url
        # Uploading a logo implies they want the feature available; keep current toggle state
        updated = self.user_repo.update(user)
        return self._build_me_out(updated)

    def change_password(
        self, user: User, current_password: str, new_password: str
    ) -> None:
        """Change user password (requires current password)."""
        if not verify_password(current_password, user.password_hash, user.password_salt):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        self._set_password(user, new_password)

    def admin_set_password(self, user_id: int, new_password: str, admin: User) -> None:
        """Admin sets any user's password without knowing the current one."""
        if (admin.role or "").strip().lower() != "admin":
            raise HTTPException(status_code=403, detail="Admin required")

        target = self.user_repo.get(user_id)
        if target is None:
            raise HTTPException(status_code=404, detail="User not found")

        self._set_password(target, new_password)

    def admin_set_role(self, user_id: int, role: str, admin: User) -> UserOut:
        """Admin changes any user's role."""
        if (admin.role or "").strip().lower() != "admin":
            raise HTTPException(status_code=403, detail="Admin required")

        allowed = {"admin", "editor", "author", "user"}
        new_role = (role or "").strip().lower()
        if new_role not in allowed:
            raise HTTPException(
                status_code=400,
                detail="role must be admin, editor, author, or user",
            )

        target = self.user_repo.get(user_id)
        if target is None:
            raise HTTPException(status_code=404, detail="User not found")

        old_role = (target.role or "").strip().lower()

        # Prevent an admin from demoting themselves (avoid lockout)
        if target.id == admin.id and old_role == "admin" and new_role != "admin":
            raise HTTPException(
                status_code=400,
                detail="You cannot change your own admin role",
            )

        target.role = new_role
        updated = self.user_repo.update(target)
        return self._build_user_out(updated)

    def _set_password(self, user: User, new_password: str) -> None:
        """Hash and store a new password for the given user."""
        if len(new_password or "") < 8:
            raise HTTPException(
                status_code=400, detail="New password must be at least 8 characters"
            )
        if len(new_password) > 200:
            raise HTTPException(status_code=400, detail="Password too long")

        password_hash, password_salt = hash_password(new_password)
        user.password_hash = password_hash
        user.password_salt = password_salt
        self.user_repo.update(user)

    def _creator_keys_for_user(self, user: User) -> list[str]:
        """Usernames/display names that may appear on posts.creator."""
        keys: list[str] = []
        username = (user.username or "").strip()
        if username:
            keys.append(username.lower())
        display = (user.display_name or "").strip()
        if display:
            keys.append(display.lower())
        # de-dupe while preserving order
        seen: set[str] = set()
        out: list[str] = []
        for k in keys:
            if k and k not in seen:
                seen.add(k)
                out.append(k)
        return out

    def _post_ids_for_creator_keys(self, creator_keys: list[str]) -> list[str]:
        if not creator_keys:
            return []
        rows = self.db.execute(
            select(Post.id).where(func.lower(func.trim(Post.creator)).in_(creator_keys))
        ).all()
        return [str(r[0]) for r in rows if r and r[0] is not None]

    def delete_user(
        self,
        user_id: int,
        current_user: User,
        posts_action: str = "transfer",
        transfer_to_user_id: int | None = None,
    ) -> AdminUserDeleteOut:
        """Delete a user, either deleting or transferring their posts."""
        target = self.user_repo.get(user_id)
        if target is None:
            raise HTTPException(status_code=404, detail="User not found")
        if target.id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot delete your own user")

        action = (posts_action or "transfer").strip().lower()
        if action not in {"delete", "transfer"}:
            raise HTTPException(
                status_code=400,
                detail="postsAction must be 'delete' or 'transfer'",
            )

        creator_keys = self._creator_keys_for_user(target)
        post_ids = self._post_ids_for_creator_keys(creator_keys)

        posts_deleted = 0
        posts_transferred = 0
        transfer_username: str | None = None

        if action == "transfer":
            if transfer_to_user_id is None:
                raise HTTPException(
                    status_code=400,
                    detail="transferToUserId is required when postsAction is transfer",
                )
            if int(transfer_to_user_id) == int(target.id):
                raise HTTPException(
                    status_code=400,
                    detail="Cannot transfer posts to the same user being deleted",
                )

            recipient = self.user_repo.get(transfer_to_user_id)
            if recipient is None:
                raise HTTPException(
                    status_code=404, detail="Transfer target user not found"
                )

            transfer_username = (recipient.username or "").strip()
            if not transfer_username:
                raise HTTPException(
                    status_code=400, detail="Transfer target has no username"
                )

            if post_ids and creator_keys:
                result = self.db.execute(
                    update(Post)
                    .where(func.lower(func.trim(Post.creator)).in_(creator_keys))
                    .values(creator=transfer_username)
                )
                posts_transferred = int(result.rowcount or 0)

        else:
            # delete posts and dependent rows
            if post_ids:
                # votes -> comments -> interactions/feeds for those posts -> posts
                comment_ids_stmt = select(Comment.id).where(Comment.post_id.in_(post_ids))
                self.db.execute(
                    delete(CommentVote).where(
                        CommentVote.comment_id.in_(comment_ids_stmt)
                    )
                )
                self.db.execute(delete(Comment).where(Comment.post_id.in_(post_ids)))
                self.db.execute(
                    delete(UserInteraction).where(UserInteraction.post_id.in_(post_ids))
                )
                self.db.execute(
                    delete(PersonalizedFeed).where(
                        PersonalizedFeed.post_id.in_(post_ids)
                    )
                )
                result = self.db.execute(delete(Post).where(Post.id.in_(post_ids)))
                posts_deleted = int(result.rowcount or 0)

        # Remove rows that FK to this user
        self.db.execute(
            delete(UserInteraction).where(UserInteraction.user_id == target.id)
        )
        self.db.execute(
            delete(PersonalizedFeed).where(PersonalizedFeed.user_id == target.id)
        )

        self.db.delete(target)
        self.db.commit()

        return AdminUserDeleteOut(
            ok=True,
            postsDeleted=posts_deleted,
            postsTransferred=posts_transferred,
            transferToUsername=transfer_username,
        )
