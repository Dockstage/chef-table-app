# Chef Table Backend

FastAPI backend for the educational «Шеф-стол» MVP. The service is implemented separately from the Expo client and follows `../docs/02-design/openapi.yaml` for public client operations. `GET /health` is an operational endpoint outside that contract.

## Local setup

Requirements: Python 3.12+.

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -e ".[dev]"
Copy-Item .env.example .env
# Replace DEV_BEARER_TOKEN with a private local value of at least 16 characters.
```

`.env` is ignored by Git. `DATABASE_URL`, `CORS_ORIGINS`, `LOG_LEVEL` and `DEV_BEARER_TOKEN` are validated at startup/use; the token is never written to application logs.

## Commands

Run from `backend/`:

```powershell
.\.venv\Scripts\python -m uvicorn app.main:app --reload --no-access-log
.\.venv\Scripts\python -m ruff format --check .
.\.venv\Scripts\python -m ruff check .
.\.venv\Scripts\python -m pytest
.\.venv\Scripts\python -m app.contract_check --contract ..\docs\02-design\openapi.yaml --gaps contract-gaps.json
```

For local PostgreSQL, set `DATABASE_URL` from `.env.example`, then use `python -m alembic upgrade head` and `python -m app.db.seed`.

## Final backend gate

Run the isolated PostgreSQL check from the repository root after the regular tests:

```powershell
docker compose build backend
docker compose up -d db
docker compose run --rm backend python -m app.postgres_check
docker compose stop
```

The command creates `<DATABASE_URL database>_check`, applies real Alembic migrations, loads seed data, checks concurrent create/cancel/review, idempotency replay/conflict and push-token upsert, then drops the check database. The PostgreSQL user therefore needs `CREATEDB`; the configured source database is not mutated.

## Docker stack

Run from the repository root:

```powershell
Copy-Item backend/.env.example backend/.env
# Replace DEV_BEARER_TOKEN in backend/.env before starting protected endpoints.
docker compose up -d db
docker compose run --rm migrate
docker compose run --rm seed
docker compose up -d backend
docker compose ps
```

`migrate` applies Alembic revisions; `seed` safely upserts deterministic demo data and may be repeated. Stop containers without deleting the database volume with `docker compose stop`.

The API is available at `http://127.0.0.1:8000`; health check: `GET /health`. Protected `/v1` operations require `Authorization: Bearer <DEV_BEARER_TOKEN>`. All seven client operations are implemented: catalog, booking list/create/cancel, review creation and push-token registration.

## Contract workflow

`docs/02-design/openapi.yaml` is the source of truth. Change it only after recording impact on requirements, client, backend and tests; then update Pydantic DTO/routes and run the contract command above. `contract-gaps.json` is empty now that all operations exist. The check fails on DTO drift, undeclared/stale gaps, unexpected operations, or differences in transport signatures.

## Known limitations

- Bearer authentication is a documented development identity; production OTP is outside the MVP.
- Push tokens are stored, but production APNs/FCM delivery is outside the MVP.
- `429` remains a contract-reserved response; no rate-limit policy is configured.
- Studio-side schedule management and cancellation dispatch are external to this client API.
