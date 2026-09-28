# TASK-059 — Финальный client gate

## Цель

Закрыть CL-10 воспроизводимой чистой установкой и единым итоговым прогоном всех клиентских quality gates.

## Требования

CL-10, `NFR-008`–`NFR-010`, правила сдачи и ограничения, зафиксированные TASK-056/TASK-058.

## Промпт

[`docs/prompts/059-final-client-gate.md`](../prompts/059-final-client-gate.md).

## Выполнено

- использованы Node.js 24.15.0 и npm 11.12.1;
- глобальная настройка npm `production=true` исключила devDependencies при первом `npm ci`; воспроизводимая команда скорректирована на `npm ci --include=dev`;
- чистая установка добавила 763 packages строго по lock-файлу, package/lock не изменились;
- Expo подтвердил совместимость всех зависимостей;
- README, submission checklist, итоговый план, ручной отчёт, трассировка и lecture checklist приведены к фактическим 58 тестам;
- ограничения Android/iOS, screen reader, native font scaling и production APNs/FCM сохранены явно.

## Проверка

- [x] `npm ci --include=dev`.
- [x] `npx expo install --check`.
- [x] `npm run lint` и `npm run format:check`.
- [x] `npm run typecheck`.
- [x] Полный Vitest-suite: 10 файлов, 58/58.
- [x] `EXPO_PUBLIC_API_MODE=mock npm run export:web`.
- [x] `git diff --check`.

## Commit

Будет указан после фиксации изменений.
