# TASK-041 — Строгий push-контракт

## Цель

Выполнить CL-07: отклонять malformed push до побочного эффекта и различать foreground, tap и cold start при адресном обновлении брони.

## Требования

`FR-013`, `FR-014`, `NFR-009`, `UC-04`, `LOGIC-006`, OpenAPI `ClassCancellationPush` и клиентский план CL-07.

## Промпт

[`docs/prompts/041-strict-push-contract.md`](../prompts/041-strict-push-contract.md).

## Выполнено

- parser проверяет точные поля, UUID, непустую причину до 500 символов и лишние ключи;
- malformed и чужие события не вызывают callback, refresh или очистку cold-start response;
- callback получает валидный payload и тип взаимодействия `received/opened`;
- foreground сохраняет текущую вкладку, open/cold start открывает историю;
- `bookingId` выбирает конкретную отменённую бронь из серверного ответа;
- `reason` из push не подменяет серверное состояние;
- web остаётся unsupported fallback, APNs/FCM относятся только к Android/iOS.

## Проверка

- [x] `npm run typecheck`.
- [x] Целевые push-тесты: 13/13.
- [x] Полный Vitest-suite: 50/50.
- [x] `git diff --check`.

## Commit

Будет указан после фиксации реализации.
