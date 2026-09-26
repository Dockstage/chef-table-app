# PROMPT-042 — Безопасная граница API клиента

## Запрос пользователя

> Погнали дальше

## Рабочий промпт

Выполни контрактную часть CL-03: синхронизируй ProblemCode и nullable DTO со всеми ответами OpenAPI, замени безусловные casts HTTP-ответов runtime-проверкой успешных DTO и Problem envelope. Унифицируй в HTTP/mock валидацию UUID, enum, rating 1–5, allergies до 300, comment до 500 и push token. Malformed серверный ответ должен безопасно давать `INVALID_RESPONSE`, а не попадать в UI. Добавь граничные тесты, оставив `Europe/Moscow` отдельной следующей итерацией.
