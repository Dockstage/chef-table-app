# TASK-050 — Настройка lint и format клиента

## Цель

Закрыть первый пункт CL-01 и сделать стиль клиентского кода воспроизводимо проверяемым.

## Требования

CL-01, чеклист разработки и правила репозитория.

## Промпт

[`docs/prompts/050-client-lint-format.md`](../prompts/050-client-lint-format.md).

## Выполнено

- добавлены Expo flat ESLint config, Prettier и совместимый слой `eslint-config-prettier`;
- добавлены строгие команды `lint`, `lint:fix`, `format` и `format:check`;
- исключены только генерируемые `.expo`, `coverage`, `dist`, `node_modules` и lock-файл;
- исходники приведены к единому формату, реальные нарушения React Hooks исправлены без отключения правил;
- команды и фактическое количество тестов синхронизированы в README и `AGENTS.md`;
- установка зависимостей сообщила о 10 moderate vulnerabilities; их анализ остаётся отдельным пунктом CL-01, `--force` не применялся.

## Проверка

- [x] `npm run lint` — без ошибок и предупреждений.
- [x] `npm run format:check`.
- [x] `npm run typecheck`.
- [x] Полный Vitest-suite: 55/55.
- [x] `npm run export:web`.
- [x] `git diff --check`.

## Commit

Будет добавлен после фиксации изменений.
