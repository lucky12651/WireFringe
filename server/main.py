from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
import re
import unicodedata
import uuid

from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session
from typing import Generator

from .db import PROJECT_ROOT, SessionLocal, engine
from .auth import authenticate, hash_password, verify_password
from .models import Comment, CommentVote, Post, User
from .schemas import (
    AdminCommentOut,
    CommentCreateRequest,
    CommentOut,
    CommentTrendOut,
    CommentVoteRequest,
    ImportResult,
    LoginRequest,
    MediaFileOut,
    MeOut,
    PendingCountOut,
    PasswordChangeRequest,
    PostOut,
    PostUpsert,
    ProfileUpdateRequest,
    UserCreate,
    UserOut,
)
from .wordpress_import import import_wordpress_export

app = FastAPI(title="Coffee n Blog API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"] ,
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=(
        # For local dev: override with env var in production
        __import__("os").environ.get("BLOG_SESSION_SECRET")
        or "dev-secret-change-me"
    ),
    session_cookie="blog_session",
    same_site="lax",
    https_only=False,
)

STATIC_DIR = PROJECT_ROOT / "static"
DEFAULT_WP_XML = PROJECT_ROOT / "coffeenblog.WordPress.2026-03-02.xml"

UPLOADS_DIR = STATIC_DIR / "uploads"

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _ensure_user_profile_columns() -> None:
    """Best-effort, migration-less schema upgrade for SQLite.

    This project uses `Base.metadata.create_all`, which won't add new columns
    to an existing table. We keep things simple by ALTER TABLE ADD COLUMN when
    needed.
    """

    with engine.begin() as conn:
        rows = conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()
        if not rows:
            return

        existing = {str(r[1]) for r in rows}  # (cid, name, type, notnull, dflt_value, pk)

        if "display_name" not in existing:
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN display_name VARCHAR")
        if "avatar_url" not in existing:
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN avatar_url VARCHAR")


def _ensure_comment_moderation_columns() -> None:
    """Best-effort, migration-less schema upgrade for SQLite comments moderation."""

    with engine.begin() as conn:
        rows = conn.exec_driver_sql("PRAGMA table_info(comments)").fetchall()
        if not rows:
            return

        existing = {str(r[1]) for r in rows}  # (cid, name, type, notnull, dflt_value, pk)

        if "approved" not in existing:
            # Default new comments to pending (0). Immediately after adding the column,
            # mark existing rows as approved so we don't hide legacy comments.
            conn.exec_driver_sql(
                "ALTER TABLE comments ADD COLUMN approved INTEGER NOT NULL DEFAULT 0"
            )
            conn.exec_driver_sql("UPDATE comments SET approved = 1")


def _me_out(user: User) -> MeOut:
    return MeOut(
        id=user.id,
        username=user.username,
        role=user.role,
        displayName=(user.display_name or None),
        avatarUrl=(user.avatar_url or None),
    )


def _build_author_lookup(db: Session) -> dict[str, User]:
    """Lookup users by username and (optionally) display_name, case-insensitive."""

    users = db.execute(select(User).order_by(User.id.asc())).scalars().all()
    lookup: dict[str, User] = {}
    for u in users:
        username_key = (u.username or "").strip().lower()
        if username_key:
            lookup[username_key] = u

        display_key = (u.display_name or "").strip().lower()
        if display_key and display_key not in lookup:
            lookup[display_key] = u

    return lookup


def _post_out(post: Post, author_lookup: dict[str, User] | None = None) -> PostOut:
    creator_raw = (post.creator or "").strip() or None
    author = None
    if author_lookup is not None and creator_raw:
        author = author_lookup.get(creator_raw.lower())

    if author is not None:
        creator_name = (author.display_name or author.username).strip() or author.username
        creator_avatar = (author.avatar_url or None)
    else:
        creator_name = creator_raw
        creator_avatar = None

    return PostOut(
        id=post.id,
        title=post.title,
        link=post.link,
        creator=post.creator,
        creatorName=creator_name,
        creatorAvatarUrl=creator_avatar,
        content=post.content,
        excerpt=post.excerpt,
        bucket=post.bucket,
        readMinutes=post.read_minutes,
        ogImg=post.og_img,
        date=post.published_at,
    )


