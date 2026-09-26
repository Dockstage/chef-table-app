# TASK-032 — Endpoint каталога занятий

## Цель

Выполнить BE-04: реализовать защищённое чтение расписания и карточки занятия из PostgreSQL без расхождения с каноническим OpenAPI.

## Требования и источники

- `FR-001`–`FR-003`, `FR-006`, `NFR-008`, `NFR-011`;
- `listClasses` и `getClass` в `docs/02-design/openapi.yaml`;
- `docs/02-design/data-model.md`;
- `docs/03-development/backend-implementation-plan.md`, итерация BE-04.

## Промпт

[`docs/prompts/032-catalog-endpoints.md`](../prompts/032-catalog-endpoints.md).

## Выполнено

- добавлены domain-модели и repository contract каталога;
- SQLAlchemy repository читает связанные класс, программу и шефа из PostgreSQL;
- service валидирует полуоткрытый диапазон `[from, to)`, фильтрует уровень и обеспечивает стабильную сортировку;
- реализованы защищённые `GET /v1/classes` и `GET /v1/classes/{classId}`;
- ошибки диапазона, auth, валидации, неизвестного ID и недоступной БД используют `application/problem+json`;
- `listClasses` и `getClass` удалены из временного реестра contract gaps.

## Проверка

- [x] Ruff format/lint проходят.
- [x] pytest: 20/20 тестов.
- [x] Contract CLI: 15 схем совпадают, 5 ожидаемых gaps учтены.
- [x] Docker: build, migrations, seed и healthchecks проходят.
- [x] Реальные HTTP-запросы к PostgreSQL подтвердили список из 6 записей, 3 advanced, пустой диапазон, отменённый класс и ответы 400/401/404.
- [x] Runtime OpenAPI публикует `listClasses`/`getClass` без лишнего `application/json` для Problem-ответов.

## Commit

`67a5b5f` — `feat: implement cooking class catalog endpoints`.
