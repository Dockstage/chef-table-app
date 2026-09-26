# PROMPT-028 — Каркас FastAPI backend

## Запрос пользователя

> Давай к следующему шагу

Контекст: после переноса Expo-клиента выполнить BE-00 из утверждённого backend-плана.

## Рабочий промпт

Создай минимальный слоистый FastAPI backend в `backend/` без реализации базы и бизнес-endpoint. Проверь локальную версию Python и закрепи совместимые прямые зависимости в `pyproject.toml`: FastAPI, Uvicorn, Pydantic Settings, SQLAlchemy 2, Alembic, psycopg, pytest, httpx и Ruff. Создай `app/api`, `domain`, `services`, `repositories`, `schemas`, `db`, composition root `main.py` и служебный `GET /health`. Добавь асинхронный API-тест, команды установки/запуска/format/lint/test и Python ignores. Установи зависимости только в ignored `backend/.venv`, прогони проверки и реально вызови health endpoint через запущенный Uvicorn. Обнови BE-00 и зависимые живые документы, создай TASK/PROMPT и focused commit.
