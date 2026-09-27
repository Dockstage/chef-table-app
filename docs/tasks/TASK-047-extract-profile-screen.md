# TASK-047 — Вынос экрана профиля

## Цель

Продолжить CL-02 и инкапсулировать профиль в собственном feature-модуле без изменения поведения.

## Требования

CL-02 и архитектурное правило независимости feature-модулей.

## Промпт

[`docs/prompts/047-extract-profile-screen.md`](../prompts/047-extract-profile-screen.md).

## Выполнено

- `ProfileScreen` и его стили перенесены в `features/profile/ProfileScreen.tsx`;
- тип `PushStatus` экспортируется feature-модулем для состояния composition root;
- bookings, push state и action передаются через типизированные props;
- feature зависит только от domain/ui и не импортирует другие features;
- `App.tsx` сокращён с 852 до 765 строк.

## Проверка

- [x] `npm run typecheck`.
- [x] Полный Vitest-suite: 55/55.
- [x] `npm run export:web`.
- [x] `git diff --check`.

## Commit

Будет указан после фиксации реализации.
