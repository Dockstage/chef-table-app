# Итоговый отчёт по тестированию

Дата: 28.09.2026. Проверенный code revision: `3b4e84c`; результаты MIN-01–MIN-04 сохранены в commit `43cc651`.

## Итог

Согласованный минимальный тестовый scope пройден. Новых дефектов в финальном автоматическом и ручном регрессе не найдено. Учебный MVP готов к оформлению итогового отчёта и дневника практики.

## Выполненные проверки

| Область | Результат |
|---|---|
| Test design | 25 кейсов классифицированы по фактическим слоям без подмены UI/native unit-тестами |
| Client | clean install, Expo compatibility, lint, format, typecheck, 10 файлов и 58/58 Vitest, web export — успешно |
| Backend | Ruff, 42/42 pytest, 15 OpenAPI schemas и 0 operation gaps — успешно |
| PostgreSQL | реальные migrations, repositories, idempotency и конкурентные create/cancel/review, push upsert — успешно |
| Manual web | schedule, booking, duplicate/retry, cancel, history, review, push fallback и viewport 360 px — успешно |

Детали: [`final-automated-regression.md`](final-automated-regression.md), [`final-manual-smoke.md`](final-manual-smoke.md), [`../manual-test-report.md`](../manual-test-report.md) и [`../evidence/README.md`](../evidence/README.md).

## Исправленные дефекты

1. BUG-001: повторная активная бронь — `dcf5ff8`.
2. BUG-002: отменённый студией класс возвращал неверную ошибку — `f070a38`.
3. BUG-003: отмена студией отображалась в предстоящих — `ef12f07`.

Все три карточки содержат симптом, требование, исправление и регрессионную проверку. BUG-003 не имеет отдельного исторического failing-before artifact; этот факт не восстанавливался задним числом.

## Ограничения и остаточные риски

- Android/iOS, permission/device token и реальная доставка APNs/FCM не проверялись.
- Screen reader, native font scaling и release performance не измерялись.
- Нет component UI/E2E suite, JSON/TMS-наборов и coverage threshold; это необязательный расширенный backlog.
- `npm audit` сообщает 10 moderate в транзитивных Expo-инструментах; автоматический breaking `audit fix` не применялся.

## Решение

Статус: **PASS для учебного MVP и согласованного минимального scope**. Статус не означает production/native certification. Перед сдачей остаётся проверить доступность GitHub и заполнить форму по [`SUBMISSION_CHECKLIST.md`](../../SUBMISSION_CHECKLIST.md).
