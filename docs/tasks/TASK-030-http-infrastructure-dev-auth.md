# TASK-030 — HTTP-инфраструктура и dev-auth

## Цель

Выполнить BE-02: подготовить безопасную общую HTTP-границу до реализации доменных endpoint.

## Требования и источники

- `FR-015`, `NFR-006`, `NFR-011` и D-004;
- `docs/02-design/openapi.yaml`, схемы `Problem` и `bearerAuth`;
- `docs/03-development/backend-implementation-plan.md`, итерация BE-02;
- production OTP, сессии и управление пользователями находятся вне MVP.

## Промпт

`docs/prompts/030-http-infrastructure-dev-auth.md`.

## Выполнено

- настройки DSN, CORS, log level и dev-токена перенесены в валидируемое окружение;
- добавлены CORS, уникальный `X-Request-ID` и безопасный структурированный HTTP-log;
- реализованы схемы `Problem`/`FieldError`, централизованные handlers и маппинг предметных кодов;
- добавлена constant-time Bearer-проверка, возвращающая ID seeded demo-клиента;
- общие `NOT_FOUND`/`METHOD_NOT_ALLOWED` добавлены в OpenAPI 1.2 для транспортных ошибок;
- README и зависимые чек-листы/трассировка актуализированы.

## Проверка

- [x] Ruff format/lint проходят.
- [x] pytest: 9/9 тестов, включая CORS, request ID, `401`, `404`, `422`, `500` и settings validation.
- [x] Тест подтверждает отсутствие Bearer-токена и текста аллергии в response/log.
- [x] Docker Compose поднимает healthy backend; реальный `/health` возвращает `200` и `X-Request-ID`.
- [x] Контейнер пишет JSON-log только с техническими метаданными запроса.

## Commit

Будет указан после фиксации изменений.
