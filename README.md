# ExpenseMate

ExpenseMate is a local personal finance manager for recording monthly income and expenses, setting monthly budgets, allocating budgets by category, monitoring budget alerts, viewing analytics, and importing/exporting transactions as CSV.

## Stack

- **Frontend:** React + Vite
- **Backend:** FastAPI + SQLAlchemy
- **Database:** SQLite
- **Testing:** pytest, Vitest, React Testing Library
- **Containerization:** Docker + Docker Compose

## Features

- Record one monthly income and explicitly confirm/lock it
- Reset a month when the locked income needs to be replaced
- Record, edit, and delete expenses
- Predefined expense categories
- Create and manage monthly budgets
- Allocate a budget across categories without exceeding the overall budget
- Show actual spending even when it exceeds the budget
- 90% approaching and 100%+ exceeded alerts
- Dashboard and category analytics
- CSV transaction import/export with atomic imports
- Light/dark UI and month navigation

## Prerequisites

### Running directly from source code

Install:

- **Python 3.13+** with [uv](https://docs.astral.sh/uv/)
- **Node.js 22+** and npm

### Running with Docker

Install:

- **Docker**
- **Docker Compose**

Docker is the easiest way to run the complete production application because the backend serves the built React frontend from the same container.

---

## Running directly from source code

This option runs the backend and frontend as separate development servers. It is the recommended approach when developing or modifying the application.

### 1. Start the backend

From the repository root:

```bash
cd backend
uv sync
uv run python -m app.database.init_db
uv run uvicorn app.main:app --reload
```

The backend will be available at:

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/health/db`
- `http://127.0.0.1:8000/docs`

### 2. Start the frontend

Open another terminal at the repository root:

```bash
cd frontend
npm ci
npm run dev
```

Open the Vite URL shown in the terminal, normally:

```text
http://localhost:5173
```

The frontend uses the FastAPI API by default. To explicitly provide a different backend URL:

```bash
VITE_API_URL=http://localhost:8000/api npm run dev
```

### Development workflow

When running from source:

```text
Browser
   |
   v
Vite development server (:5173)
   |
   v
FastAPI backend (:8000)
   |
   v
SQLite database
```

Changes to the React frontend and FastAPI backend can be developed and tested directly without rebuilding a Docker image.

---

## Running with Docker

### Option 1: Run the published Docker image directly

Use this when you only want to run ExpenseMate. You **do not need the repository, source code, Dockerfile, or `docker-compose.yml`**.

Make sure Docker is installed, then run:

```bash
docker run -d \
  --name expensemate \
  -p 8000:8000 \
  -e DATABASE_URL=sqlite:////app/data/expensemate.db \
  -v expensemate-data:/app/data \
  --restart unless-stopped \
  usman24231/expensemate:1.0.0
```

Docker automatically pulls the image from Docker Hub if it is not already available locally.

Open:

```text
http://localhost:8000
```

Useful commands:

```bash
# View application logs
docker logs -f expensemate

# Stop the application
docker stop expensemate

# Start it again
docker start expensemate

# Remove the container
docker rm -f expensemate
```

The SQLite database is stored in the Docker named volume `expensemate-data`, so the database remains available when the container is stopped, recreated, or removed.

This option performs no frontend installation, backend environment setup, or application build on the host.

### Option 2: Run with Docker Compose from source code

Use this when you want Docker Compose to build ExpenseMate from the source code in the Git repository.

#### 1. Clone the repository

Clone the repository and enter the repository directory:

```bash
git clone -b staging https://github.com/usman-pirzada/expensemate.git
cd expensemate
```

> If you are using another branch or a released version, replace `staging` with the appropriate branch or tag.

#### 2. Build and start ExpenseMate

Run the following command **from the repository root**, the directory that contains `docker-compose.yml` and `Dockerfile`:

```bash
docker compose up -d --build
```

The `docker-compose.yml` is configured with a local Docker `build` context, so this command builds the application from the cloned source code. It does **not** pull the published `usman24231/expensemate:1.0.0` image.

Then open:

```text
http://localhost:8000
```

The Dockerfile performs a multi-stage build:

1. Builds the React frontend with Node.js/Vite.
2. Installs the Python backend runtime dependencies.
3. Creates the production Python image.
4. Copies the built React `dist` files into the image.
5. Runs FastAPI, which serves both the API and the React application.

To force a completely fresh build without using Docker's build cache:

```bash
docker compose build --no-cache
docker compose up -d
```

### Docker Compose data persistence

The Compose configuration mounts the named volume `expensemate-data` at `/app/data`, where the SQLite database is stored:

```text
expensemate-data:/app/data
                    |
                    └── expensemate.db
```

The volume is independent of the Docker image. Rebuilding the application image or recreating the container does **not** delete the database stored in the volume.

Do not run `docker compose down -v` if you want to keep the application's database, because the `-v` option removes the named volume.

### Docker architecture

In the production container, the frontend and backend are served together:

```text
Browser
   |
   v
FastAPI (:8000)
   |\
   | \-- React static files
   |
   \---- /api/*
          |
          v
      Service layer
          |
          v
     Repository layer
          |
          v
       SQLAlchemy
          |
          v
        SQLite
```

The database is persisted through the `expensemate-data` Docker volume mounted at `/app/data`.

---

## Tests

Run the tests from the repository source tree. Docker is not required for the test suite.

### Backend tests

```bash
cd backend
uv sync
uv run pytest
```

The backend test suite covers API behavior and business/service rules including transactions, monthly income locking/reset, budgets and allocations, dashboard/analytics behavior, CSV import/export, and validation/constraint cases.

### Frontend tests

```bash
cd frontend
npm ci
npm run test:run
```

The frontend test suite uses Vitest and React Testing Library.

### Frontend production build check

To verify that the React application can be built successfully:

```bash
cd frontend
npm run build
```

### Run the complete verification sequence

From the repository root:

```bash
cd backend
uv sync
uv run pytest

cd ../frontend
npm ci
npm run test:run
npm run build
```

A successful final verification should include:

- Backend tests passing
- Frontend tests passing
- Frontend production build completing successfully
- Docker image building successfully when containerization is being verified

---

## Architecture

```text
React pages/components
        |
        v
expenseService.js
        |
        v
api.js  ---> FastAPI routes
                |
                v
            Service layer
                |
                v
          Repository layer
                |
                v
             SQLAlchemy
                |
                v
              SQLite
```

Business rules are enforced in the backend. The frontend is responsible for presentation, user interaction, and displaying backend results/errors.

## Project structure

```text
backend/
  app/
    routers/
    services/
    repositories/
    models/
    schemas/
    database/
  tests/

frontend/
  src/
    components/
    context/
    hooks/
    pages/
    services/
    utils/
  tests/

Dockerfile
docker-compose.yml
.dockerignore
```

## Quick reference

| Goal | Command | Requires source code? |
|---|---|---:|
| Develop directly from source | Run FastAPI + Vite separately | Yes |
| Run published Docker image | `docker run ... usman24231/expensemate:1.0.0` | No |
| Build Docker image from source | `docker compose up -d --build` from the repository root | Yes |
| Backend tests | `cd backend && uv run pytest` | Yes |
| Frontend tests | `cd frontend && npm run test:run` | Yes |
| Frontend build check | `cd frontend && npm run build` | Yes |
