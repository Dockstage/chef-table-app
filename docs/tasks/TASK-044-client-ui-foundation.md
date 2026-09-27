# TASK-044 — UI foundation клиента

## Цель

Начать CL-02 и убрать из composition root общую тему и переиспользуемые UI-компоненты без изменения пользовательского поведения.

## Требования

CL-02, архитектурное правило декомпозиции и P1-пункт лекционного gap-checklist для `App.tsx`.

## Промпт

[`docs/prompts/044-client-ui-foundation.md`](../prompts/044-client-ui-foundation.md).

## Выполнено

- палитра вынесена в `client/src/ui/theme.ts`;
- `ScreenHeader`, `Segment`, `EmptyState`, `ErrorState` и `RefreshNotice` вынесены в `client/src/ui/primitives.tsx`;
- локальные стили компонентов удалены из `App.tsx`;
- направление зависимостей UI-слоя зафиксировано в архитектуре;
- `App.tsx` сокращён с 1574 до 1385 строк без функциональных изменений.

## Проверка

- [x] `npm run typecheck`.
- [x] Полный Vitest-suite: 55/55.
- [x] `npm run export:web`.
- [x] `git diff --check`.

## Commit

Будет указан после фиксации реализации.
