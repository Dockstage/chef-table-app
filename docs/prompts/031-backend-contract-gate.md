# PROMPT-031 — Контрактный контроль backend

## Запрос пользователя

> погнали

Контекст: после завершения BE-02 перейти к BE-03 утверждённого backend-плана.

## Рабочий промпт

Реализуй воспроизводимый contract gate между каноническим `docs/02-design/openapi.yaml`, Pydantic DTO и runtime OpenAPI FastAPI. Создай DTO/enum для всех `components.schemas` с точными aliases, required/nullability, форматами и ограничениями. Проверяй операции по operationId, method/path, parameters, request body, responses, media schemas и Bearer security. Поскольку бизнес-endpoint появятся в BE-04–BE-07, зафиксируй каждый из семи отсутствующих operationId в отдельном machine-readable gaps-файле с причиной и назначенной итерацией; undeclared или stale gap должен ломать проверку. Добавь CLI, позитивный и негативный pytest, прямую dev-зависимость парсера YAML, команды и правило OpenAPI-first в документацию. Обнови TASK/PROMPT и сделай focused commit.