def _comment_out(c: Comment, my_vote: str | None = None) -> CommentOut:
    return CommentOut(
        id=c.id,
        postId=c.post_id,
        name=c.name,
        comment=c.body,
        likes=c.likes,
        dislikes=c.dislikes,
        myVote=my_vote,
        createdAt=c.created_at,
    )


def _get_existing_visitor_id(request: Request) -> str | None:
    raw = request.session.get("visitor_id")
    if not raw:
        return None
    s = str(raw).strip()
    return s or None


def _get_or_create_visitor_id(request: Request) -> str:
    existing = _get_existing_visitor_id(request)
    if existing:
        return existing

    visitor_id = uuid.uuid4().hex
    request.session["visitor_id"] = visitor_id
    return visitor_id


async def _store_uploaded_image(file: UploadFile) -> str:
    content_type = (file.content_type or "").lower()
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are allowed")

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    # Keep extension if present; otherwise derive from content-type.
    suffix = Path(file.filename or "").suffix.lower()
    if not suffix:
        suffix = ".png" if content_type == "image/png" else ".jpg"

    name = f"{uuid.uuid4().hex}{suffix}"
    dest = UPLOADS_DIR / name

    # Simple size limit: 5MB
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large (max 5MB)")
    dest.write_bytes(data)

    return f"/static/uploads/{name}"


def _slugify_title(title: str) -> str:
    s = str(title or "")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.lower().strip().replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"^-+|-+$", "", s)
    s = re.sub(r"-+", "-", s)
    s = (s[:90] or "post")
    return s


@app.get("/")
def root() -> dict:
    return {
        "ok": True,
        "service": "Coffee n Blog API",
        "ui": "http://127.0.0.1:3000",
    }


@app.get("/admin")
def admin_ui_disabled() -> None:
    raise HTTPException(status_code=404, detail="UI is served by Next.js (http://127.0.0.1:3000)")


@app.get("/admin/post")
def admin_post_ui_disabled() -> None:
    raise HTTPException(status_code=404, detail="UI is served by Next.js (http://127.0.0.1:3000)")


@app.get("/post")
def post_ui_disabled() -> None:
    raise HTTPException(status_code=404, detail="UI is served by Next.js (http://127.0.0.1:3000)")


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}


def _require_user(request: Request, db: Session) -> User:
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = db.get(User, int(user_id))
    if user is None:
        request.session.clear()
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def _require_admin(user: User) -> None:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")


def _require_staff(user: User) -> None:
    if user.role not in {"admin", "editor"}:
        raise HTTPException(status_code=403, detail="Admin/editor required")


@app.get("/api/posts", response_model=list[PostOut])
def list_posts(db: Session = Depends(get_db)) -> list[PostOut]:
    posts = db.execute(select(Post).order_by(Post.published_at.desc().nullslast())).scalars().all()
    author_lookup = _build_author_lookup(db)
    return [_post_out(p, author_lookup) for p in posts]


@app.get("/api/posts/{post_id}", response_model=PostOut)
def get_post(post_id: str, db: Session = Depends(get_db)) -> PostOut:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    author_lookup = _build_author_lookup(db)
    return _post_out(post, author_lookup)


