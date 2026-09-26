# PROMPT-036 — Финальный backend gate

## Запрос пользователя

> Давай следующий этап

## Рабочий промпт

Выполни BE-08: добавь воспроизводимую PostgreSQL integration/concurrency-проверку, которая использует отдельную временную БД, применяет реальные Alembic-миграции и seed, проверяет create/replay/idempotency conflict/cancel/review concurrency и push upsert, а затем гарантированно удаляет test-БД. Прогони Ruff, pytest, contract gate и Docker-проверку. Обнови команды, статусы и честно зафиксируй production-ограничения; создай TASK/PROMPT и focused commit.
