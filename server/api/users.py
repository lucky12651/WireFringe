from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..auth import create_access_token
from ..dependencies import get_db, require_admin, require_user
from ..schemas import (
    AdminPasswordSetRequest,
    AdminRoleUpdateRequest,
    AdminTransferPostsRequest,
    AdminUserDeleteOut,
    AdminUserDeleteRequest,
    LoginOut,
    LoginRequest,
    MeOut,
    OrphanActionOut,
    OrphanClaimRequest,
    OrphanDeletePostsRequest,
    OrphanReassignRequest,
    PasswordChangeRequest,
    ProfileUpdateRequest,
    TokenOut,
    TwoFactorLoginIn,
    UserCreate,
    UserOut,
    UserSignup,
)
from ..services import UserService

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)


def complete_login(request: Request, service: UserService, user_model) -> LoginOut:
    token = create_access_token(data={"sub": str(user_model.id), "role": user_model.role})
    request.session["user_id"] = user_model.id
    me = service._build_me_out(user_model)
    me.token = token
    return LoginOut(access_token=token, token_type="bearer", user=me, requires2fa=False)


def password_login(payload: LoginRequest, request: Request, service: UserService) -> LoginOut:
    user_model = service.authenticate_user(payload.login, payload.password)
    if user_model is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if bool(getattr(user_model, "totp_enabled", False)) and getattr(user_model, "totp_secret", None):
        from ..services.newsroom_service import NewsroomService

        ticket = NewsroomService(service.db).issue_token(user_model.id, "2fa", minutes=5)
        return LoginOut(requires2fa=True, ticket=ticket, token_type="bearer")

    return complete_login(request, service, user_model)


def twofa_login(payload: TwoFactorLoginIn, request: Request, service: UserService) -> LoginOut:
    from ..services.newsroom_service import NewsroomService, _now, _verify_totp

    news = NewsroomService(service.db)
    row, user_model = news.get_valid_token_user(payload.ticket, "2fa")
    if not bool(getattr(user_model, "totp_enabled", False)) or not getattr(user_model, "totp_secret", None):
        raise HTTPException(status_code=400, detail="Authenticator is not enabled on this account")
    if not _verify_totp(user_model.totp_secret, payload.code):
        raise HTTPException(status_code=401, detail="Invalid authenticator code")
    row.used_at = _now()
    service.db.commit()
    return complete_login(request, service, user_model)


@router.post("/login", response_model=LoginOut, response_model_exclude_none=True)
@limiter.limit("40/minute")
def login(
    payload: LoginRequest,
    request: Request,
    service: UserService = Depends(get_user_service),
) -> LoginOut:
    """Authenticate. If authenticator is on, return a ticket instead of a session."""
    return password_login(payload, request, service)


@router.post("/login/2fa", response_model=LoginOut, response_model_exclude_none=True)
@limiter.limit("40/minute")
def login_2fa(
    payload: TwoFactorLoginIn,
    request: Request,
    service: UserService = Depends(get_user_service),
) -> LoginOut:
    """Finish login with the authenticator app code."""
    return twofa_login(payload, request, service)


@router.post("/signup", response_model=TokenOut)
@limiter.limit("10/minute")
def signup(
    payload: UserSignup,
    request: Request,
    service: UserService = Depends(get_user_service),
) -> TokenOut:
    """Signup a new normal user."""
    # Ensure user doesn't already exist
    existing = service.user_repo.get_by_username(payload.username)
    if existing:
        raise HTTPException(status_code=400, detail="Email already taken")
    
    # Create user with role 'user'
    user_create = UserCreate(
        username=payload.username,
        email=payload.email or payload.username,
        password=payload.password,
        role="user"
    )
    user_model = service.create_user(user_create)
    
    # Update display name if provided
    if payload.displayName:
        user_model.display_name = payload.displayName
        service.db.commit()
    
    # Generate JWT token
    token = create_access_token(data={"sub": str(user_model.id), "role": user_model.role})
    
    # Store in session as well
    request.session["user_id"] = user_model.id
    
    me = service._build_me_out(user_model)
    me.token = token
    
    return TokenOut(
        access_token=token,
        token_type="bearer",
        user=me
    )


@router.post("/logout")
def admin_logout(request: Request) -> dict:
    """Logout the current user."""
    request.session.clear()
    return {"ok": True}


@router.get("/me", response_model=MeOut)
def admin_me(
    request: Request,
    db: Session = Depends(get_db),
    service: UserService = Depends(get_user_service),
) -> MeOut:
    """Get current user info."""
    user = require_user(request, db)
    return service._build_me_out(user)


@router.put("/profile", response_model=MeOut)
def admin_update_profile(
    payload: ProfileUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    service: UserService = Depends(get_user_service),
) -> MeOut:
    """Update current user profile."""
    user = require_user(request, db)
    return service.update_profile(user, payload.displayName, payload.email, payload.bio)


@router.put("/profile/password")
def admin_change_password(
    payload: PasswordChangeRequest,
    request: Request,
    db: Session = Depends(get_db),
    service: UserService = Depends(get_user_service),
) -> dict:
    """Change current user password."""
    user = require_user(request, db)
    service.change_password(user, payload.currentPassword, payload.newPassword)
    return {"ok": True}


