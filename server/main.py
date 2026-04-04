from __future__ import annotations

from pathlib import Path
import uuid

from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session
from typing import Generator

from .db import PROJECT_ROOT, SessionLocal, engine
from .auth import authenticate, hash_password
from .models import Post, User
from .schemas import (
    ImportResult,
    LoginRequest,
    MeOut,
    PostOut,
    PostUpsert,
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
INDEX_FILE = PROJECT_ROOT / "index.html"
ADMIN_FILE = PROJECT_ROOT / "admin.html"
POST_FILE = PROJECT_ROOT / "post.html"
ADMIN_POST_FILE = PROJECT_ROOT / "admin_post.html"
DEFAULT_WP_XML = PROJECT_ROOT / "coffeenblog.WordPress.2026-03-02.xml"

UPLOADS_DIR = STATIC_DIR / "uploads"

NEXT_OUT_DIR = PROJECT_ROOT / "web" / "out"

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

if (NEXT_OUT_DIR / "_next").exists():
    app.mount("/_next", StaticFiles(directory=str(NEXT_OUT_DIR / "_next")), name="next")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def serve_index() -> FileResponse:
    next_index = NEXT_OUT_DIR / "index.html"
    if next_index.exists():
        return FileResponse(str(next_index))
    if not INDEX_FILE.exists():
        raise HTTPException(status_code=404, detail="index.html not found")
    return FileResponse(str(INDEX_FILE))


@app.get("/admin")
def serve_admin() -> FileResponse:
    if not ADMIN_FILE.exists():
        raise HTTPException(status_code=404, detail="admin.html not found")
    return FileResponse(str(ADMIN_FILE))


@app.get("/admin/post")
def serve_admin_post() -> FileResponse:
    if not ADMIN_POST_FILE.exists():
        raise HTTPException(status_code=404, detail="admin_post.html not found")
    return FileResponse(str(ADMIN_POST_FILE))


@app.get("/post")
def serve_post() -> FileResponse:
    next_post = NEXT_OUT_DIR / "post" / "index.html"
    if next_post.exists():
        return FileResponse(str(next_post))
    if not POST_FILE.exists():
        raise HTTPException(status_code=404, detail="post.html not found")
    return FileResponse(str(POST_FILE))


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


@app.get("/api/posts", response_model=list[PostOut])
def list_posts(db: Session = Depends(get_db)) -> list[PostOut]:
    posts = db.execute(select(Post).order_by(Post.published_at.desc().nullslast())).scalars().all()
    return [
        PostOut(
            id=p.id,
            title=p.title,
            link=p.link,
            creator=p.creator,
            content=p.content,
            excerpt=p.excerpt,
            bucket=p.bucket,
            readMinutes=p.read_minutes,
            ogImg=p.og_img,
            date=p.published_at,
        )
        for p in posts
    ]


@app.get("/api/posts/{post_id}", response_model=PostOut)
def get_post(post_id: str, db: Session = Depends(get_db)) -> PostOut:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostOut(
        id=post.id,
        title=post.title,
        link=post.link,
        creator=post.creator,
        content=post.content,
        excerpt=post.excerpt,
        bucket=post.bucket,
        readMinutes=post.read_minutes,
        ogImg=post.og_img,
        date=post.published_at,
    )


@app.get("/api/post", response_model=PostOut)
def get_post_by_query(id: str, db: Session = Depends(get_db)) -> PostOut:
    post = db.get(Post, id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostOut(
        id=post.id,
        title=post.title,
        link=post.link,
        creator=post.creator,
        content=post.content,
        excerpt=post.excerpt,
        bucket=post.bucket,
        readMinutes=post.read_minutes,
        ogImg=post.og_img,
        date=post.published_at,
    )


@app.post("/api/admin/login", response_model=MeOut)
def admin_login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> MeOut:
    auth_user = authenticate(db, payload.username, payload.password)
    if auth_user is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    request.session["user_id"] = auth_user.id
    return MeOut(id=auth_user.id, username=auth_user.username, role=auth_user.role)


@app.post("/api/admin/logout")
def admin_logout(request: Request) -> dict:
    request.session.clear()
    return {"ok": True}


@app.get("/api/admin/me", response_model=MeOut)
def admin_me(request: Request, db: Session = Depends(get_db)) -> MeOut:
    user = _require_user(request, db)
    return MeOut(id=user.id, username=user.username, role=user.role)


@app.get("/api/admin/posts", response_model=list[PostOut])
def admin_list_posts(request: Request, db: Session = Depends(get_db)) -> list[PostOut]:
    _require_user(request, db)
    return list_posts(db)


@app.get("/api/admin/post", response_model=PostOut)
def admin_get_post(id: str, request: Request, db: Session = Depends(get_db)) -> PostOut:
    _require_user(request, db)
    post = db.get(Post, id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostOut(
        id=post.id,
        title=post.title,
        link=post.link,
        creator=post.creator,
        content=post.content,
        excerpt=post.excerpt,
        bucket=post.bucket,
        readMinutes=post.read_minutes,
        ogImg=post.og_img,
        date=post.published_at,
    )


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

    return {"url": f"/static/uploads/{name}"}


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
        creator=payload.creator or user.username,
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

    return PostOut(
        id=post.id,
        title=post.title,
        link=post.link,
        creator=post.creator,
        content=post.content,
        excerpt=post.excerpt,
        bucket=post.bucket,
        readMinutes=post.read_minutes,
        ogImg=post.og_img,
        date=post.published_at,
    )


@app.put("/api/admin/posts/{post_id}", response_model=PostOut)
def admin_update_post(post_id: str, payload: PostUpsert, request: Request, db: Session = Depends(get_db)) -> PostOut:
    user = _require_user(request, db)
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    post.title = payload.title
    post.bucket = payload.bucket or post.bucket
    post.content = payload.content or ""
    post.creator = payload.creator or user.username
    post.og_img = payload.ogImg
    post.read_minutes = payload.readMinutes
    if payload.excerpt is None:
        post.excerpt = (post.content or "").strip()[:180]
    else:
        post.excerpt = payload.excerpt

    db.commit()
    db.refresh(post)

    return PostOut(
        id=post.id,
        title=post.title,
        link=post.link,
        creator=post.creator,
        content=post.content,
        excerpt=post.excerpt,
        bucket=post.bucket,
        readMinutes=post.read_minutes,
        ogImg=post.og_img,
        date=post.published_at,
    )


@app.delete("/api/admin/posts/{post_id}")
def admin_delete_post(post_id: str, request: Request, db: Session = Depends(get_db)) -> dict:
    _require_user(request, db)
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
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
    if role not in {"admin", "editor"}:
        raise HTTPException(status_code=400, detail="role must be admin or editor")

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

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    # If DB is empty and the export XML is present, import once automatically.
    db = SessionLocal()
    try:
        has_any = db.execute(select(Post.id).limit(1)).first() is not None
        if not has_any and DEFAULT_WP_XML.exists():
            import_wordpress_export(db, DEFAULT_WP_XML)
    finally:
        db.close()
