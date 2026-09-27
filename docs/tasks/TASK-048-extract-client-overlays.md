# TASK-048 — Вынос booking/review overlays

## Цель

Завершить UI-декомпозицию CL-02: убрать формы бронирования и отзыва из composition root без изменения поведения.

## Требования

CL-02 и архитектурное правило независимости feature-модулей.

## Промпт

[`docs/prompts/048-extract-client-overlays.md`](../prompts/048-extract-client-overlays.md).

## Выполнено

- `ClassModal` и его стили перенесены в `features/booking/ClassModal.tsx`;
- `ReviewModal` и его стили перенесены в `features/review/ReviewModal.tsx`;
- общие primary action styles вынесены в `ui/layout.ts`;
- overlays получают данные, busy state и callbacks через типизированные props;
- feature-модули не импортируют друг друга;
- `App.tsx` сокращён с 765 до 462 строк.

## Проверка

- [x] `npm run typecheck`.
- [x] Полный Vitest-suite: 55/55.
- [x] `npm run export:web`.
- [x] `git diff --check`.

## Commit

Будет указан после фиксации реализации.
