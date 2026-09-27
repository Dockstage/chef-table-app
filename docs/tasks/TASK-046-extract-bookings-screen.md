# TASK-046 — Вынос экрана записей

## Цель

Продолжить CL-02 и инкапсулировать экран «Мои классы» в собственном feature-модуле без изменения поведения.

## Требования

CL-02, NFR-005 и архитектурное правило независимости feature-модулей.

## Промпт

[`docs/prompts/046-extract-bookings-screen.md`](../prompts/046-extract-bookings-screen.md).

## Выполнено

- `BookingsScreen`, booking cards, status pill и fallback-карточка перенесены в `features/bookings/BookingsScreen.tsx`;
- `BookingFilter` экспортируется feature-модулем для состояния composition root;
- данные, load state и actions передаются через типизированные props;
- feature зависит только от domain/shared/ui и не импортирует другие features;
- `App.tsx` сокращён с 1070 до 852 строк.

## Проверка

- [x] `npm run typecheck`.
- [x] Полный Vitest-suite: 55/55.
- [x] `npm run export:web`.
- [x] `git diff --check`.

## Commit

`5ec0bf5` — `refactor: extract bookings screen`.
