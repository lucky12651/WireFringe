from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, model_validator


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
    accentColor: str | None = None
    design: str = "magazine"
    metaDescription: str | None = None
    keywords: str | None = None
    # Approved public comments only (pending do not count)
    commentCount: int = 0

    date: datetime | None = None
    status: str = "published"
    scheduledAt: datetime | None = None
    isBreaking: bool = False
    isPinned: bool = False
    isSponsored: bool = False
    isBot: bool = False
    isHidden: bool = False
    correction: str | None = None
    correctedAt: datetime | None = None
    updatedAt: datetime | None = None
    sourceUrl: str | None = None
    sourceName: str | None = None
    tags: list[str] = Field(default_factory=list)
    relatedIds: list[str] = Field(default_factory=list)
    viewCount: int = 0
    authorSlug: str | None = None
    authorBio: str | None = None
    extraCategories: list[str] = Field(default_factory=list)
    featuredIn: list[str] = Field(default_factory=list)


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
    username: str | None = None
    email: str | None = None
    password: str

    @model_validator(mode="after")
    def require_login(self):
        if not (self.email or self.username or "").strip():
            raise ValueError("Email is required")
        return self

    @property
    def login(self) -> str:
        return (self.email or self.username or "").strip()


class MeOut(BaseModel):
    id: int
    username: str
    role: str
    displayName: str | None = None
    email: str | None = None
    avatarUrl: str | None = None
    brandBylineEnabled: bool = False
    brandLogoUrl: str | None = None
    token: str | None = None
    bio: str | None = None
    emailVerified: bool = False
    notifyReplies: bool = True
    notifyEditorial: bool = True
    totpEnabled: bool = False


class TokenOut(BaseModel):
    access_token: str
    token_type: str
    user: MeOut


class LoginOut(BaseModel):
    access_token: str | None = None
    token_type: str = "bearer"
    user: MeOut | None = None
    requires2fa: bool = False
    ticket: str | None = None


class UserOut(BaseModel):
    # Real accounts: positive id. Orphan authors (no login): negative synthetic id.
    id: int
    username: str
    role: str
    avatarUrl: str | None = None
    displayName: str | None = None
    email: str | None = None
    brandBylineEnabled: bool = False
    brandLogoUrl: str | None = None
    # Extended for admin user management
    postCount: int = 0
    isOrphan: bool = False  # True when posts.creator has no matching users row


class UserCreate(BaseModel):
    username: str | None = Field(None, max_length=254)
    email: str | None = Field(None, max_length=254)
    password: str = Field(..., min_length=8)
    role: str = "editor"

    @model_validator(mode="after")
    def require_email(self):
        ident = (self.email or self.username or "").strip()
        if not ident:
            raise ValueError("Email is required")
        self.username = ident
        self.email = ident
        return self


class OrphanClaimRequest(BaseModel):
    """Create a real login account for a post-creator name (orphan author)."""

    creatorName: str = Field(..., min_length=1, max_length=80)
    # Login email (username field kept as alias for older clients)
    username: str | None = Field(None, max_length=254)
    email: str | None = Field(None, max_length=254)
    password: str = Field(..., min_length=8, max_length=200)
    role: str = "author"
    displayName: str | None = Field(None, max_length=80)
    # If True, rewrite posts.creator to the new login when it differs
    reassignPosts: bool = True


class OrphanReassignRequest(BaseModel):
    """Move all posts from an orphan creator name to an existing user."""

    creatorName: str = Field(..., min_length=1, max_length=80)
    transferToUserId: int


class OrphanDeletePostsRequest(BaseModel):
    """Delete every post attributed to a creator string (orphan or any)."""

    creatorName: str = Field(..., min_length=1, max_length=80)


class OrphanActionOut(BaseModel):
    ok: bool = True
    creatorName: str
    postsAffected: int = 0
    user: UserOut | None = None


class UserSignup(BaseModel):
    username: str | None = Field(None, max_length=254)
    email: str | None = Field(None, max_length=254)
    password: str = Field(..., min_length=8)
    displayName: str | None = Field(None, max_length=80)

    @model_validator(mode="after")
    def require_email(self):
        ident = (self.email or self.username or "").strip()
        if not ident:
            raise ValueError("Email is required")
        self.username = ident
        self.email = ident
        return self


class ProfileUpdateRequest(BaseModel):
    displayName: str | None = None
    email: str | None = None
    bio: str | None = None


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

    # delete = remove posts; transfer = move to another user; keep = leave posts (orphan author)
    postsAction: str = Field("transfer", min_length=1, max_length=32)
    transferToUserId: int | None = None


