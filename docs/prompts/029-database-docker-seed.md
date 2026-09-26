# PROMPT-029 — PostgreSQL, Docker, миграции и seed

## Запрос пользователя

> Идём дальше

Контекст: после завершения BE-00 перейти к следующей итерации утверждённого backend-плана.

## Рабочий промпт

Выполни BE-01 для отдельного FastAPI backend. На основе канонической модели данных создай SQLAlchemy-модели и начальную Alembic-миграцию всех сущностей, связей, индексов и ограничений. Добавь PostgreSQL 16, backend, healthchecks и отдельные services миграции/seed в корневой Docker Compose, а также безопасный Dockerfile и `.env.example`. Подготовь детерминированный идемпотентный seed с demo-клиентом и состояниями, нужными текущему Expo-клиенту. Проверь upgrade на пустой базе, downgrade/upgrade, повторный seed, отсутствие diff между metadata и миграцией, ключевые ограничения БД и реальный health endpoint. Обнови связанные README, архитектуру, чек-листы, TASK/PROMPT и сделай focused commit.
