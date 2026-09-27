# TASK-049 — Вынос application orchestration

## Цель

Завершить CL-02: оставить `App.tsx` composition root, отделив orchestration от app shell и feature UI.

## Требования

CL-02 и архитектурное правило направленных зависимостей.

## Промпт

[`docs/prompts/049-extract-client-orchestration.md`](../prompts/049-extract-client-orchestration.md).

## Выполнено

- `application/useStudioApp.ts` владеет состоянием, snapshot-load, мутациями, idempotency и push-эффектами;
- `application/StudioApp.tsx` собирает экраны, overlays, toast и нижнюю навигацию;
- `shared/viewTypes.ts` содержит общие `Tab`, `BookingFilter` и `PushStatus` без обратной зависимости на feature UI;
- `App.tsx` сокращён с 462 до 8 строк и только создаёт API/рендерит `StudioApp`;
- application-каталог назван `src/application`, чтобы Expo не принял `src/app` за корень Expo Router;
- архитектурный документ синхронизирован с фактическими слоями, все пункты CL-02 закрыты.

## Проверка

- [x] `npm run typecheck`.
- [x] Полный Vitest-suite: 55/55.
- [x] `npm run export:web`; после переименования нет сообщения `Using src/app as the root directory for Expo Router`.
- [x] `git diff --check`.

## Commit

Будет указан после фиксации реализации.
