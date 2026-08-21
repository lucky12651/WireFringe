import logging

from .bot_scope import current_bot_user_id
from .db import SessionLocal
from .models import BotLog


class DBHandler(logging.Handler):
    """Write bot-cycle log records to the database, scoped to the current bot account."""

    def emit(self, record):
        if record.name == "sqlalchemy.engine":
            return
        user_id = current_bot_user_id.get()
        if user_id is None:
            return

        try:
            db = SessionLocal()
            log_entry = BotLog(
                level=record.levelname,
                message=self.format(record),
                module=record.module,
                user_id=int(user_id),
            )
            db.add(log_entry)
            db.commit()
            db.close()
        except Exception:
            pass


def setup_db_logging():
    logger = logging.getLogger()

    for handler in logger.handlers:
        if isinstance(handler, DBHandler):
            return

    db_handler = DBHandler()
    db_handler.setLevel(logging.INFO)
    db_handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(db_handler)
