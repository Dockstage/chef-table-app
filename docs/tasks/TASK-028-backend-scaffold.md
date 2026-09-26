# TASK-028 — Каркас FastAPI backend

## Цель

Создать минимальный, запускаемый и проверяемый каркас отдельного FastAPI backend до подключения PostgreSQL и реализации бизнес-endpoint.

## Требования и источники

- ADR-001: Python 3.12+, FastAPI, Pydantic, SQLAlchemy 2, Alembic, PostgreSQL и pytest;
- `docs/03-development/backend-implementation-plan.md`, итерация BE-00;
- лекционный порядок: сначала выбрать инструменты и подготовить план/структуру, затем переходить к БД;
- `AGENTS.md`: не помещать бизнес-логику в handlers или composition root.

## Промпт

`docs/prompts/028-backend-scaffold.md`.

## Выполнено

- создан `backend/pyproject.toml` с закреплёнными прямыми runtime/dev-зависимостями;
- созданы пакеты `api`, `domain`, `services`, `repositories`, `schemas`, `db` и composition root;
- реализован служебный `GET /health`, не входящий в публичный клиентский OpenAPI;
- добавлен асинхронный API-тест через `httpx.ASGITransport`;
- настроены Ruff format/lint и pytest;
- добавлены backend-команды и Python-артефакты в `.gitignore`.

## Проверка

- [x] Python 3.12.10 и Docker Compose доступны.
- [x] `python -m pip install -e ".[dev]"` успешно в локальном `.venv`.
- [x] `python -m ruff format --check .` — 14 файлов отформатированы.
- [x] `python -m ruff check .` — без замечаний.
- [x] `python -m pytest` — 1/1 тест пройден без предупреждений.
- [x] Uvicorn запускается; реальный `GET http://127.0.0.1:8000/health` возвращает `200 {"status":"ok"}`.

## Commit

Будет указан после фиксации изменения.
