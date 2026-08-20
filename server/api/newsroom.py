from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ..dependencies import get_db, require_staff, require_user
from ..schemas import (
    FollowIn,
    FollowOut,
    ForgotPasswordIn,
    LoginOut,
    LoginRequest,
    TwoFactorLoginIn,
    FrontpageIn,
    MastheadIn,
    NewsletterIssueCreate,
    NewsletterIssueOut,
    NewsletterSubCreate,
    NewsletterSubOut,
    NotifyPrefsIn,
    RedirectIn,
    RedirectOut,
    ResetPasswordIn,
    TipCreate,
    TipOut,
    TwoFactorConfirmIn,
    VerifyEmailIn,
)
from ..services.newsroom_service import SECTIONS, NewsroomService
from ..services.post_service import PostService

router = APIRouter()


def get_newsroom(db: Session = Depends(get_db)) -> NewsroomService:
    return NewsroomService(db)


def get_posts(db: Session = Depends(get_db)) -> PostService:
    return PostService(db)


@router.get("/frontpage")
def public_frontpage(
    service: NewsroomService = Depends(get_newsroom),
    posts: PostService = Depends(get_posts),
) -> dict:
    posts.publish_due_scheduled()
    layout = service.get_frontpage()
    by_id = {p.id: p for p in posts.list_posts(public=True)}
    def pick(ids):
        return [by_id[i] for i in ids if i in by_id]
    breaking = by_id.get(layout.get("breakingId") or "")
    if breaking is None:
        breaking = next((p for p in by_id.values() if getattr(p, "isBreaking", False)), None)
    return {
        **layout,
        "hero": pick(layout.get("heroIds") or []),
        "top": pick(layout.get("topIds") or []),
        "breaking": breaking,
        "sections": list(SECTIONS.keys()),
    }


