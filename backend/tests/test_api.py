import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.connection import get_db
from app.database.seed import seed_categories
from app.database.triggers import create_budget_triggers
from app.main import app


@pytest.fixture()
def client():
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

    TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    db = TestingSession()
    seed_categories(db)

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    db.close()
    engine.dispose()


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_and_list_transactions(client):
    response = client.post(
        "/api/transactions",
        json={
            "type": "Expense",
            "amount": "500.00",
            "date": "2026-09-12",
            "description": "Lunch",
            "category_id": 1,
        },
    )
    assert response.status_code == 201
    transaction = response.json()
    assert transaction["amount"] == "500.00"
    assert transaction["type"] == "Expense"

    response = client.get("/api/transactions?year=2026&month=9")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_create_budget_and_allocation(client):
    response = client.post(
        "/api/budgets",
        json={"year": 2026, "month": 9, "overall_amount": "100000.00"},
    )
    assert response.status_code == 201
    budget_id = response.json()["id"]

    response = client.post(
        f"/api/budgets/{budget_id}/allocations",
        json={"category_id": 1, "amount": "40000.00"},
    )
    assert response.status_code == 201

    response = client.get(f"/api/budgets/{budget_id}/allocations")
    assert response.status_code == 200
    assert response.json()[0]["amount"] == "40000.00"


def test_dashboard_endpoint(client):
    client.post(
        "/api/transactions",
        json={
            "type": "Income",
            "amount": "100000.00",
            "date": "2026-09-01",
        },
    )
    response = client.get("/api/analytics/dashboard/2026/9")
    assert response.status_code == 200
    assert response.json()["summary"]["income"] == 100000.0


def test_csv_round_trip(client):
    response = client.post(
        "/api/transactions",
        json={
            "type": "Expense",
            "amount": "750.00",
            "date": "2026-09-12",
            "description": "Groceries",
            "category_id": 1,
        },
    )
    assert response.status_code == 201

    response = client.get("/api/transactions/csv/export")
    assert response.status_code == 200
    csv_content = response.text
    assert "Groceries" in csv_content

    response = client.post("/api/transactions/csv/import", json={"content": csv_content})
    assert response.status_code == 200
    assert response.json()["imported"] == 1


def test_csv_import_is_atomic(client):
    content = (
        "type,amount,date,description,category_id\n"
        "Expense,100.00,2026-09-12,Valid,1\n"
        "Expense,200.00,2026-09-12,Invalid,9999\n"
    )

    response = client.post("/api/transactions/csv/import", json={"content": content})
    assert response.status_code == 400

    response = client.get("/api/transactions?year=2026&month=9")
    assert response.status_code == 200
    assert response.json() == []
