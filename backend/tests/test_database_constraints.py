from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm import sessionmaker

from app.database.base import Base
from app.database.seed import DEFAULT_CATEGORIES, seed_categories
from app.database.triggers import create_budget_triggers
from app.models import Budget, BudgetAllocation, Category, Transaction


@pytest.fixture()
def session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    from sqlalchemy import event

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.close()

    Base.metadata.create_all(engine)
    with engine.begin() as connection:
        create_budget_triggers(connection)

    TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    db = TestingSession()
    seed_categories(db)
    try:
        yield db
    finally:
        db.close()
        engine.dispose()


def get_category(session, name: str) -> Category:
    return session.query(Category).filter_by(name=name).one()


def test_seeded_categories_exist(session):
    names = session.query(Category.name).all()
    assert {name for (name,) in names} == set(DEFAULT_CATEGORIES)


def test_expense_requires_category(session):
    tx = Transaction(
        type="Expense",
        amount=Decimal("500.00"),
        date=date(2026, 9, 12),
        description="Lunch",
        category_id=None,
    )
    session.add(tx)
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


def test_income_must_not_have_category(session):
    food = get_category(session, "Food")
    tx = Transaction(
        type="Income",
        amount=Decimal("50000.00"),
        date=date(2026, 9, 12),
        description="Salary",
        category_id=food.id,
    )
    session.add(tx)
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


def test_valid_expense_with_category(session):
    food = get_category(session, "Food")
    tx = Transaction(
        type="Expense",
        amount=Decimal("500.00"),
        date=date(2026, 9, 12),
        description="Lunch",
        category_id=food.id,
    )
    session.add(tx)
    session.commit()
    assert tx.id is not None


def test_valid_income_without_category(session):
    tx = Transaction(
        type="Income",
        amount=Decimal("50000.00"),
        date=date(2026, 9, 12),
        description="Salary",
    )
    session.add(tx)
    session.commit()
    assert tx.id is not None


def test_duplicate_budget_for_same_month_is_rejected(session):
    session.add(Budget(year=2026, month=9, overall_amount=Decimal("100000.00")))
    session.commit()

    session.add(Budget(year=2026, month=9, overall_amount=Decimal("50000.00")))
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


def test_category_allocations_cannot_exceed_overall_budget(session):
    food = get_category(session, "Food")
    transport = get_category(session, "Transport")
    budget = Budget(year=2026, month=9, overall_amount=Decimal("100000.00"))
    session.add(budget)
    session.commit()

    session.add(BudgetAllocation(budget_id=budget.id, category_id=food.id, amount=Decimal("60000.00")))
    session.add(BudgetAllocation(budget_id=budget.id, category_id=transport.id, amount=Decimal("40001.00")))

    with pytest.raises((OperationalError, IntegrityError)):
        session.commit()
    session.rollback()