@app.get("/api/post", response_model=PostOut)
def get_post_by_query(id: str, db: Session = Depends(get_db)) -> PostOut:
    post = db.get(Post, id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    author_lookup = _build_author_lookup(db)
    return _post_out(post, author_lookup)


@app.get("/api/post/by-slug", response_model=PostOut)
def get_post_by_slug(slug: str, db: Session = Depends(get_db)) -> PostOut:
    slug = (slug or "").strip().lower()
    if not slug:
        raise HTTPException(status_code=400, detail="Missing slug")

    posts = (
        db.execute(select(Post).order_by(Post.published_at.desc().nullslast(), Post.id.desc()))
        .scalars()
        .all()
    )

    match = None
    for p in posts:
        if _slugify_title(p.title) == slug:
            match = p
            break

    if match is None:
        raise HTTPException(status_code=404, detail="Post not found")

    author_lookup = _build_author_lookup(db)
    return _post_out(match, author_lookup)


@app.get("/api/posts/{post_id:path}/comments", response_model=list[CommentOut])
def list_comments(post_id: str, request: Request, db: Session = Depends(get_db)) -> list[CommentOut]:
    comments = (
        db.execute(
            select(Comment)
            .where(Comment.post_id == post_id)
            .where(Comment.approved.is_(True))
            .order_by(Comment.likes.desc(), Comment.created_at.desc(), Comment.id.desc())
        )
        .scalars()
        .all()
    )

    visitor_id = _get_existing_visitor_id(request)
    vote_by_comment_id: dict[int, str] = {}
    if visitor_id and comments:
        ids = [int(c.id) for c in comments]
        rows = db.execute(
            select(CommentVote.comment_id, CommentVote.direction).where(
                CommentVote.visitor_id == visitor_id,
                CommentVote.comment_id.in_(ids),
            )
        ).all()
        for cid, direction in rows:
            if cid is None:
                continue
            d = (direction or "").strip().lower()
            if d in {"like", "dislike"}:
                vote_by_comment_id[int(cid)] = d

    return [_comment_out(c, vote_by_comment_id.get(int(c.id))) for c in comments]


@app.post("/api/posts/{post_id:path}/comments", response_model=CommentOut)
def create_comment(post_id: str, payload: CommentCreateRequest, db: Session = Depends(get_db)) -> CommentOut:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    name = (payload.name or "").strip()
    email = (payload.email or "").strip()
    body = (payload.comment or "").strip()

    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    if len(name) > 60:
        raise HTTPException(status_code=400, detail="Name too long (max 60 chars)")

    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    if len(email) > 160:
        raise HTTPException(status_code=400, detail="Email too long (max 160 chars)")
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Email looks invalid")

    if not body:
        raise HTTPException(status_code=400, detail="Comment is required")
    if len(body) > 5000:
        raise HTTPException(status_code=400, detail="Comment too long (max 5000 chars)")

    c = Comment(
        post_id=post_id,
        name=name,
        email=email,
        body=body,
        likes=0,
        dislikes=0,
        approved=False,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return _comment_out(c)


@app.post("/api/comments/{comment_id}/vote", response_model=CommentOut)
def vote_comment(
    comment_id: int,
    payload: CommentVoteRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> CommentOut:
    c = db.get(Comment, int(comment_id))
    if c is None:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Pending/unapproved comments are not visible publicly.
    if not bool(getattr(c, "approved", False)):
        raise HTTPException(status_code=404, detail="Comment not found")

    visitor_id = _get_or_create_visitor_id(request)
    direction = payload.direction

    existing = db.execute(
        select(CommentVote)
        .where(CommentVote.comment_id == int(c.id))
        .where(CommentVote.visitor_id == visitor_id)
    ).scalar_one_or_none()

    likes = int(c.likes or 0)
    dislikes = int(c.dislikes or 0)
    now = datetime.utcnow()
    my_vote: str | None = None

    if existing is None:
        db.add(
            CommentVote(
                comment_id=int(c.id),
                visitor_id=visitor_id,
                direction=direction,
                created_at=now,
                updated_at=now,
            )
        )
        if direction == "like":
            likes += 1
        else:
            dislikes += 1
        my_vote = direction
    else:
        prev = (existing.direction or "").strip().lower()
        if prev == direction:
            # Toggle off
            db.delete(existing)
            if direction == "like":
                likes = max(0, likes - 1)
            else:
                dislikes = max(0, dislikes - 1)
            my_vote = None
        else:
            # Switch vote
            existing.direction = direction
            existing.updated_at = now

            if prev == "like":
                likes = max(0, likes - 1)
            elif prev == "dislike":
                dislikes = max(0, dislikes - 1)

            if direction == "like":
                likes += 1
            else:
                dislikes += 1

            my_vote = direction

    c.likes = likes
    c.dislikes = dislikes

    db.commit()
    db.refresh(c)
    return _comment_out(c, my_vote)


@app.post("/api/admin/login", response_model=MeOut)
def admin_login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> MeOut:
    auth_user = authenticate(db, payload.username, payload.password)
    if auth_user is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    request.session["user_id"] = auth_user.id
    user = db.get(User, int(auth_user.id))
    if user is None:
        request.session.clear()
        raise HTTPException(status_code=401, detail="Not authenticated")
    return _me_out(user)


@app.post("/api/admin/logout")
def admin_logout(request: Request) -> dict:
    request.session.clear()
    return {"ok": True}


@app.get("/api/admin/me", response_model=MeOut)
def admin_me(request: Request, db: Session = Depends(get_db)) -> MeOut:
    user = _require_user(request, db)
    return _me_out(user)


@app.put("/api/admin/profile", response_model=MeOut)
def admin_update_profile(
    payload: ProfileUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> MeOut:
    user = _require_user(request, db)

    if payload.displayName is not None:
        name = (payload.displayName or "").strip()
        if not name:
            user.display_name = None
        else:
            if len(name) > 80:
                raise HTTPException(status_code=400, detail="Display name too long (max 80 chars)")
            user.display_name = name

    db.commit()
    db.refresh(user)
    return _me_out(user)


@app.post("/api/admin/profile/photo", response_model=MeOut)
async def admin_upload_profile_photo(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> MeOut:
    user = _require_user(request, db)

    url = await _store_uploaded_image(file)
    user.avatar_url = url
    db.commit()
    db.refresh(user)
    return _me_out(user)


@app.put("/api/admin/profile/password")
def admin_change_password(
    payload: PasswordChangeRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    user = _require_user(request, db)

    if not verify_password(payload.currentPassword, user.password_hash, user.password_salt):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    new_pw = payload.newPassword or ""
    if len(new_pw) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    password_hash, password_salt = hash_password(new_pw)
    user.password_hash = password_hash
    user.password_salt = password_salt
    db.commit()

    return {"ok": True}


@app.get("/api/admin/posts", response_model=list[PostOut])
def admin_list_posts(request: Request, db: Session = Depends(get_db)) -> list[PostOut]:
    user = _require_user(request, db)

    if user.role == "author":
        posts = (
            db.execute(
                select(Post)
                .where(Post.creator == user.username)
                .order_by(Post.published_at.desc().nullslast())
            )
            .scalars()
            .all()
        )
        author_lookup = _build_author_lookup(db)
        return [_post_out(p, author_lookup) for p in posts]

    return list_posts(db)


@app.get("/api/admin/comments", response_model=list[AdminCommentOut])
def admin_list_comments(request: Request, db: Session = Depends(get_db)) -> list[AdminCommentOut]:
    user = _require_user(request, db)

    stmt = select(Comment, Post.title).outerjoin(Post, Post.id == Comment.post_id)
    if user.role == "author":
        stmt = stmt.where(Post.creator == user.username)

    rows = db.execute(stmt.order_by(Comment.created_at.desc(), Comment.id.desc())).all()

    out: list[AdminCommentOut] = []
    for c, post_title in rows:
        out.append(
            AdminCommentOut(
                id=c.id,
                postId=c.post_id,
                postTitle=post_title,
                name=c.name,
                email=c.email,
                comment=c.body,
                likes=c.likes,
                dislikes=c.dislikes,
                approved=bool(getattr(c, "approved", True)),
                createdAt=c.created_at,
            )
        )
    return out


@app.get("/api/admin/comments/pending-count", response_model=PendingCountOut)
def admin_pending_comment_count(request: Request, db: Session = Depends(get_db)) -> PendingCountOut:
    user = _require_user(request, db)

    if user.role == "author":
        count = db.execute(
            select(func.count(Comment.id))
            .select_from(Comment)
            .join(Post, Post.id == Comment.post_id)
            .where(Comment.approved.is_(False))
            .where(Post.creator == user.username)
        ).scalar_one()
    else:
        _require_staff(user)
        count = db.execute(select(func.count(Comment.id)).where(Comment.approved.is_(False))).scalar_one()

    return PendingCountOut(count=int(count or 0))


@app.post("/api/admin/comments/{comment_id}/approve")
def admin_approve_comment(comment_id: int, request: Request, db: Session = Depends(get_db)) -> dict:
    user = _require_user(request, db)
    _require_staff(user)

    c = db.get(Comment, int(comment_id))
    if c is None:
        raise HTTPException(status_code=404, detail="Comment not found")

    if not bool(getattr(c, "approved", False)):
        c.approved = True
        db.commit()

    return {"ok": True}


@app.delete("/api/admin/comments/{comment_id}/disapprove")
def admin_disapprove_comment(comment_id: int, request: Request, db: Session = Depends(get_db)) -> dict:
    user = _require_user(request, db)
    _require_staff(user)

    c = db.get(Comment, int(comment_id))
    if c is None:
        raise HTTPException(status_code=404, detail="Comment not found")

    if bool(getattr(c, "approved", False)):
        raise HTTPException(status_code=400, detail="Comment is already approved")

    db.execute(delete(CommentVote).where(CommentVote.comment_id == int(comment_id)))
    db.delete(c)
    db.commit()
    return {"ok": True}


@app.get("/api/admin/comments/trending", response_model=list[CommentTrendOut])
def admin_trending_comments(
    request: Request,
    db: Session = Depends(get_db),
    days: int = 15,
    limit: int = 8,
) -> list[CommentTrendOut]:
    user = _require_user(request, db)

    days = max(1, min(int(days or 15), 365))
    limit = max(1, min(int(limit or 8), 25))
    since = datetime.utcnow() - timedelta(days=days)

    stmt = (
        select(Comment, Post.title)
        .outerjoin(Post, Post.id == Comment.post_id)
        .where(Comment.created_at >= since)
    )
    if user.role == "author":
        stmt = stmt.where(Post.creator == user.username)

    rows = db.execute(
        stmt.order_by(Comment.likes.desc(), Comment.created_at.desc(), Comment.id.desc()).limit(limit)
    ).all()

    out: list[CommentTrendOut] = []
    for c, post_title in rows:
        preview = (c.body or "").strip().replace("\n", " ")
        preview = " ".join(preview.split())
        preview = (preview[:140] + "…") if len(preview) > 140 else preview
        out.append(
            CommentTrendOut(
                id=c.id,
                postId=c.post_id,
                postTitle=post_title,
                name=c.name,
                commentPreview=preview,
                likes=c.likes,
                createdAt=c.created_at,
            )
        )
    return out


@app.delete("/api/admin/comments/{comment_id}")
def admin_delete_comment(comment_id: int, request: Request, db: Session = Depends(get_db)) -> dict:
    user = _require_user(request, db)
    _require_admin(user)

    c = db.get(Comment, int(comment_id))
    if c is None:
        raise HTTPException(status_code=404, detail="Comment not found")

    db.execute(delete(CommentVote).where(CommentVote.comment_id == int(comment_id)))
    db.delete(c)
    db.commit()
    return {"ok": True}


@app.get("/api/admin/post", response_model=PostOut)
def admin_get_post(id: str, request: Request, db: Session = Depends(get_db)) -> PostOut:
    user = _require_user(request, db)
    post = db.get(Post, id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if user.role == "author" and (post.creator or "").strip() != user.username:
        raise HTTPException(status_code=403, detail="Not allowed")

    author_lookup = _build_author_lookup(db)
    return _post_out(post, author_lookup)


@app.put("/api/admin/post", response_model=PostOut)
def admin_update_post_query(id: str, payload: PostUpsert, request: Request, db: Session = Depends(get_db)) -> PostOut:
    return admin_update_post(post_id=id, payload=payload, request=request, db=db)


@app.delete("/api/admin/post")
def admin_delete_post_query(id: str, request: Request, db: Session = Depends(get_db)) -> dict:
    return admin_delete_post(post_id=id, request=request, db=db)


@app.post("/api/admin/upload-image")
async def admin_upload_image(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> dict:
    _require_user(request, db)

    url = await _store_uploaded_image(file)
    return {"url": url}


@app.get("/api/admin/media", response_model=list[MediaFileOut])
def admin_list_media(request: Request, db: Session = Depends(get_db)) -> list[MediaFileOut]:
    _require_user(request, db)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    items: list[MediaFileOut] = []
    for p in UPLOADS_DIR.glob("*"):
        if not p.is_file():
            continue
        name = p.name
        if name.startswith("."):
            continue

        st = p.stat()
        modified = datetime.fromtimestamp(st.st_mtime, tz=timezone.utc)
        items.append(
            MediaFileOut(
                name=name,
                url=f"/static/uploads/{name}",
                size=int(st.st_size),
                modifiedAt=modified,
            )
        )

    items.sort(key=lambda x: x.modifiedAt, reverse=True)
    return items


@app.post("/api/admin/posts", response_model=PostOut)
def admin_create_post(payload: PostUpsert, request: Request, db: Session = Depends(get_db)) -> PostOut:
    user = _require_user(request, db)

    post_id = str(uuid.uuid4())
    excerpt = payload.excerpt
    if excerpt is None:
        excerpt = (payload.content or "").strip()
        excerpt = excerpt[:180]

    post = Post(
        id=post_id,
        title=payload.title,
        link=None,
        creator=(user.username if user.role == "author" else (payload.creator or user.username)),
        content=payload.content or "",
        excerpt=excerpt or "",
        bucket=payload.bucket or "Tech",
        read_minutes=payload.readMinutes,
        og_img=payload.ogImg,
        published_at=None,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    author_lookup = _build_author_lookup(db)
    return _post_out(post, author_lookup)


@app.put("/api/admin/posts/{post_id}", response_model=PostOut)
def admin_update_post(post_id: str, payload: PostUpsert, request: Request, db: Session = Depends(get_db)) -> PostOut:
    user = _require_user(request, db)
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if user.role == "author" and (post.creator or "").strip() != user.username:
        raise HTTPException(status_code=403, detail="Not allowed")

    post.title = payload.title
    post.bucket = payload.bucket or post.bucket
    post.content = payload.content or ""
    post.creator = user.username if user.role == "author" else (payload.creator or user.username)
    post.og_img = payload.ogImg
    post.read_minutes = payload.readMinutes
    if payload.excerpt is None:
        post.excerpt = (post.content or "").strip()[:180]
    else:
        post.excerpt = payload.excerpt

    db.commit()
    db.refresh(post)

    author_lookup = _build_author_lookup(db)
    return _post_out(post, author_lookup)


@app.post("/api/admin/posts/{post_id}/publish", response_model=PostOut)
def admin_publish_post(post_id: str, request: Request, db: Session = Depends(get_db)) -> PostOut:
    user = _require_user(request, db)
    if user.role == "author":
        raise HTTPException(status_code=403, detail="Editor or admin required")

    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.published_at is None:
        post.published_at = datetime.utcnow()

    db.commit()
    db.refresh(post)

    author_lookup = _build_author_lookup(db)
    return _post_out(post, author_lookup)


@app.delete("/api/admin/posts/{post_id}")
def admin_delete_post(post_id: str, request: Request, db: Session = Depends(get_db)) -> dict:
    user = _require_user(request, db)
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if user.role == "author" and (post.creator or "").strip() != user.username:
        raise HTTPException(status_code=403, detail="Not allowed")

    db.delete(post)
    db.commit()
    return {"ok": True}


@app.get("/api/admin/users", response_model=list[UserOut])
def admin_list_users(request: Request, db: Session = Depends(get_db)) -> list[UserOut]:
    user = _require_user(request, db)
    _require_admin(user)
    users = db.execute(select(User).order_by(User.id.asc())).scalars().all()
    return [UserOut(id=u.id, username=u.username, role=u.role) for u in users]


@app.post("/api/admin/users", response_model=UserOut)
def admin_create_user(payload: UserCreate, request: Request, db: Session = Depends(get_db)) -> UserOut:
    user = _require_user(request, db)
    _require_admin(user)

    role = payload.role.strip().lower()
    if role not in {"admin", "editor", "author"}:
        raise HTTPException(status_code=400, detail="role must be admin, editor, or author")

    existing = db.execute(select(User).where(User.username == payload.username)).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=409, detail="Username already exists")

    password_hash, password_salt = hash_password(payload.password)
    new_user = User(
        username=payload.username,
        password_hash=password_hash,
        password_salt=password_salt,
        role=role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return UserOut(id=new_user.id, username=new_user.username, role=new_user.role)


@app.delete("/api/admin/users/{user_id}")
def admin_delete_user(user_id: int, request: Request, db: Session = Depends(get_db)) -> dict:
    user = _require_user(request, db)
    _require_admin(user)

    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own user")

    db.delete(target)
    db.commit()
    return {"ok": True}


@app.post("/api/import/wordpress", response_model=ImportResult)
def import_from_wordpress(db: Session = Depends(get_db)) -> ImportResult:
    if not DEFAULT_WP_XML.exists():
        raise HTTPException(
            status_code=404,
            detail=f"WordPress export XML not found at {DEFAULT_WP_XML.name}",
        )

    imported = import_wordpress_export(db, DEFAULT_WP_XML)
    return ImportResult(imported=imported)


@app.on_event("startup")
def on_startup() -> None:
    from .db import Base

    Base.metadata.create_all(bind=engine)
    _ensure_user_profile_columns()
    _ensure_comment_moderation_columns()

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    # If DB is empty and the export XML is present, import once automatically.
    db = SessionLocal()
    try:
        has_any = db.execute(select(Post.id).limit(1)).first() is not None
        if not has_any and DEFAULT_WP_XML.exists():
            import_wordpress_export(db, DEFAULT_WP_XML)
    finally:
        db.close()
