# ExpenseMate

## Run

```bash
cd backend
uv sync
uv run python -m app.database.init_db
uv run uvicorn app.main:app --reload
```

Then open:

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/health/db`

## Tests

```bash
cd backend
uv run pytest
```
