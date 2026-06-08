import logging
from .db import SessionLocal
from .models import BotLog

class DBHandler(logging.Handler):
    """
    A custom logging handler that writes log records to the database.
    """
    def emit(self, record):
        # Avoid infinite recursion if the DB operation itself logs something
        if record.name == 'sqlalchemy.engine':
            return
            
        try:
            db = SessionLocal()
            log_entry = BotLog(
                level=record.levelname,
                message=self.format(record),
                module=record.module
            )
            db.add(log_entry)
            db.commit()
            db.close()
        except Exception:
            # If database logging fails, we don't want to crash the application.
            # We could log to stderr here if needed.
            pass

def setup_db_logging():
    """
    Configure database logging handler.
    """
    logger = logging.getLogger() # root logger
    
    # Check if DBHandler is already added to avoid duplicates
    for handler in logger.handlers:
        if isinstance(handler, DBHandler):
            return
            
    db_handler = DBHandler()
    db_handler.setLevel(logging.INFO)
    
    # Optional: Use a specific format for DB logs
    formatter = logging.Formatter('%(message)s')
    db_handler.setFormatter(formatter)
    
    logger.addHandler(db_handler)
