# Chef Table Backend

FastAPI backend for the educational «Шеф-стол» MVP. The service is implemented separately from the Expo client and follows `../docs/02-design/openapi.yaml` for public client operations. `GET /health` is an operational endpoint outside that contract.

## Local setup

Requirements: Python 3.12+.

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -e ".[dev]"
```

## Commands

Run from `backend/`:

```powershell
.\.venv\Scripts\python -m uvicorn app.main:app --reload
.\.venv\Scripts\python -m ruff format --check .
.\.venv\Scripts\python -m ruff check .
.\.venv\Scripts\python -m pytest
```

For local PostgreSQL, set `DATABASE_URL` from `.env.example`, then use `python -m alembic upgrade head` and `python -m app.db.seed`.

## Docker stack

Run from the repository root:

```powershell
docker compose up -d db
docker compose run --rm migrate
docker compose run --rm seed
docker compose up -d backend
docker compose ps
```

`migrate` applies Alembic revisions; `seed` safely upserts deterministic demo data and may be repeated. Stop containers without deleting the database volume with `docker compose stop`.

The API is available at `http://127.0.0.1:8000`; health check: `GET /health`. Business endpoints are implemented in later BE iterations.
