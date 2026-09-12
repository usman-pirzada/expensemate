from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.database.base import Base
from app.database.seed import seed_categories
from app.database.triggers import create_budget_triggers
from app.models import Category
from app.services.alert_service import AlertService
from app.services.analytics_service import AnalyticsService
from app.services.budget_service import BudgetService
from app.services.transaction_service import TransactionService


@pytest.fixture()
def session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

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


def test_transaction_service_applies_category_rules(session):
    service = TransactionService(session)
    food = get_category(session, "Food")

    income = service.create(
        "Income", Decimal("50000"), date(2026, 9, 12), "Salary"
    )
    expense = service.create(
        "Expense", Decimal("500"), date(2026, 9, 12), "Lunch", food.id
    )

    assert income.category_id is None
    assert expense.category_id == food.id

    with pytest.raises(ValueError, match="require a category"):
        service.create("Expense", Decimal("100"), date(2026, 9, 12))

    with pytest.raises(ValueError, match="cannot have a category"):
        service.create("Income", Decimal("100"), date(2026, 9, 12), category_id=food.id)


def test_budget_service_prevents_duplicate_month_and_overallocation(session):
    service = BudgetService(session)
    budget = service.create(2026, 9, Decimal("100000"))
    food = get_category(session, "Food")
    transport = get_category(session, "Transport")

    service.add_allocation(budget.id, food.id, Decimal("60000"))
    with pytest.raises(ValueError, match="exceed"):
        service.add_allocation(budget.id, transport.id, Decimal("40001"))

    with pytest.raises(ValueError, match="already exists"):
        service.create(2026, 9, Decimal("50000"))


def test_budget_service_can_update_and_delete_allocations(session):
    service = BudgetService(session)
    budget = service.create(2026, 9, Decimal("100000"))
    food = get_category(session, "Food")

    allocation = service.add_allocation(budget.id, food.id, Decimal("30000"))
    updated = service.update_allocation(allocation.id, Decimal("25000"))

    assert updated is not None
    assert updated.amount == Decimal("25000.00")
    assert service.get_allocation_total(budget.id) == Decimal("25000.00")
    assert service.delete_allocation(allocation.id) is True
    assert service.get_allocation_total(budget.id) == Decimal("0")


def test_analytics_service_calculates_monthly_budget_status(session):
    transactions = TransactionService(session)
    budget_service = BudgetService(session)
    analytics = AnalyticsService(session)
    food = get_category(session, "Food")

    budget_service.create(2026, 9, Decimal("25000"))
    transactions.create("Income", Decimal("50000"), date(2026, 9, 1), "Salary")
    transactions.create("Expense", Decimal("18000"), date(2026, 9, 10), "Rent", food.id)

    summary = analytics.monthly_summary(2026, 9)

    assert summary["income"] == Decimal("50000.00")
    assert summary["spending"] == Decimal("18000.00")
    assert summary["balance"] == Decimal("32000.00")
    assert summary["remaining"] == Decimal("7000.00")
    assert summary["exceeded"] == Decimal("0")
    assert summary["usage_percentage"] == Decimal("72")


def test_alert_service_uses_90_and_100_percent_thresholds(session):
    transactions = TransactionService(session)
    budget_service = BudgetService(session)
    alerts = AlertService(session)

    budget_service.create(2026, 9, Decimal("25000"))
    transactions.create("Expense", Decimal("22500"), date(2026, 9, 10), "Rent", get_category(session, "Bills").id)
    assert alerts.monthly_alert(2026, 9)["status"] == "approaching"

    transactions.create("Expense", Decimal("2500"), date(2026, 9, 11), "Bills", get_category(session, "Bills").id)
    assert alerts.monthly_alert(2026, 9)["status"] == "exceeded"


def test_budget_service_rejects_budget_below_existing_allocations(session):
    service = BudgetService(session)
    budget = service.create(2026, 9, Decimal("100000"))
    food = get_category(session, "Food")
    service.add_allocation(budget.id, food.id, Decimal("60000"))

    with pytest.raises(ValueError, match="allocated amount"):
        service.update(budget.id, Decimal("50000"))
