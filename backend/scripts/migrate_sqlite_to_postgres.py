"""Copy an existing ExpenseMate SQLite database into an empty PostgreSQL database.

Example:
    SOURCE_DATABASE_URL=sqlite:////absolute/path/expensemate.db \
    TARGET_DATABASE_URL=postgresql+psycopg://expensemate:password@localhost:5432/expensemate \
    python -m scripts.migrate_sqlite_to_postgres

The destination must be empty. The source database is never modified.
"""

import os

from sqlalchemy import create_engine, func, insert, inspect, select, text
from sqlalchemy.engine import Engine

from app import models  # noqa: F401
from app.database.base import Base
from app.database.triggers import create_budget_triggers


def copy_sqlite_data(source_url: str, target_engine: Engine) -> int:
    """Copy all mapped table rows from SQLite to an empty SQLAlchemy target."""
    source_engine = create_engine(source_url, connect_args={"check_same_thread": False})
    if source_engine.dialect.name != "sqlite":
        source_engine.dispose()
        raise ValueError("The source database must be SQLite.")

    Base.metadata.create_all(target_engine)
    copied_rows = 0
    try:
        source_tables = set(inspect(source_engine).get_table_names())
        expected_tables = {table.name for table in Base.metadata.sorted_tables}
        missing = expected_tables - source_tables
        if missing:
            raise RuntimeError(f"SQLite source is missing required tables: {sorted(missing)}")

        with source_engine.connect() as source_connection:
            with target_engine.begin() as target_connection:
                create_budget_triggers(target_connection)
                for table in Base.metadata.sorted_tables:
                    existing_count = target_connection.scalar(select(func.count()).select_from(table))
                    if existing_count:
                        raise RuntimeError("Target database is not empty; refusing to merge records.")

                for table in Base.metadata.sorted_tables:
                    rows = source_connection.execute(select(table)).mappings().all()
                    if rows:
                        target_connection.execute(insert(table), [dict(row) for row in rows])
                        copied_rows += len(rows)

                if target_engine.dialect.name == "postgresql":
                    for table in Base.metadata.sorted_tables:
                        if "id" not in table.c:
                            continue
                        target_connection.execute(
                            text(
                                f"""
                                SELECT setval(
                                    pg_get_serial_sequence(:table_name, 'id'),
                                    GREATEST(COALESCE(MAX(id), 1), 1),
                                    MAX(id) IS NOT NULL
                                )
                                FROM "{table.name}"
                                """
                            ),
                            {"table_name": table.name},
                        )
        return copied_rows
    finally:
        source_engine.dispose()


def main() -> None:
    source_url = os.getenv("SOURCE_DATABASE_URL", "sqlite:///./data/expensemate.db")
    target_url = os.getenv("TARGET_DATABASE_URL")
    if not target_url:
        raise SystemExit("Set TARGET_DATABASE_URL to the PostgreSQL connection URL before migrating.")
    if not target_url.startswith(("postgresql://", "postgresql+psycopg://")):
        raise SystemExit("TARGET_DATABASE_URL must point to PostgreSQL.")

    target_engine = create_engine(target_url, pool_pre_ping=True)
    try:
        count = copy_sqlite_data(source_url, target_engine)
        print(f"Migration completed: copied {count} rows into PostgreSQL.")
    finally:
        target_engine.dispose()


if __name__ == "__main__":
    main()