class AdminUserDeleteOut(BaseModel):
    ok: bool = True
    postsDeleted: int = 0
    postsTransferred: int = 0
    postsKept: int = 0
    transferToUsername: str | None = None


class AdminTransferPostsRequest(BaseModel):
    """Move one login account's posts to another login account."""

    transferToUserId: int


class PostUpsert(BaseModel):
    title: str
    bucket: str = "Tech"
    content: str = ""
    excerpt: str | None = None
    creator: str | None = None
    ogImg: str | None = None
    accentColor: str | None = None
    design: str | None = None
    readMinutes: int | None = None
    metaDescription: str | None = None
    keywords: str | None = None
    status: str | None = None
    scheduledAt: datetime | None = None
    isBreaking: bool | None = None
    isPinned: bool | None = None
    isSponsored: bool | None = None
    correction: str | None = None
    sourceUrl: str | None = None
    sourceName: str | None = None
    tags: str | None = None
    relatedIds: str | None = None
    extraCategories: list[str] | None = None
    featuredIn: list[str] | None = None


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
    comment: str = Field(..., min_length=1, max_length=5000)
    name: str | None = Field(None, max_length=60)
    email: str | None = Field(None, max_length=160)


class MyCommentOut(BaseModel):
    id: int
    postId: str
    postTitle: str | None = None
    comment: str
    approved: bool = False
    createdAt: datetime


class CommentVoteRequest(BaseModel):
    direction: Literal["like", "dislike"]


class CommentReportCreate(BaseModel):
    reason: str = Field(..., min_length=1, max_length=2000)


class CommentReportOut(BaseModel):
    id: int
    commentId: int
    comment: str
    commentAuthor: str
    postId: str
    postTitle: str | None = None
    reason: str
    reporterName: str | None = None
    createdAt: datetime


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

CONTACT_SUBJECTS = (
    "General inquiry",
    "Correction / update",
    "Advertising & partnerships",
    "Privacy request",
    "Technical issue",
    "Other",
)


class ContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    subject: str = Field(..., min_length=1, max_length=120)
    message: str = Field(..., min_length=1, max_length=5000)


class ContactOut(BaseModel):
    id: int
    name: str
    email: str
    subject: str
    message: str
    isRead: bool = False
    createdAt: datetime


class BotLogOut(BaseModel):
    id: int
    level: str
    message: str
    module: str | None = None
    createdAt: datetime

    class Config:
        from_attributes = True


class PostRevisionOut(BaseModel):
    id: int
    postId: str
    editorName: str | None = None
    title: str
    status: str | None = None
    createdAt: datetime


class NewsletterSubCreate(BaseModel):
    email: EmailStr
    source: str | None = None


class NewsletterSubOut(BaseModel):
    id: int
    email: str
    source: str | None = None
    isActive: bool = True
    createdAt: datetime


class NewsletterIssueCreate(BaseModel):
    subject: str = Field(..., min_length=1, max_length=200)
    body: str = Field(..., min_length=1)


class NewsletterIssueOut(BaseModel):
    id: int
    subject: str
    body: str
    sentAt: datetime | None = None
    createdAt: datetime


class TipCreate(BaseModel):
    contact: str | None = None
    message: str = Field(..., min_length=1, max_length=8000)


class TipOut(BaseModel):
    id: int
    contact: str | None = None
    message: str
    isRead: bool = False
    createdAt: datetime


class FollowIn(BaseModel):
    kind: Literal["topic", "author", "post"]
    target: str = Field(..., min_length=1, max_length=160)


class FollowOut(BaseModel):
    kind: str
    target: str


class RedirectIn(BaseModel):
    fromPath: str = Field(..., min_length=1, max_length=400)
    toPath: str = Field(..., min_length=1, max_length=400)


class RedirectOut(BaseModel):
    id: int
    fromPath: str
    toPath: str
    createdAt: datetime


class FrontpageIn(BaseModel):
    heroIds: list[str] = []
    topIds: list[str] = []
    breakingId: str | None = None


class MastheadIn(BaseModel):
    heading: str | None = None
    body: str | None = None
    staff: list[dict] | None = None


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    newPassword: str = Field(..., min_length=8)


class VerifyEmailIn(BaseModel):
    token: str


class NotifyPrefsIn(BaseModel):
    notifyReplies: bool | None = None
    notifyEditorial: bool | None = None


class TwoFactorConfirmIn(BaseModel):
    code: str


class TwoFactorLoginIn(BaseModel):
    ticket: str
    code: str


class StatusChangeIn(BaseModel):
    status: str
    scheduledAt: datetime | None = None
