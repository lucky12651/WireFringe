"""Dump PostgreSQL to a timestamped file. Usage: python -m server.backup_db"""

from __future__ import annotations

import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from .db import DATABASE_URL


def main() -> None:
    dest_dir = Path(os.environ.get("BACKUP_DIR") or (Path(__file__).resolve().parent.parent / "backups"))
    dest_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    dest = dest_dir / f"wirefringe-{stamp}.sql"
    env = os.environ.copy()
    subprocess.check_call(["pg_dump", DATABASE_URL, "-f", str(dest)], env=env)
    print(dest)


if __name__ == "__main__":
    main()
