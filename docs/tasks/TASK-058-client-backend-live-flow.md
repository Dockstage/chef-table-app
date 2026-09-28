# TASK-058 — Сквозной клиентский поток с FastAPI

## Цель

Завершить CL-09 фактическим прогоном клиента через FastAPI и PostgreSQL без `MockStudioApi`.

## Требования

`FR-001`–`FR-015`, `NFR-004`, `NFR-009`, `ADR-001`, CL-09 и TC-001–TC-022.

## Промпт

[`docs/prompts/058-client-backend-live-flow.md`](../prompts/058-client-backend-live-flow.md).

## Выполнено

- Docker Compose поднял PostgreSQL 16 и FastAPI; реальные Alembic-миграции и идемпотентный seed применены отдельно;
- Expo web в режиме `http` загрузил семь актуальных классов и пять исходных броней через Bearer auth;
- UI создал бронь «Паста с нуля»: место уменьшилось с 3 до 2, бронь появилась в предстоящих;
- повторная запись показала `DUPLICATE_BOOKING`, не создавая вторую активную бронь;
- два replay-запроса с одинаковыми body/key вернули одну seed-бронь, а другой body с тем же ключом дал `409 IDEMPOTENCY_CONFLICT`;
- UI отменил созданную бронь: backend сохранил `cancelled_by_client`, место восстановилось до 3;
- UI сохранил для «Домашней пасты» оценку 4 и комментарий «Понятно и вкусно»; повторное действие исчезло;
- существующий seed push-токен дважды зарегистрирован с `204`, подтвердив upsert; web-профиль честно показал native-only fallback;
- Android/iOS-среда была недоступна, поэтому permission/device token и доставка APNs/FCM не считаются проверенными.

## Проверка

- [x] `GET /health` — `200`, авторизованные catalog/bookings requests — `200`.
- [x] Ручной web-поток расписание → бронь → duplicate → отмена → отзыв.
- [x] Replay возвращает тот же booking ID; изменённый payload — `409 IDEMPOTENCY_CONFLICT`.
- [x] Backend state: `cancelled_by_client`, `availableSeats=3`, `rating=4`, комментарий сохранён.
- [x] Повторная регистрация seed push-токена — `204/204`.
- [x] `git diff --check`.

## Commit

`01029ed` — `docs: record live client backend flow`.
