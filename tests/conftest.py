import os

# Importing the server builds a SQLAlchemy engine. Tests in this folder do not
# connect; they only need a PostgreSQL-shaped URL so the database module will import.
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://invalid:invalid@127.0.0.1:9/none",
)
