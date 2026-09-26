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

The API is available at `http://127.0.0.1:8000`; health check: `GET /health`. Database, migrations, seed data and Docker are introduced in BE-01.
