# TASK-029 — PostgreSQL, Docker, миграции и seed

## Цель

Реализовать BE-01: воспроизводимо поднять FastAPI и PostgreSQL, создать каноническую схему данных и отдельное идемпотентное demo-наполнение до разработки бизнес-endpoint.

## Требования и источники

- `docs/02-design/data-model.md` и `docs/02-design/openapi.yaml`;
- `docs/03-development/backend-implementation-plan.md`, итерация BE-01;
- лекционный порядок: инфраструктура, миграции и данные до прикладных handlers;
- seed не должен запускаться автоматически вместе с production-сервисом.

## Промпт

`docs/prompts/029-database-docker-seed.md`.

## Выполнено

- добавлены SQLAlchemy-модели восьми сущностей и настройки подключения;
- создана начальная Alembic-миграция с FK, индексами и check/unique constraints;
- добавлены `backend/Dockerfile` и корневой `compose.yaml` с healthchecks;
- добавлен отдельный идемпотентный seed с относительными датами и всеми demo-состояниями клиента;
- команды запуска, миграции и seed описаны в README и связанных планах.

## Проверка

- [x] Ruff format/lint и backend pytest проходят; offline SQL Alembic генерируется.
- [x] PostgreSQL и FastAPI в Docker переходят в healthy; `GET /health` возвращает `200 {"status":"ok"}`.
- [x] На пустой БД применена ревизия `20260926_0001`, создано 8 доменных таблиц.
- [x] Выполнен цикл `downgrade base → upgrade head`; `alembic check` не находит расхождений.
- [x] Два запуска seed сохраняют количества: 9 классов и 5 броней.
- [x] База отклоняет отрицательный остаток и вторую активную бронь клиента на тот же класс.

## Commit

`d2a1908` — `feat: add PostgreSQL migrations and seed`.
