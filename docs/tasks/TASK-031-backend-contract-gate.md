# TASK-031 — Контрактный контроль backend

## Цель

Выполнить BE-03: исключить незаметное расхождение канонического OpenAPI, Pydantic DTO и публикуемых FastAPI-операций до реализации бизнес-endpoint.

## Требования и источники

- D-005 и `NFR-008`: OpenAPI — источник истины, несовместимый drift должен обнаруживаться автоматически;
- `docs/02-design/openapi.yaml` версии 1.2;
- `docs/03-development/backend-implementation-plan.md`, итерация BE-03;
- отсутствующий endpoint допустим только как явный временный gap с назначенной итерацией.

## Промпт

`docs/prompts/031-backend-contract-gate.md`.

## Выполнено

- созданы 15 Pydantic DTO/enum для всех канонических `components.schemas`;
- добавлена команда contract check и прямой dev dependency PyYAML;
- сравниваются поля, aliases, required/nullability, enum, форматы и ограничения DTO;
- runtime-операции сверяются по method/path, parameters, request body, responses, media schemas и security;
- семь ожидаемых операций явно зарегистрированы в `backend/contract-gaps.json` с BE-04–BE-07;
- правило «сначала impact/OpenAPI, затем DTO/routes» закреплено в README и `AGENTS.md`.

## Проверка

- [x] Ruff format/lint проходят.
- [x] pytest: 12/12 тестов.
- [x] Contract CLI: 15 схем совпадают, 7 ожидаемых gaps учтены.
- [x] Негативный тест меняет `Chef.name.maxLength` и подтверждает обнаружение drift.
- [x] Локальные Markdown-ссылки и OpenAPI YAML проверены.

## Commit

`79ed553` — `feat: add backend contract gate`.
