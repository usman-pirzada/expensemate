from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.connection import get_db
from app.database.init_db import initialize_database

app = FastAPI(title=settings.app_name)


@app.on_event("startup")
def startup() -> None:
    """Initialize the local SQLite database before serving requests."""
    initialize_database()


@app.get("/health")
def health() -> dict[str, str]:
    """Return a basic application health response."""
    return {"status": "ok"}


@app.get("/health/db")
def database_health(db: Session = Depends(get_db)) -> dict[str, str]:
    """Verify that FastAPI can acquire a SQLAlchemy session and query SQLite."""
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}
