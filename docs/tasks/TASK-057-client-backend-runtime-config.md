# TASK-057 — Runtime-конфигурация backend клиента

## Цель

Подготовить CL-09 к сквозному прогону: сделать FastAPI основным явно настроенным источником данных и исключить незаметную подмену backend автономным mock.

## Требования

`FR-015`, `ADR-001`, CL-09 и архитектурное правило зависимости клиента от `StudioApi`.

## Промпт

[`docs/prompts/057-client-backend-runtime-config.md`](../prompts/057-client-backend-runtime-config.md).

## Выполнено

- `EXPO_PUBLIC_API_MODE=http` создаёт `HttpStudioApi`, а `mock` явно включает demo/test fallback;
- HTTP-режим требует base URL и development Bearer token, не переходя на mock при ошибке;
- token provider добавляет `Authorization` ко всем запросам клиента;
- CI явно использует mock при статическом web-export;
- `.env.example`, README, backend-инструкция, архитектура и трассировка синхронизированы;
- отдельно отмечено, что `EXPO_PUBLIC_*` доступен в bundle и допустим только для учебной dev-идентификации.

## Проверка

- [x] `npm run lint` и `npm run format:check`.
- [x] `npm run typecheck`.
- [x] Полный Vitest-suite: 58/58.
- [x] `npm run export:web` с явным mock-режимом.
- [x] `git diff --check`.

## Commit

Будет указан после фиксации изменений.
