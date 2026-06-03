from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..auth import create_access_token
from ..dependencies import get_db, require_admin, require_user
from ..schemas import (
    LoginRequest,
    MeOut,
    PasswordChangeRequest,
    ProfileUpdateRequest,
    TokenOut,
    UserCreate,
    UserOut,
    UserSignup,
)
from ..services import UserService

router = APIRouter()


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)


@router.post("/login", response_model=TokenOut)
def login(
    payload: LoginRequest,
    request: Request,
    service: UserService = Depends(get_user_service),
) -> TokenOut:
    """Authenticate and login a user."""
    user_model = service.authenticate_user(payload.username, payload.password)
    if user_model is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Generate JWT token
    token = create_access_token(data={"sub": str(user_model.id), "role": user_model.role})
    
    # Store in session as well for compatibility
    request.session["user_id"] = user_model.id
    
    me = service._build_me_out(user_model)
    me.token = token
    
    return TokenOut(
        access_token=token,
        token_type="bearer",
        user=me
    )


@router.post("/signup", response_model=TokenOut)
def signup(
    payload: UserSignup,
    request: Request,
    service: UserService = Depends(get_user_service),
) -> TokenOut:
    """Signup a new normal user."""
    # Ensure user doesn't already exist
    existing = service.user_repo.get_by_username(payload.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create user with role 'user'
    user_create = UserCreate(
        username=payload.username,
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
    return service.update_profile(user, payload.displayName)


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
    """List all users."""
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


@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    service: UserService = Depends(get_user_service),
) -> dict:
    """Delete a user."""
    user = require_user(request, db)
    require_admin(user)
    service.delete_user(user_id, user)
    return {"ok": True}
