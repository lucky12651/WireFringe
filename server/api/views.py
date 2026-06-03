from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from ..dependencies import get_db, get_current_user, get_optional_user
from ..models import UserInteraction, Post
from ..schemas import InteractionCreate

router = APIRouter()

@router.post("/increment")
async def increment_views(
    data: InteractionCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    """Record a post interaction for personalization."""
    # Try to get the current user if logged in
    user = get_optional_user(request, db)
    
    if user:
        # Verify post exists
        post = db.query(Post).filter(Post.id == data.post_id).first()
        if post:
            interaction = UserInteraction(
                user_id=user.id,
                post_id=data.post_id,
                interaction_type=data.interaction_type
            )
            db.add(interaction)
            db.commit()
            
    return {"ok": True}
