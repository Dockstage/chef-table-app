# TASK-019 — Технический дизайн и OpenAPI

## Цель

Согласовать целевую модель FastAPI/PostgreSQL, последовательности и клиентский API-контракт до написания мобильного ТЗ и реализации backend.

## Источники

- лекционные промпты по ER/sequence и OpenAPI;
- канонические BR/FR/NFR, доменные правила, US/UC и дизайн-брифы;
- ADR-001 и решения D-005–D-007;
- текущие клиентские типы, HTTP/mock adapters и push validator для impact analysis.

## Промпт

`docs/prompts/019-technical-design-and-openapi.md`.

## Выполнено

- модель расширена `IdempotencyRecord`, полями, enum, nullability и PostgreSQL constraints;
- read-only и mutable-сущности разделены, владелец каждого инварианта указан;
- createBooking sequence разделяет replay, `201`, предметные `409`, `410` и auth/validation failures;
- push sequence требует `type`, `bookingId`, `reason` и игнорирует malformed payload;
- архитектура отражает ADR-001 и целевые client/backend/PostgreSQL boundaries;
- OpenAPI 1.1 содержит 7 operationId, Bearer security, общий Problem, примеры и retry semantics;
- связанные FR, тест-кейсы, историческая TASK и чек-лист синхронизированы;
- кодовые расхождения оставлены открытыми задачами разработки.

## Проверка

- [x] YAML разбирается PyYAML как OpenAPI 3.1.0.
- [x] Все внутренние `$ref` разрешаются.
- [x] Все 7 операций имеют уникальный `operationId`.
- [x] Path-параметры совпадают с placeholders.
- [x] В требованиях, OpenAPI и sequence отменённый слот — `410 SLOT_CANCELLED`.
- [x] Исходный бриф не изменён.

## Commit

`60dae24` — `docs: synchronize technical design and API contract`.
