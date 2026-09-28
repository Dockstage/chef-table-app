# Финальный ручной smoke

Дата: 28.09.2026. Code revision: `3b4e84c`; незакоммиченные изменения затрагивали документацию и evidence. Среда: Codex in-app browser, Expo web в HTTP-режиме, FastAPI Docker, PostgreSQL 16, реальные Alembic migrations и seed. Viewport: 360×800 px.

| Сценарий | Фактический результат | Evidence |
|---|---|---|
| Расписание и responsive | Класс 29 сентября загружен; `innerWidth=360`, `scrollWidth=360`, горизонтального переполнения нет | [`final-schedule-360.png`](../evidence/final-schedule-360.png), [`final-smoke-api-log.json`](../evidence/final-smoke-api-log.json) |
| Создание брони | Бронь появилась в «Предстоящих», остаток изменился с 3 до 2 | [`final-booking-success-360.png`](../evidence/final-booking-success-360.png) |
| Duplicate conflict | Повторная UI-команда показала «У вас уже есть активная бронь этого класса», второй активной брони не создано | [`final-duplicate-ui.json`](../evidence/final-duplicate-ui.json), [`final-duplicate-attempt-360.png`](../evidence/final-duplicate-attempt-360.png) |
| Retry/idempotency | Первый и повторный запросы вернули `201` и один booking ID; replay header сменился `false → true`; изменённый payload дал `409 IDEMPOTENCY_CONFLICT` | [`final-smoke-api-log.json`](../evidence/final-smoke-api-log.json) |
| Отмена и возврат места | UI-бронь получила `cancelled_by_client`, исчезла из предстоящих, место вернулось до 3; тестовая retry-бронь также очищена, остаток восстановлен до 6 | [`final-cancellation-success-360.png`](../evidence/final-cancellation-success-360.png), [`final-cancellation-history-360.png`](../evidence/final-cancellation-history-360.png), [`final-smoke-api-log.json`](../evidence/final-smoke-api-log.json) |
| История и отзыв | Причина отмены студией сохранена; для посещённого класса сохранены 5 звёзд и комментарий, повторное действие исчезло | [`final-cancellation-history-360.png`](../evidence/final-cancellation-history-360.png), [`final-review-success-360.png`](../evidence/final-review-success-360.png) |
| Web push fallback | Контрол отключён и сообщает, что уведомления доступны в Android/iOS; удалённые ложные пункты отсутствуют | [`final-web-push-fallback-360.png`](../evidence/final-web-push-fallback-360.png) |

## Ограничения

Android/iOS, системное разрешение, device token, доставка APNs/FCM, screen reader и native font scaling не проверялись и не заменялись web-результатом. Ошибок проекта в финальном smoke не обнаружено. После проверки Metro и Docker-контейнеры остановлены.

На снимке истории видны две отменённые записи «Паста с нуля»: это отдельные записи предыдущего и текущего smoke, обе имеют конечный статус `cancelled_by_client`; одновременно активного дубля не было.
