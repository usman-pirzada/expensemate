"""Live PostgreSQL verification for the SQLite-to-PostgreSQL migration."""

from datetime import date
from decimal import Decimal
import os
import uuid

import pytest
from sqlalchemy import create_engine, select, text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

from app.database.base import Base
from app.database.seed import seed_categories
from app.database.triggers import create_budget_triggers
from app.models import Budget, BudgetAllocation, Category, Transaction
from scripts.migrate_sqlite_to_postgres import copy_sqlite_data


@pytest.mark.postgresql
def test_sqlite_migration_preserves_rows_sequences_and_budget_guard(tmp_path):
    postgres_url = os.getenv("TEST_POSTGRES_URL")
    if not postgres_url:
        pytest.skip("TEST_POSTGRES_URL is not configured")

    schema = f"expensemate_test_{uuid.uuid4().hex}"
    admin_engine = create_engine(postgres_url, pool_pre_ping=True)
    source_path = tmp_path / "expensemate-source.db"
    source_engine = create_engine(f"sqlite:///{source_path}")
    target_engine = None

    try:
        with admin_engine.begin() as connection:
            connection.execute(text(f'CREATE SCHEMA "{schema}"'))

        target_engine = create_engine(
            postgres_url,
            connect_args={"options": f"-c search_path={schema}"},
            pool_pre_ping=True,
        )
        Base.metadata.create_all(source_engine)
        with source_engine.begin() as connection:
            create_budget_triggers(connection)

        with Session(source_engine, expire_on_commit=False) as source:
            seed_categories(source)
            food = source.scalar(select(Category).where(Category.name == "Food"))
            assert food is not None
            budget = Budget(year=2026, month=1, overall_amount=Decimal("100.00"))
            source.add(budget)
            source.flush()
            source.add(
                BudgetAllocation(
                    budget_id=budget.id,
                    category_id=food.id,
                    amount=Decimal("75.00"),
                )
            )
            source.add(
                Transaction(
                    type="Expense",
                    amount=Decimal("25.00"),
                    date=date(2026, 1, 2),
                    description="Persisted before migration",
                    category_id=food.id,
                )
            )
            source.commit()
            expected_transaction_id = source.scalar(
                select(Transaction.id).where(
                    Transaction.description == "Persisted before migration"
                )
            )

        copied = copy_sqlite_data(f"sqlite:///{source_path}", target_engine)

        with Session(target_engine, expire_on_commit=False) as target:
            categories = target.scalars(select(Category)).all()
            transactions = target.scalars(select(Transaction)).all()
            budgets = target.scalars(select(Budget)).all()
            allocations = target.scalars(select(BudgetAllocation)).all()

            assert len(categories) == 8
            assert len(transactions) == 1
            assert transactions[0].id == expected_transaction_id
            assert transactions[0].description == "Persisted before migration"
            assert len(budgets) == 1
            assert len(allocations) == 1
            assert copied == len(categories) + len(transactions) + len(budgets) + len(allocations)

            food = target.scalar(select(Category).where(Category.name == "Food"))
            target.add(
                Transaction(
                    type="Expense",
                    amount=Decimal("5.00"),
                    date=date(2026, 1, 3),
                    description="Inserted after migration",
                    category_id=food.id,
                )
            )
            target.commit()
            inserted = target.scalar(
                select(Transaction).where(
                    Transaction.description == "Inserted after migration"
                )
            )
            assert inserted.id > expected_transaction_id

            transport = next(item for item in categories if item.name == "Transport")
            target.add(
                BudgetAllocation(
                    budget_id=budgets[0].id,
                    category_id=transport.id,
                    amount=Decimal("26.00"),
                )
            )
            with pytest.raises(DBAPIError):
                target.commit()
            target.rollback()
    finally:
        if target_engine is not None:
            target_engine.dispose()
        source_engine.dispose()
        with admin_engine.begin() as connection:
            connection.execute(text(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE'))
        admin_engine.dispose()
