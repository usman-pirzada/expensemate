# ExpenseMate

ExpenseMate is a local personal finance manager for recording monthly income and expenses, setting monthly budgets, allocating budgets by category, monitoring budget alerts, viewing analytics, and importing/exporting transactions as CSV.

## Stack

- **Frontend:** React + Vite
- **Backend:** FastAPI + SQLAlchemy
- **Database:** SQLite
- **Testing:** pytest, Vitest, React Testing Library

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

## Run locally

### Backend

```bash
cd backend
uv sync
uv run python -m app.database.init_db
uv run uvicorn app.main:app --reload
```

Backend:

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/health/db`
- `http://127.0.0.1:8000/docs`

### Frontend

In another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

The frontend uses the real FastAPI API by default. To use a different backend URL, set `VITE_API_URL`, for example:

```bash
VITE_API_URL=http://localhost:8000/api npm run dev
```

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

## Tests

Backend:

```bash
cd backend
uv run pytest
```

Frontend:

```bash
cd frontend
npm ci
npm run test:run
npm run build
```

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
```
