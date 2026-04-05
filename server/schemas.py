from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class PostOut(BaseModel):
    id: str
    title: str
    link: str | None = None
    creator: str | None = None
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


class UserOut(BaseModel):
    id: int
    username: str
    role: str


class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "editor"


class PostUpsert(BaseModel):
    title: str
    bucket: str = "Tech"
    content: str = ""
    excerpt: str | None = None
    creator: str | None = None
    ogImg: str | None = None
    readMinutes: int | None = None
