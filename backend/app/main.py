from fastapi import FastAPI

from app.core.config import settings
from app.database.init_db import initialize_database
from app.routers import analytics_router, budget_router, category_router, transaction_router

app = FastAPI(title=settings.app_name)


@app.on_event("startup")
def startup() -> None:
    initialize_database()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/db")
def database_health() -> dict[str, str]:
    from sqlalchemy import text
    from app.database.connection import SessionLocal

    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    finally:
        db.close()


app.include_router(transaction_router, prefix="/api")
app.include_router(budget_router, prefix="/api")
app.include_router(category_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
