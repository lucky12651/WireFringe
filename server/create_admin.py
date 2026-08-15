from __future__ import annotations

import argparse

from sqlalchemy import select

from .auth import hash_password
from .db import SessionLocal, engine
from .models import User


def main() -> None:
    parser = argparse.ArgumentParser(description="Create an admin/editor/author user")
    parser.add_argument("--email", "--username", dest="email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--role", default="admin", choices=["admin", "editor", "author"])
    args = parser.parse_args()

    # Ensure tables exist
    from .db import Base

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        email = (args.email or "").strip().lower()
        existing = db.execute(select(User).where(User.username == email)).scalar_one_or_none()
        if existing is not None:
            raise SystemExit(f"User already exists: {email}")

        password_hash, password_salt = hash_password(args.password)
        user = User(
            username=email,
            email=email,
            password_hash=password_hash,
            password_salt=password_salt,
            role=args.role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Created user id={user.id} email={user.username} role={user.role}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
