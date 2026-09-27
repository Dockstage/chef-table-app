# TASK-045 — Вынос экрана расписания

## Цель

Продолжить CL-02 и инкапсулировать UI расписания в собственном feature-модуле без изменения поведения.

## Требования

CL-02, архитектурное правило feature-декомпозиции и P1-пункт лекционного gap-checklist для `App.tsx`.

## Промпт

[`docs/prompts/045-extract-schedule-screen.md`](../prompts/045-extract-schedule-screen.md).

## Выполнено

- `DiscoverScreen`, `ClassCard` и календарные опции перенесены в `features/schedule/DiscoverScreen.tsx`;
- feature получает данные, load state и actions через типизированные props;
- общие `screenContent` и `loader` вынесены в `ui/layout.ts`;
- schedule-стили удалены из корневого файла;
- `App.tsx` сокращён с 1385 до 1070 строк.

## Проверка

- [x] `npm run typecheck`.
- [x] Полный Vitest-suite: 55/55.
- [x] `npm run export:web`.
- [x] `git diff --check`.

## Commit

`1463257` — `refactor: extract schedule screen`.
