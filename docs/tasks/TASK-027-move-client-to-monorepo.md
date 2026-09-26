# TASK-027 — Перенос Expo-клиента в `client/`

## Цель

Выполнить первый структурный шаг monorepo: отделить существующее Expo-приложение в `client/` без изменения исходного кода и поведения, сохранив общие документы в корне.

## Требования и источники

- ADR-001, пункты 1–2 и критерий отдельного client/backend;
- `docs/03-development/client-implementation-plan.md`, итерация CL-00;
- `docs/lecture-gap-checklists.md`, P0 по monorepo;
- лекционный принцип раздельной реализации client и backend.

## Промпт

`docs/prompts/027-move-client-to-monorepo.md`.

## Выполнено

- `App.tsx`, `src/`, `tests/`, Expo-конфигурация, `.env.example` и Node manifests перенесены в `client/`;
- локальные `node_modules`, `.expo`, `.npm-cache` и `dist` перемещены вместе с клиентом и остаются ignored;
- общие `docs/`, `README.md`, `AGENTS.md` и Git-конфигурация сохранены в корне;
- актуальные команды, структура и ссылки обновлены;
- исходники клиента не редактировались.

## Проверка

До переноса из корня:

- [x] `npm run typecheck` — без ошибок;
- [x] `npm test` — 5 файлов, 24/24 теста;
- [x] `EXPO_NO_TELEMETRY=1 npm run export:web` — bundle создан.

После переноса из `client/`:

- [x] `npm run typecheck` — без ошибок;
- [x] `npm test` — 5 файлов, 24/24 теста;
- [x] `EXPO_NO_TELEMETRY=1 npm run export:web` — bundle создан;
- [x] tracked-содержимое каждого перемещённого клиентского файла совпадает с версией до переноса.

## Commit

`021a693` — `refactor: move Expo client into monorepo directory`.
