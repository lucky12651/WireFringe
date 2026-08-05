from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class PostOut(BaseModel):
    id: str
    title: str
    link: str | None = None
    creator: str | None = None
    creatorName: str | None = None
    creatorAvatarUrl: str | None = None
    # When true, public UI shows brand logo instead of username text on posts
    creatorBrandByline: bool = False
    creatorBrandLogoUrl: str | None = None
    content: str
    excerpt: str

    bucket: str
    readMinutes: int | None = None
    ogImg: str | None = None
    metaDescription: str | None = None
    keywords: str | None = None
    # Approved public comments only (pending do not count)
    commentCount: int = 0

    date: datetime | None = None


class PaginatedPostsOut(BaseModel):
    posts: list[PostOut]
    total: int


class CreatorCountOut(BaseModel):
    username: str
    count: int


class PostGrowthCountsOut(BaseModel):
    current: int
    prev: int


class MonthCountOut(BaseModel):
    key: str
    count: int


class LoginRequest(BaseModel):
    username: str
    password: str


class MeOut(BaseModel):
    id: int
    username: str
    role: str
    displayName: str | None = None
    avatarUrl: str | None = None
    brandBylineEnabled: bool = False
    brandLogoUrl: str | None = None
    token: str | None = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str
    user: MeOut


class UserOut(BaseModel):
    id: int
    username: str
    role: str
    avatarUrl: str | None = None
    displayName: str | None = None
    brandBylineEnabled: bool = False
    brandLogoUrl: str | None = None


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    role: str = "editor"


class UserSignup(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    displayName: str | None = Field(None, max_length=80)


class ProfileUpdateRequest(BaseModel):
    displayName: str | None = None


class BrandBylineUpdateRequest(BaseModel):
    """Toggle post-only brand logo byline (not site-wide branding)."""

    enabled: bool


class PasswordChangeRequest(BaseModel):
    currentPassword: str
    newPassword: str


class AdminPasswordSetRequest(BaseModel):
    """Admin sets another user's password (no current password required)."""

    newPassword: str = Field(..., min_length=8, max_length=200)


class AdminRoleUpdateRequest(BaseModel):
    """Admin changes another user's role."""

    role: str = Field(..., min_length=1, max_length=32)


class AdminUserDeleteRequest(BaseModel):
    """Options when deleting a user and their posts."""

    # "delete" removes their posts; "transfer" reassigns posts to another user
    postsAction: str = Field("transfer", min_length=1, max_length=32)
    transferToUserId: int | None = None


class AdminUserDeleteOut(BaseModel):
    ok: bool = True
    postsDeleted: int = 0
    postsTransferred: int = 0
    transferToUsername: str | None = None


class PostUpsert(BaseModel):
    title: str
    bucket: str = "Tech"
    content: str = ""
    excerpt: str | None = None
    creator: str | None = None
    ogImg: str | None = None
    readMinutes: int | None = None
    metaDescription: str | None = None
    keywords: str | None = None


class NewsQueueItem(BaseModel):
    title: str
    link: str
    category: str
    status: str


class RecentCacheItem(BaseModel):
    title: str
    link: str
    createdAt: datetime


class MediaFileOut(BaseModel):
    name: str
    url: str
    size: int
    modifiedAt: datetime


class CommentOut(BaseModel):
    id: int
    postId: str
    name: str
    comment: str
    likes: int
    dislikes: int
    myVote: Literal["like", "dislike"] | None = None
    createdAt: datetime


class CommentCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=60)
    email: EmailStr
    comment: str = Field(..., min_length=1, max_length=5000)


class CommentVoteRequest(BaseModel):
    direction: Literal["like", "dislike"]


class AdminCommentOut(BaseModel):
    id: int
    postId: str
    postTitle: str | None = None
    name: str
    email: str
    comment: str
    likes: int
    dislikes: int
    approved: bool
    createdAt: datetime


class PendingCountOut(BaseModel):
    count: int


class CommentTrendOut(BaseModel):
    id: int
    postId: str
    postTitle: str | None = None
    name: str
    commentPreview: str
    likes: int
    createdAt: datetime


class CategoryOut(BaseModel):
    id: int
    name: str
    createdAt: datetime


class CategoryCreate(BaseModel):
    name: str


class CategoryWithCountOut(BaseModel):
    id: int
    name: str
    count: int


class InteractionCreate(BaseModel):
    post_id: str
    interaction_type: str = "view"

class BotLogOut(BaseModel):
    id: int
    level: str
    message: str
    module: str | None = None
    createdAt: datetime

    class Config:
        from_attributes = True
