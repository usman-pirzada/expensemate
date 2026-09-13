from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database.init_db import initialize_database
from app.routers import (
    analytics_router,
    budget_router,
    category_router,
    csv_router,
    income_router,
    transaction_router,
)


# /app in the Docker image, repository root during local development.
PROJECT_ROOT = Path(__file__).resolve().parents[2]
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"
BACKEND_PATH_PREFIXES = ("api", "health", "docs", "redoc")


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
app.include_router(income_router, prefix="/api")
app.include_router(budget_router, prefix="/api")
app.include_router(category_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(csv_router, prefix="/api")


if settings.serve_frontend:
    if not FRONTEND_DIST.is_dir():
        raise RuntimeError(
            f"Frontend build directory does not exist: {FRONTEND_DIST}"
        )

    frontend_index = FRONTEND_DIST / "index.html"
    assets_dir = FRONTEND_DIST / "assets"

    if not frontend_index.is_file():
        raise RuntimeError(f"Frontend entry point does not exist: {frontend_index}")

    if not assets_dir.is_dir():
        raise RuntimeError(f"Frontend assets directory does not exist: {assets_dir}")

    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        normalized_path = full_path.strip("/")

        if normalized_path == "openapi.json" or any(
            normalized_path == prefix
            or normalized_path.startswith(f"{prefix}/")
            for prefix in BACKEND_PATH_PREFIXES
        ):
            raise HTTPException(status_code=404, detail="Not Found")

        requested_file = (FRONTEND_DIST / normalized_path).resolve()
        frontend_root = FRONTEND_DIST.resolve()

        if requested_file.is_relative_to(frontend_root) and requested_file.is_file():
            return FileResponse(requested_file)

        return FileResponse(frontend_index)
