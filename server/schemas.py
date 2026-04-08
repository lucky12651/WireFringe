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


class ImportResult(BaseModel):
    imported: int


class LoginRequest(BaseModel):
    username: str
    password: str


class MeOut(BaseModel):
    id: int
    username: str
    role: str
    displayName: str | None = None
    avatarUrl: str | None = None


class UserOut(BaseModel):
    id: int
    username: str
    role: str


class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "editor"


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
    createdAt: datetime


class CommentTrendOut(BaseModel):
    id: int
    postId: str
    postTitle: str | None = None
    name: str
    commentPreview: str
    likes: int
    createdAt: datetime
