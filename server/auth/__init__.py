"""Login, passwords, and request dependencies."""

from .credentials import (
    authenticate,
    create_access_token,
    decode_access_token,
    find_user_by_login,
    hash_password,
    verify_password,
)
from .dependencies import (
    get_current_user,
    get_db,
    get_optional_user,
    require_admin,
    require_bot_access,
    require_newsroom,
    require_staff,
    require_staff_or_bot,
    require_user,
)
from .identity import first_login_value, is_email, normalize_login_email

__all__ = [
    "authenticate",
    "create_access_token",
    "decode_access_token",
    "find_user_by_login",
    "first_login_value",
    "get_current_user",
    "get_db",
    "get_optional_user",
    "hash_password",
    "is_email",
    "normalize_login_email",
    "require_admin",
    "require_bot_access",
    "require_newsroom",
    "require_staff",
    "require_staff_or_bot",
    "require_user",
    "verify_password",
]
