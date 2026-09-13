from pathlib import Path

from sqlalchemy import inspect

from app.core.config import DEFAULT_DATABASE_PATH
from app.database.base import Base
from app.database.connection import engine
from app.database.seed import seed_categories
from app.database.triggers import create_budget_triggers
from app import models  # noqa: F401


def initialize_database() -> None:
    """Create all tables, integrity triggers, and predefined categories."""
    DEFAULT_DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)

    with engine.begin() as connection:
        create_budget_triggers(connection)

    from app.database.connection import SessionLocal

    with SessionLocal() as db:
        seed_categories(db)

    inspector = inspect(engine)
    expected_tables = {"categories", "transactions", "budgets", "budget_allocations"}
    missing = expected_tables.difference(inspector.get_table_names())
    if missing:
        raise RuntimeError(f"Database initialization failed. Missing tables: {sorted(missing)}")


if __name__ == "__main__":
    initialize_database()
    print("ExpenseMate database initialized successfully.")
