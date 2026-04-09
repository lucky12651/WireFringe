from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Load local development secrets from server/.env (does not override real env vars)
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is required (PostgreSQL connection string), e.g. "
        "postgresql://USER:PASSWORD@HOST:5432/DBNAME"
    )

parsed = make_url(DATABASE_URL)
if parsed.get_backend_name() != "postgresql":
    raise RuntimeError("DATABASE_URL must be a PostgreSQL URL")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    # Fail fast if the host is unreachable; otherwise uvicorn --reload can appear to
    # "hang" during startup while trying to connect.
    connect_args={"connect_timeout": int(os.environ.get("DB_CONNECT_TIMEOUT", "5"))},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass
