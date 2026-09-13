from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.database.base import Base
from app.database.seed import seed_categories
from app.database.triggers import create_budget_triggers
from app.models import Budget, BudgetAllocation, Category, Transaction
from app.repositories.budget_allocation_repository import BudgetAllocationRepository
from app.repositories.budget_repository import BudgetRepository
from app.repositories.category_repository import CategoryRepository
from app.repositories.transaction_repository import TransactionRepository


@pytest.fixture()
def session() -> Session:
    """Create an isolated SQLite database session for repository tests."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(dbapi_connection, connection_record):
        """Enable SQLite foreign-key enforcement for the test database."""
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.close()

    Base.metadata.create_all(engine)
    with engine.begin() as connection:
        create_budget_triggers(connection)

    testing_session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    db = testing_session()
    seed_categories(db)

    try:
        yield db
    finally:
        db.close()
        engine.dispose()


def test_category_repository_returns_predefined_categories(session: Session) -> None:
    """Verify that categories can be retrieved from the repository."""
    repository = CategoryRepository(session)

    categories = repository.get_all()

    assert len(categories) > 0
    assert all(isinstance(category, Category) for category in categories)


def test_transaction_repository_creates_and_retrieves_transaction(session: Session) -> None:
    """Verify transaction persistence and retrieval."""
    category = CategoryRepository(session).get_by_name("Food")
    assert category is not None

    transaction = Transaction(
        type="Expense",
        amount=Decimal("500.00"),
        date=date(2026, 9, 12),
        description="Lunch",
        category_id=category.id,
    )

    repository = TransactionRepository(session)
    created = repository.create(transaction)
    retrieved = repository.get_by_id(created.id)

    assert retrieved is not None
    assert retrieved.amount == Decimal("500.00")
    assert retrieved.category_id == category.id


def test_transaction_repository_filters_by_month(session: Session) -> None:
    """Verify that month filtering returns only transactions in the requested month."""
    category = CategoryRepository(session).get_by_name("Food")
    assert category is not None

    repository = TransactionRepository(session)
    repository.create(
        Transaction(
            type="Expense",
            amount=Decimal("500.00"),
            date=date(2026, 9, 12),
            category_id=category.id,
        )
    )
    repository.create(
        Transaction(
            type="Expense",
            amount=Decimal("700.00"),
            date=date(2026, 8, 12),
            category_id=category.id,
        )
    )

    september_transactions = repository.get_by_month(2026, 9)

    assert len(september_transactions) == 1
    assert september_transactions[0].amount == Decimal("500.00")


def test_budget_repository_finds_budget_by_month(session: Session) -> None:
    """Verify retrieval of a monthly budget."""
    budget = Budget(year=2026, month=9, overall_amount=Decimal("100000.00"))
    repository = BudgetRepository(session)
    repository.create(budget)

    retrieved = repository.get_by_month(2026, 9)

    assert retrieved is not None
    assert retrieved.id == budget.id
    assert retrieved.overall_amount == Decimal("100000.00")


def test_budget_allocation_repository_returns_allocations_and_total(session: Session) -> None:
    """Verify allocation retrieval and total calculation."""
    category = CategoryRepository(session).get_by_name("Food")
    assert category is not None

    budget = BudgetRepository(session).create(
        Budget(year=2026, month=9, overall_amount=Decimal("100000.00"))
    )
    allocation = BudgetAllocation(
        budget_id=budget.id,
        category_id=category.id,
        amount=Decimal("25000.00"),
    )

    repository = BudgetAllocationRepository(session)
    created = repository.create(allocation)
    allocations = repository.get_by_budget(budget.id)
    total = repository.get_total_for_budget(budget.id)

    assert len(allocations) == 1
    assert allocations[0].id == created.id
    assert total == Decimal("25000.00")
