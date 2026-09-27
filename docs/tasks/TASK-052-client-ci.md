# TASK-052 — CI для клиента

## Цель

Завершить CL-01 и сделать клиентские quality gates воспроизводимыми на GitHub.

## Требования

CL-01 и пункт P2 чеклиста разработки.

## Промпт

[`docs/prompts/052-client-ci.md`](../prompts/052-client-ci.md).

## Выполнено

- добавлен отдельный workflow `Client CI` для push в `main`, pull request и ручного запуска;
- path filters исключают запуск при изменениях, не затрагивающих клиент или сам workflow;
- job использует Node.js 24, npm cache и чистую установку через `npm ci`;
- последовательно проверяются lint, форматирование, TypeScript, тесты и web-export;
- сетевой `expo install --check` не дублируется в обязательном CI: совместимость уже подтверждена в TASK-051, а повторная проверка метаданных дала timeout при локальном прогоне;
- права ограничены `contents: read`, устаревшие запуски одной ветки отменяются;
- README синхронизирован с фактическим CI.

## Проверка

- [x] Workflow YAML проходит Prettier.
- [x] `npm ci`.
- [x] `npm run lint` и `npm run format:check`.
- [x] `npm run typecheck` и полный Vitest-suite: 55/55.
- [x] `npm run export:web`.
- [x] `git diff --check`.

## Commit

Будет добавлен после фиксации изменений.