@router.put("/admin/frontpage")
def admin_save_frontpage(
    payload: FrontpageIn,
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> dict:
    require_staff(require_user(request, db))
    return service.save_frontpage(payload)


@router.get("/masthead")
def public_masthead(service: NewsroomService = Depends(get_newsroom)) -> dict:
    return service.get_masthead()


@router.put("/admin/masthead")
def admin_save_masthead(
    payload: MastheadIn,
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> dict:
    require_staff(require_user(request, db))
    return service.save_masthead(payload)


@router.post("/newsletter/subscribe", response_model=NewsletterSubOut)
def subscribe(payload: NewsletterSubCreate, service: NewsroomService = Depends(get_newsroom)) -> NewsletterSubOut:
    return service.subscribe(str(payload.email), payload.source)


@router.get("/admin/newsletter/subscribers", response_model=list[NewsletterSubOut])
def admin_subscribers(
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> list[NewsletterSubOut]:
    require_staff(require_user(request, db))
    return service.list_subscribers()


@router.post("/admin/newsletter/issues", response_model=NewsletterIssueOut)
def admin_create_issue(
    payload: NewsletterIssueCreate,
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> NewsletterIssueOut:
    require_staff(require_user(request, db))
    return service.create_issue(payload.subject, payload.body)


@router.get("/admin/newsletter/issues", response_model=list[NewsletterIssueOut])
def admin_list_issues(
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> list[NewsletterIssueOut]:
    require_staff(require_user(request, db))
    return service.list_issues()


@router.post("/tips", response_model=TipOut)
def create_tip(payload: TipCreate, service: NewsroomService = Depends(get_newsroom)) -> TipOut:
    return service.create_tip(payload.contact, payload.message)


@router.get("/admin/tips", response_model=list[TipOut])
def admin_tips(
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> list[TipOut]:
    require_staff(require_user(request, db))
    return service.list_tips()


@router.get("/admin/tips/unread-count")
def admin_tips_unread(
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> dict:
    require_staff(require_user(request, db))
    return {"count": service.unread_tips()}


@router.post("/admin/tips/{tip_id:int}/read", response_model=TipOut)
def admin_tip_read(
    tip_id: int,
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> TipOut:
    require_staff(require_user(request, db))
    return service.mark_tip_read(tip_id)


@router.delete("/admin/tips/{tip_id:int}")
def admin_tip_delete(
    tip_id: int,
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> dict:
    require_staff(require_user(request, db))
    service.delete_tip(tip_id)
    return {"ok": True}


@router.get("/me/follows", response_model=list[FollowOut])
def my_follows(
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> list[FollowOut]:
    user = require_user(request, db)
    return service.list_follows(user.id)


@router.post("/me/follows", response_model=FollowOut)
def my_follow(
    payload: FollowIn,
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> FollowOut:
    user = require_user(request, db)
    return service.follow(user.id, payload.kind, payload.target)


@router.delete("/me/follows")
def my_unfollow(
    payload: FollowIn,
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> dict:
    user = require_user(request, db)
    service.unfollow(user.id, payload.kind, payload.target)
    return {"ok": True}


@router.put("/me/notifications")
def my_notifications(
    payload: NotifyPrefsIn,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    user = require_user(request, db)
    if payload.notifyReplies is not None:
        user.notify_replies = bool(payload.notifyReplies)
    if payload.notifyEditorial is not None:
        user.notify_editorial = bool(payload.notifyEditorial)
    db.commit()
    return {"ok": True, "notifyReplies": user.notify_replies, "notifyEditorial": user.notify_editorial}


@router.get("/admin/redirects", response_model=list[RedirectOut])
def admin_redirects(
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> list[RedirectOut]:
    require_staff(require_user(request, db))
    return service.list_redirects()


@router.post("/admin/redirects", response_model=RedirectOut)
def admin_add_redirect(
    payload: RedirectIn,
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> RedirectOut:
    require_staff(require_user(request, db))
    return service.add_redirect(payload.fromPath, payload.toPath)


@router.delete("/admin/redirects/{redirect_id:int}")
def admin_del_redirect(
    redirect_id: int,
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> dict:
    require_staff(require_user(request, db))
    service.delete_redirect(redirect_id)
    return {"ok": True}


@router.get("/redirect")
def public_redirect(path: str, service: NewsroomService = Depends(get_newsroom)) -> dict:
    dest = service.lookup_redirect(path)
    if not dest:
        raise HTTPException(status_code=404, detail="No redirect")
    return {"to": dest}


@router.get("/admin/analytics")
def admin_analytics(
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> dict:
    require_staff(require_user(request, db))
    return service.analytics()


@router.get("/search")
def public_search(q: str = "", posts: PostService = Depends(get_posts)) -> list:
    return posts.search_posts(q)


@router.get("/section/{slug}")
def posts_by_section(slug: str, posts: PostService = Depends(get_posts)) -> dict:
    buckets = SECTIONS.get((slug or "").strip().lower())
    if not buckets:
        raise HTTPException(status_code=404, detail="Unknown section")
    items = [p for p in posts.list_posts(public=True) if p.bucket in buckets]
    return {"slug": slug, "buckets": buckets, "posts": items}


@router.get("/authors/{slug}")
def public_author(slug: str, posts: PostService = Depends(get_posts)) -> dict:
    return posts.get_author_page(slug)


@router.get("/feed.xml")
def rss_feed(posts: PostService = Depends(get_posts)) -> Response:
    return Response(content=posts.build_rss(), media_type="application/rss+xml")


@router.post("/auth/login", response_model=LoginOut, response_model_exclude_none=True)
def public_login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> LoginOut:
    """Public sign-in (not under /api/admin, so WAF/fail2ban does not treat it as a failed admin login)."""
    from .users import password_login
    from ..services import UserService

    return password_login(payload, request, UserService(db))


@router.post("/auth/login/2fa", response_model=LoginOut, response_model_exclude_none=True)
def public_login_2fa(
    payload: TwoFactorLoginIn,
    request: Request,
    db: Session = Depends(get_db),
) -> LoginOut:
    from .users import twofa_login
    from ..services import UserService

    return twofa_login(payload, request, UserService(db))


@router.post("/auth/forgot")
def forgot_password(payload: ForgotPasswordIn, service: NewsroomService = Depends(get_newsroom)) -> dict:
    return service.forgot_password(str(payload.email))


@router.post("/auth/reset")
def reset_password(payload: ResetPasswordIn, service: NewsroomService = Depends(get_newsroom)) -> dict:
    service.reset_password(payload.token, payload.newPassword)
    return {"ok": True}


@router.post("/auth/verify")
def verify_email(payload: VerifyEmailIn, service: NewsroomService = Depends(get_newsroom)) -> dict:
    service.verify_email(payload.token)
    return {"ok": True}


@router.post("/me/verify-email")
def send_verify(
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> dict:
    user = require_user(request, db)
    return service.request_verify(user)


@router.post("/me/2fa/setup")
def twofa_setup(
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> dict:
    user = require_user(request, db)
    return service.totp_setup(user)


@router.post("/me/2fa/confirm")
def twofa_confirm(
    payload: TwoFactorConfirmIn,
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> dict:
    user = require_user(request, db)
    service.totp_confirm(user, payload.code)
    return {"ok": True}


@router.delete("/me/2fa")
def twofa_off(
    request: Request,
    db: Session = Depends(get_db),
    service: NewsroomService = Depends(get_newsroom),
) -> dict:
    user = require_user(request, db)
    service.totp_disable(user)
    return {"ok": True}
