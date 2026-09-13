# syntax=docker/dockerfile:1

# Build the React frontend.
FROM node:22-alpine AS frontend-build
WORKDIR /build/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# Build Python dependencies against the same Python/Debian family used by
# the distroless runtime. This avoids ABI mismatches for native extensions.
FROM python:3.13-slim-trixie AS backend-build
WORKDIR /build/backend

COPY backend/pyproject.toml ./
RUN pip install --no-cache-dir --target /python-deps \
    fastapi==0.128.2 \
    httpx==0.28.1 \
    pydantic-settings==2.12.0 \
    sqlalchemy==2.0.50 \
    "uvicorn[standard]==0.40.0"

COPY backend/ ./


# Minimal production image. Distroless has no shell or package manager.
FROM gcr.io/distroless/python3-debian13:nonroot AS production
WORKDIR /app

ENV PYTHONPATH=/app/backend:/python-deps \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

COPY --from=backend-build /python-deps /python-deps
COPY --from=backend-build /build/backend /app/backend
COPY --from=frontend-build /build/frontend/dist /app/frontend/dist

EXPOSE 8000

ENTRYPOINT ["/usr/bin/python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
