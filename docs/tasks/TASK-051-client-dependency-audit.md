# TASK-051 — Аудит зависимостей клиента

## Цель

Закрыть второй пункт CL-01: проверить Expo-совместимость и оценить влияние npm advisory без опасных автоматических обновлений.

## Требования

CL-01, чеклист разработки и запрет на `npm audit fix --force` без доказанной совместимости.

## Промпт

[`docs/prompts/051-client-dependency-audit.md`](../prompts/051-client-dependency-audit.md).

## Выполнено

- `expo` обновлён с `57.0.24` до `57.0.25`, `expo-notifications` — с `57.0.20` до `57.0.21`;
- `expo install --check` подтверждает соответствие установленному SDK;
- полный и production-only audit показывают одинаковые 10 moderate, сведённые к одной цепочке `expo → @expo/config-plugins → xcode@3.0.1 → uuid@7.0.3`;
- advisory GHSA-w5hq-g745-h8pq затрагивает UUID v3/v5/v6 при передаче buffer; код приложения этот транзитивный native tooling API не вызывает;
- npm предлагает исправление только через несовместимый откат Expo 57 до 46, поэтому `--force` не применялся, остаточный риск принят до обновления upstream.
- повторный `npm ci` предупредил об окончании поддержки ESLint 9; ESLint 10 пока нельзя поставить безопасно, поскольку установленные Expo-плагины `eslint-plugin-import@2.32.0` и `eslint-plugin-react@7.37.5` ограничивают peer range версией 9.

## Проверка

- [x] `npx expo install --check` — dependencies are up to date.
- [x] `npm audit` — 10 moderate в одной транзитивной цепочке, безопасного автоматического исправления нет.
- [x] `npm audit --omit=dev` — тот же результат.
- [x] `npm run lint` и `npm run format:check`.
- [x] `npm run typecheck` и полный Vitest-suite: 55/55.
- [x] `npm run export:web`.
- [x] `git diff --check`.

## Commit

`c0f97d2` — `chore: audit client dependencies`.
