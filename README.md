# ExpenseMate - Database Scaffold

This scaffold implements the initial database/backend foundation for ExpenseMate.

## Stack

- FastAPI
- SQLAlchemy ORM 2.x
- SQLite
- pytest

## Database entities

- `categories`
- `transactions`
- `budgets`
- `budget_allocations`

## Important rules implemented

- Expense transactions require a category.
- Income transactions cannot have a category.
- Transaction type must be `Income` or `Expense`.
- Transaction amount must be positive.
- Only one overall budget is allowed for a given year/month.
- Category allocation amounts must be positive.
- A category can have only one allocation per monthly budget.
- The sum of category allocations cannot exceed the overall monthly budget. This last rule is enforced by SQLite triggers as well as application logic that we will add in the service layer.
- Users may still exceed their budget through actual spending. The database does not prevent spending beyond a budget.
- Predefined categories are seeded into the database; users do not create categories.

## Run

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app.database.init_db
uvicorn app.main:app --reload
```

Then open:

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/health/db`

## Tests

```bash
cd backend
pytest
```

The real application services and REST routes can be added on top of this database foundation without changing the database layer's basic responsibilities.
