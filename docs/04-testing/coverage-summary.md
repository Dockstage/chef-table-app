# Сводка тестового покрытия

Актуально на 28.09.2026. Сводка разделяет фактические слои проверки и не приравнивает unit/data-тест к отрисованному UI или нативной доставке push.

| Слой | Что подтверждено | Статус |
|---|---|---|
| Client auto | 58 Vitest-тестов: domain policies, mock/data boundaries, HTTP/DTO contract, idempotency/retry, mutation/refresh, load states, push parser/subscriptions | Покрыто без render UI |
| Component UI auto | Рендер экранов, overlays и пользовательские нажатия | Не автоматизировано; проверяется вручную в минимальном scope |
| Backend auto | 42 pytest-теста: routes, validation, Problem responses, auth, services и OpenAPI contract | Покрыто |
| PostgreSQL gate | Реальные Alembic migrations, repositories, rollback, idempotency и конкурентные create/cancel/review | Покрыто отдельным gate |
| Web manual | Расписание, booking, duplicate/retry, cancel, review, studio-cancellation history, push fallback и viewport 360 px | Финальный smoke и evidence пройдены в MIN-03 |
| Native/manual | Android/iOS, системное push-разрешение, APNs/FCM, screen reader и font scaling | Не проверялось |

## Покрытие TC-001–TC-025

| Группа | Фактическая проверка |
|---|---|
| TC-002, TC-005, TC-011–TC-014, TC-016, TC-019 | Domain/data-логика автоматизирована; экранная часть остаётся ручной |
| TC-003, TC-006, TC-017, TC-020 | State/валидация автоматизированы; визуальные состояния проверяются вручную |
| TC-007–TC-010, TC-015, TC-018 | Data, backend API и/или PostgreSQL; точный слой указан в `test-cases.md` |
| TC-021–TC-022 | Контракт и notification-логика автоматизированы; нативная доставка не подтверждена |
| TC-001, TC-004, TC-023–TC-025 | Ручной web/UI/layout/code-review слой; TC-004 дополнительно имеет backend API-покрытие |

## Финальный регресс

MIN-02 выполнен 28.09.2026 на code revision `3b4e84c`: client lint/format/typecheck, 58/58 tests и web export; backend Ruff, 42/42 pytest, OpenAPI contract и PostgreSQL gates прошли. Подробности и команды: [`final-automated-regression.md`](final-automated-regression.md). Повторять прогон без изменений, влияющих на результат, не нужно.

Итог и ограничения сведены в [`final-test-report.md`](final-test-report.md).