# User management (admin only)


@router.get("/users", response_model=list[UserOut])
def admin_list_users(
    request: Request,
    db: Session = Depends(get_db),
    service: UserService = Depends(get_user_service),
) -> list[UserOut]:
    """List all login accounts and orphan post-creators (no account yet)."""
    user = require_user(request, db)
    # Allow admins and editors to see the user list
    if user.role not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Admin or Editor required")
    return service.list_users()


@router.post("/users", response_model=UserOut)
def admin_create_user(
    payload: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    service: UserService = Depends(get_user_service),
) -> UserOut:
    """Create a new user."""
    user = require_user(request, db)
    require_admin(user)
    user_model = service.create_user(payload)
    return service._build_user_out(user_model)


@router.post("/users/orphans/claim", response_model=OrphanActionOut)
def admin_claim_orphan(
    payload: OrphanClaimRequest,
    request: Request,
    db: Session = Depends(get_db),
    service: UserService = Depends(get_user_service),
) -> OrphanActionOut:
    """Create a login account for a post author who has no users row (e.g. Krishna, Reet)."""
    user = require_user(request, db)
    require_admin(user)
    return service.claim_orphan_author(
        creator_name=payload.creatorName,
        password=payload.password,
        role=payload.role,
        username=payload.email or payload.username,
        display_name=payload.displayName,
        reassign_posts=payload.reassignPosts,
        admin=user,
    )


@router.post("/users/orphans/reassign", response_model=OrphanActionOut)
def admin_reassign_orphan(
    payload: OrphanReassignRequest,
    request: Request,
    db: Session = Depends(get_db),
    service: UserService = Depends(get_user_service),
) -> OrphanActionOut:
    """Transfer all posts from an orphan creator name to an existing user."""
    user = require_user(request, db)
    require_admin(user)
    return service.reassign_orphan_posts(
        creator_name=payload.creatorName,
        transfer_to_user_id=payload.transferToUserId,
        admin=user,
    )


@router.post("/users/orphans/delete-posts", response_model=OrphanActionOut)
def admin_delete_orphan_posts(
    payload: OrphanDeletePostsRequest,
    request: Request,
    db: Session = Depends(get_db),
    service: UserService = Depends(get_user_service),
) -> OrphanActionOut:
    """Delete all posts attributed to a creator name (orphan cleanup)."""
    user = require_user(request, db)
    require_admin(user)
    return service.delete_posts_by_creator(payload.creatorName, user)


@router.put("/users/{user_id}/password")
def admin_set_user_password(
    user_id: int,
    payload: AdminPasswordSetRequest,
    request: Request,
    db: Session = Depends(get_db),
    service: UserService = Depends(get_user_service),
) -> dict:
    """Admin sets any user's password (no current password required)."""
    user = require_user(request, db)
    require_admin(user)
    service.admin_set_password(user_id, payload.newPassword, user)
    return {"ok": True}


@router.put("/users/{user_id}/role", response_model=UserOut)
def admin_set_user_role(
    user_id: int,
    payload: AdminRoleUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    service: UserService = Depends(get_user_service),
) -> UserOut:
    """Admin changes any user's role."""
    user = require_user(request, db)
    require_admin(user)
    return service.admin_set_role(user_id, payload.role, user)


@router.post("/users/{user_id:int}/transfer-posts", response_model=OrphanActionOut)
def admin_transfer_user_posts(
    user_id: int,
    payload: AdminTransferPostsRequest,
    request: Request,
    db: Session = Depends(get_db),
    service: UserService = Depends(get_user_service),
) -> OrphanActionOut:
    """Move this user's posts to another login account. The source user stays."""
    user = require_user(request, db)
    require_admin(user)
    return service.transfer_user_posts(user_id, payload.transferToUserId, user)


@router.delete("/users/{user_id}", response_model=AdminUserDeleteOut)
def admin_delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    service: UserService = Depends(get_user_service),
    postsAction: str = "transfer",
    transferToUserId: int | None = None,
) -> AdminUserDeleteOut:
    """Delete a user.

    Query params:
    - postsAction: delete | transfer | keep
    - transferToUserId: required when postsAction=transfer
    """
    user = require_user(request, db)
    require_admin(user)
    return service.delete_user(
        user_id,
        user,
        posts_action=postsAction,
        transfer_to_user_id=transferToUserId,
    )


@router.post("/users/{user_id}/delete", response_model=AdminUserDeleteOut)
def admin_delete_user_with_body(
    user_id: int,
    payload: AdminUserDeleteRequest,
    request: Request,
    db: Session = Depends(get_db),
    service: UserService = Depends(get_user_service),
) -> AdminUserDeleteOut:
    """Delete a user with JSON body options (preferred by admin UI)."""
    user = require_user(request, db)
    require_admin(user)
    return service.delete_user(
        user_id,
        user,
        posts_action=payload.postsAction,
        transfer_to_user_id=payload.transferToUserId,
    )
