from datetime import date
from decimal import Decimal
from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine, event, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.seed import seed_categories
from app.database.triggers import create_budget_triggers
from app.models import Category, Transaction
from app.services.category_service import CategoryService
from app.services.transaction_csv_codec import TransactionCSVCodec
from scripts.migrate_sqlite_to_postgres import copy_sqlite_data


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.close()

    Base.metadata.create_all(engine)
    with engine.begin() as connection:
        create_budget_triggers(connection)
    with Session(engine, expire_on_commit=False) as db:
        seed_categories(db)
        yield db
    engine.dispose()


def test_category_service_returns_categories_in_display_order(db_session):
    categories = CategoryService(db_session).list_categories()

    assert categories
    assert categories[-1].name == "Other"
    assert [item.name for item in categories[:-1]] == sorted(
        item.name for item in categories[:-1]
    )


def test_transaction_csv_codec_round_trip():
    record = SimpleNamespace(
        type="Expense",
        amount=Decimal("125.50"),
        date=date(2026, 9, 12),
        description="Lunch, team",
        category_id=3,
    )

    content = TransactionCSVCodec.encode([record])
    decoded = TransactionCSVCodec.decode(content)

    assert decoded == [
        ("Expense", Decimal("125.50"), date(2026, 9, 12), "Lunch, team", 3)
    ]


def test_transaction_csv_codec_rejects_invalid_headers():
    with pytest.raises(ValueError, match="must contain"):
        TransactionCSVCodec.decode("type,amount\\nExpense,25\\n")


def test_transaction_csv_codec_identifies_malformed_row():
    content = (
        "type,amount,date,description,category_id\\n"
        "Expense,not-a-number,2026-09-12,Lunch,3\\n"
    )

    with pytest.raises(ValueError, match="CSV row 2"):
        TransactionCSVCodec.decode(content)


def test_sqlite_migration_copies_records_and_preserves_ids(tmp_path):
    source_path = tmp_path / "source.db"
    source_engine = create_engine(
        f"sqlite:///{source_path}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(source_engine)
    with source_engine.begin() as connection:
        create_budget_triggers(connection)
    with Session(source_engine) as source_session:
        seed_categories(source_session)
        food = source_session.scalar(select(Category).where(Category.name == "Food"))
        source_session.add(
            Transaction(
                type="Expense",
                amount=Decimal("25.00"),
                date=date(2026, 9, 12),
                description="Migration test",
                category_id=food.id,
            )
        )
        source_session.commit()
    source_engine.dispose()

    target_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    copied = copy_sqlite_data(f"sqlite:///{source_path}", target_engine)

    with Session(target_engine) as target_session:
        transactions = target_session.scalars(select(Transaction)).all()
        categories = target_session.scalars(select(Category)).all()
        assert copied == len(categories) + len(transactions)
        assert len(transactions) == 1
        assert transactions[0].id == 1
        assert transactions[0].description == "Migration test"
        assert len(categories) > 0

    target_engine.dispose()


def test_sqlite_migration_refuses_to_merge_into_nonempty_target(tmp_path):
    source_path = tmp_path / "source.db"
    source_engine = create_engine(f"sqlite:///{source_path}")
    Base.metadata.create_all(source_engine)
    with source_engine.begin() as connection:
        create_budget_triggers(connection)
    source_engine.dispose()

    target_engine = create_engine("sqlite://", poolclass=StaticPool)
    Base.metadata.create_all(target_engine)
    with Session(target_engine) as target_session:
        seed_categories(target_session)

    with pytest.raises(RuntimeError, match="not empty"):
        copy_sqlite_data(f"sqlite:///{source_path}", target_engine)
    target_engine.dispose()
