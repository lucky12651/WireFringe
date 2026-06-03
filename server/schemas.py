from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class PostOut(BaseModel):
    id: str
    title: str
    link: str | None = None
    creator: str | None = None
    creatorName: str | None = None
    creatorAvatarUrl: str | None = None
    content: str
    excerpt: str

    bucket: str
    readMinutes: int | None = None
    ogImg: str | None = None

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


class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "editor"


class UserSignup(BaseModel):
    username: str
    password: str
    displayName: str | None = None


class ProfileUpdateRequest(BaseModel):
    displayName: str | None = None


class PasswordChangeRequest(BaseModel):
    currentPassword: str
    newPassword: str


class PostUpsert(BaseModel):
    title: str
    bucket: str = "Tech"
    content: str = ""
    excerpt: str | None = None
    creator: str | None = None
    ogImg: str | None = None
    readMinutes: int | None = None


class NewsQueueItem(BaseModel):
    title: str
    link: str
    category: str
    status: str


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
    name: str
    email: str
    comment: str


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
