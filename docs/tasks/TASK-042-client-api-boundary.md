# TASK-042 — Безопасная граница API клиента

## Цель

Выполнить контрактную часть CL-03: синхронизировать клиентские типы с OpenAPI, перестать доверять входящему JSON и унифицировать валидацию команд.

## Требования

`FR-008`, `NFR-008`, `LOGIC-007`, OpenAPI 1.2 и первые три пункта клиентского плана CL-03.

## Промпт

[`docs/prompts/042-client-api-boundary.md`](../prompts/042-client-api-boundary.md).

## Выполнено

- добавлены все 19 OpenAPI `ProblemCode` и отдельные клиентские `NETWORK_ERROR/INVALID_RESPONSE`;
- nullable-поля `CookingClass/Booking` синхронизированы с required-полями OpenAPI;
- HTTP adapter валидирует каждый успешный DTO и Problem envelope до использования;
- проверяются UUID, enum, ISO date-time с offset, числа, строки, цвета и семантика причин отмены;
- HTTP и mock отклоняют некорректные booking/review/push-команды до побочного эффекта;
- покрыты allergies 0/300/301, comment 0/500/501 и rating 0/1/5/6/дробь;
- malformed/unknown server payload преобразуется в безопасный `INVALID_RESPONSE`.

## Проверка

- [x] `npm run typecheck`.
- [x] Полный Vitest-suite: 54/54.
- [x] `git diff --check`.

## Commit

Будет указан после фиксации реализации.
