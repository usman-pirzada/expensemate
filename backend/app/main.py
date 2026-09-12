from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.init_db import initialize_database
from app.routers import (
    analytics_router,
    budget_router,
    category_router,
    csv_router,
    transaction_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
app.include_router(csv_router, prefix="/api")
