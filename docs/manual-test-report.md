# Отчёт о ручной проверке

Дата финального прогона: 28.09.2026. Code revision: `3b4e84c`; локальные незакоммиченные изменения затрагивали только документацию и evidence.

Среда: Expo SDK 57, React Native Web, Codex in-app browser, FastAPI в Docker и PostgreSQL 16 с реальными Alembic migrations и seed. Финальный viewport: 360×800 px.

## Финальный smoke

| Сценарий | Результат | Доказательство |
|---|---|---|
| Расписание и responsive | Пройден | Класс загружен; `innerWidth=360`, `scrollWidth=360` — [`final-schedule-360.png`](evidence/final-schedule-360.png) |
| Создание брони | Пройден | Бронь появилась в предстоящих, остаток уменьшился — [`final-booking-success-360.png`](evidence/final-booking-success-360.png) |
| Duplicate conflict | Пройден | UI показал предметное сообщение, второй активной брони нет — [`final-duplicate-ui.json`](evidence/final-duplicate-ui.json) |
| Retry/idempotency | Пройден | `201/201`, один booking ID, replay `false → true`; изменённый payload — `409 IDEMPOTENCY_CONFLICT` — [`final-smoke-api-log.json`](evidence/final-smoke-api-log.json) |
| Отмена и возврат места | Пройден | Статус `cancelled_by_client`, бронь в истории, место восстановлено — [`final-cancellation-history-360.png`](evidence/final-cancellation-history-360.png) |
| Оценка и комментарий | Пройден | Сохранены 5 звёзд и новый комментарий — [`final-review-success-360.png`](evidence/final-review-success-360.png) |
| Push web fallback | Пройден | Финальный профиль сообщает про Android/iOS, ложные affordances отсутствуют — [`final-web-push-fallback-360.png`](evidence/final-web-push-fallback-360.png) |

Подробные шаги и итоговое состояние backend: [`04-testing/final-manual-smoke.md`](04-testing/final-manual-smoke.md).

## Ранее проверенные дополнительные сценарии

Периоды 14/30 дней, фильтр и empty state, детали класса, доступный/недоступный прокат, граница аллергий, дедлайн отмены и ограничение роли клиента проверялись на предыдущих итерациях и покрыты соответствующими domain/data/backend-тестами. Исторические screenshots сохранены в [`evidence/README.md`](evidence/README.md), но не выдаются за evidence финального UI.

## Автоматический регресс

- client clean install и Expo compatibility — успешно;
- ESLint, Prettier и TypeScript — успешно;
- Vitest — 10 файлов, 58/58 тестов;
- web export — успешно;
- backend Ruff — успешно;
- pytest — 42/42 теста;
- OpenAPI contract — 15 schemas, 0 operation gaps;
- PostgreSQL gate — migrations, create/replay/cancel/review concurrency и push upsert прошли.

Полный журнал: [`04-testing/final-automated-regression.md`](04-testing/final-automated-regression.md).

## Ограничения

Android/iOS, системное permission/token flow, APNs/FCM, screen reader, native font scaling и release performance не проверялись. Component UI/E2E suite, TMS/JSON-наборы и coverage threshold оставлены необязательным расширением и не заявляются выполненными. Новых дефектов в финальных прогонах не найдено.
