# PROMPT-030 — HTTP-инфраструктура и dev-auth

## Запрос пользователя

> Давай следующий шаг

Контекст: после завершения BE-01 перейти к BE-02 утверждённого backend-плана.

## Рабочий промпт

Реализуй общую HTTP-инфраструктуру FastAPI до доменных endpoint: валидируемые settings для PostgreSQL DSN, CORS, log level и локального dev Bearer-токена; CORS middleware; уникальный request ID в response/problem/log; безопасное структурированное логирование без headers, body, аллергий и токенов. Реализуй канонические `Problem`/`FieldError`, полный маппинг предметных кодов к HTTP-статусам и handlers для `401`, request validation, неизвестного URL и непредвиденной ошибки. Bearer dependency должна constant-time сравнивать токен из ignored env и возвращать ID seeded demo-клиента; production OTP не добавлять. Покрой инфраструктуру API-тестами, проверь Docker health, обнови OpenAPI и зависимые документы, создай TASK/PROMPT и focused commit.
