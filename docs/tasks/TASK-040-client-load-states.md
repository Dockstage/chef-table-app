# TASK-040 — Состояния загрузки клиента

## Цель

Выполнить CL-04: отличать первичную ошибку от валидного Empty, сохранять данные при refresh failure и изолировать частичные сбои чтения.

## Требования

`FR-004`, `NFR-005`, `SCR-001`, `LOGIC-007`, клиентский план CL-04 и P0 из чеклиста лекций.

## Промпт

[`docs/prompts/040-client-load-states.md`](../prompts/040-client-load-states.md).

## Выполнено

- добавлена state machine `initial/loading/content/empty/error/refreshing/stale`;
- расписание и записи загружаются и отображают состояние независимо;
- первичная ошибка постоянна и содержит кнопку «Повторить»;
- refresh сохраняет последний snapshot и показывает stale/refreshing notice;
- top-level запросы и детали архивных классов используют partial results;
- недоступная деталь класса больше не скрывает бронь целиком;
- конкурирующие refresh не перезаписывают состояние более нового запроса.

## Проверка

- [x] `npm run typecheck`.
- [x] Целевые Vitest-наборы: 5/5.
- [x] Полный Vitest-suite: 41/41.
- [x] `npm run export:web`.
- [x] `git diff --check`.

## Commit

`60f08a0` — `feat: add resilient client load states`.
