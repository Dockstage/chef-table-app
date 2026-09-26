# TASK-039 — Отмена, отзыв и refresh

## Цель

Выполнить CL-06: отделить успешные мутации отмены и отзыва от фонового refresh, обработать повторную отмену и проверить границы отзыва.

## Требования

`FR-010`, `FR-012`, `NFR-005`, `UC-02`, `UC-03`, `LOGIC-004`, `LOGIC-005` и клиентский план CL-06.

## Промпт

[`docs/prompts/039-cancellation-review-refresh.md`](../prompts/039-cancellation-review-refresh.md).

## Выполнено

- серверный результат отмены и отзыва применяется до refresh;
- сбой refresh сообщает об устаревших данных, не маскируя успех;
- добавлен код `BOOKING_NOT_ACTIVE` и восстановление актуальной брони после повторной отмены;
- общий mutation finalizer используется для создания, отмены и отзыва;
- проверены одноразовый отзыв, история отмены студией и границы rating/comment.

## Проверка

- [x] `npm run typecheck`.
- [x] Полный Vitest-suite: 36/36.
- [x] `git diff --check`.

## Commit

`c2cabdd` — `fix: preserve cancellation and review results`.
