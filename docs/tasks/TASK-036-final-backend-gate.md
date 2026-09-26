# TASK-036 — Финальный backend gate

## Цель

Выполнить BE-08: сделать итоговую проверку backend воспроизводимой и зафиксировать ограничения.

## Требования

`NFR-004`, `NFR-008`, backend-план BE-08 и тестовый чеклист лекций.

## Промпт

[`docs/prompts/036-final-backend-gate.md`](../prompts/036-final-backend-gate.md).

## Выполнено

- добавлен `app.postgres_check` с отдельной автоматически создаваемой БД;
- Alembic поддерживает явный программный URL, не меняя обычный CLI-путь;
- gate применяет миграции с нуля, seed и проверяет create/replay/conflict/cancel/review/push;
- конкурентные операции проверяют итоговые остатки, уникальность и rollback;
- test-БД удаляется, исходная БД не изменяется;
- README содержит команды и production-ограничения.

## Проверка

- [x] Ruff format/lint.
- [x] pytest: 42/42.
- [x] Contract gate: 15 схем, 7 операций, 0 gaps.
- [x] PostgreSQL gate прошёл на новой БД после реальной Alembic-миграции.
- [x] После выполнения test-БД отсутствует, Docker остановлен.
- [x] Markdown-ссылки и `git diff --check` проходят.

## Commit

Будет добавлен после фиксации реализации.
