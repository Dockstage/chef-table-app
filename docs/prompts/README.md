# Реестр промптов

Реестр хранит запросы, которые повлияли на требования, дизайн, код, тесты, исправления и документацию. Нумерация отражает порядок появления работ, а TASK/BUG-карточка указывает использованный файл.

## Правила происхождения текста

- **Запрос пользователя** — дословная цитата сообщения; она не исправляется задним числом.
- **Рабочий промпт** — точная постановка, по которой выполнялась конкретная работа.
- **Паттерн из лекции** — отдельно помеченная выдержка, не выдаваемая за слова пользователя.
- `000-user-request-log.md` хранит исходные пользовательские сообщения раннего этапа; `001`–`012` сохраняют рабочие промпты этого этапа без ретроспективного сочинения отдельных цитат.
- Начиная с `013`, в каждом новом файле отдельно приведены доступная дословная реплика пользователя и рабочий промпт.

## Хронологический индекс

| ID | Файл | Тип | Связанные карточки |
|---:|---|---|---|
| 000 | [`000-user-request-log.md`](000-user-request-log.md) | Дословные исходные сообщения и критерии готовности | Контекст TASK-001–TASK-013 |
| 001 | [`001-requirements.md`](001-requirements.md) | Рабочий промпт требований | TASK-001 |
| 002 | [`002-architecture.md`](002-architecture.md) | Рабочий промпт архитектуры | TASK-002 |
| 003 | [`003-implementation.md`](003-implementation.md) | Рабочий промпт первого client baseline | TASK-003–TASK-006 |
| 004 | [`004-testing.md`](004-testing.md) | Рабочий промпт тест-дизайна | TASK-007 |
| 005 | [`005-rental-inventory.md`](005-rental-inventory.md) | Рабочий промпт проката | TASK-009 |
| 006 | [`006-extended-schedule.md`](006-extended-schedule.md) | Рабочий промпт периода 7/14/30 | TASK-008 |
| 007 | [`007-cancelled-booking-history.md`](007-cancelled-booking-history.md) | Рабочий промпт исправления истории | BUG-003 |
| 008 | [`008-review-comment.md`](008-review-comment.md) | Рабочий промпт комментария к отзыву | TASK-006 |
| 009 | [`009-http-adapter.md`](009-http-adapter.md) | Рабочий промпт HTTP adapter | TASK-010 |
| 010 | [`010-push-cancellations.md`](010-push-cancellations.md) | Рабочий промпт push | TASK-011 |
| 011 | [`011-accessibility-and-ux.md`](011-accessibility-and-ux.md) | Четыре рабочих UX/accessibility-промпта | TASK-003–TASK-006 |
| 012 | [`012-compliance-remediation.md`](012-compliance-remediation.md) | Рабочий промпт устранения расхождений | TASK-012 |
| 013 | [`013-final-contract-audit.md`](013-final-contract-audit.md) | Запрос пользователя + рабочий промпт | TASK-013 |
| 014 | [`014-scope-expansion.md`](014-scope-expansion.md) | Решения пользователя + рабочий промпт | TASK-014 |
| 015 | [`015-elicitation-and-domain.md`](015-elicitation-and-domain.md) | Запрос пользователя + рабочий промпт | TASK-015 |
| 016 | [`016-formalize-requirements.md`](016-formalize-requirements.md) | Запрос пользователя + рабочий промпт | TASK-016 |
| 017 | [`017-user-stories-and-use-cases.md`](017-user-stories-and-use-cases.md) | Запрос пользователя + рабочий промпт | TASK-017 |
| 018 | [`018-screen-registry-and-design-briefs.md`](018-screen-registry-and-design-briefs.md) | Запрос, лекционный паттерн и рабочий промпт | TASK-018 |
| 019 | [`019-technical-design-and-openapi.md`](019-technical-design-and-openapi.md) | Запрос, лекционные паттерны и рабочий промпт | TASK-019 |
| 020 | [`020-mobile-app-spec.md`](020-mobile-app-spec.md) | Запрос, лекционный паттерн и рабочий промпт | TASK-020 |
| 021 | [`021-traceability-matrix.md`](021-traceability-matrix.md) | Запрос пользователя + рабочий промпт | TASK-021 |
| 022 | [`022-requirements-qa-review.md`](022-requirements-qa-review.md) | Запрос пользователя + рабочий промпт | TASK-022 |
| 023 | [`023-lecture-alignment.md`](023-lecture-alignment.md) | Запрос пользователя + рабочий промпт | TASK-023 |
| 024 | [`024-prompt-registry-audit.md`](024-prompt-registry-audit.md) | Запрос пользователя + рабочий промпт | TASK-024 |
| 025 | [`025-analysis-reaudit-remediation.md`](025-analysis-reaudit-remediation.md) | Запрос пользователя + рабочий промпт | TASK-025 |
| 026 | [`026-development-implementation-plans.md`](026-development-implementation-plans.md) | Запрос пользователя, лекционные паттерны и рабочий промпт | TASK-026 |
| 027 | [`027-move-client-to-monorepo.md`](027-move-client-to-monorepo.md) | Запрос пользователя + рабочий промпт | TASK-027 |
| 028 | [`028-backend-scaffold.md`](028-backend-scaffold.md) | Запрос пользователя + рабочий промпт | TASK-028 |
| 029 | [`029-database-docker-seed.md`](029-database-docker-seed.md) | Запрос пользователя + рабочий промпт | TASK-029 |
| 030 | [`030-http-infrastructure-dev-auth.md`](030-http-infrastructure-dev-auth.md) | Запрос пользователя + рабочий промпт | TASK-030 |
| 031 | [`031-backend-contract-gate.md`](031-backend-contract-gate.md) | Запрос пользователя + рабочий промпт | TASK-031 |
| 032 | [`032-catalog-endpoints.md`](032-catalog-endpoints.md) | Запрос пользователя + рабочий промпт | TASK-032 |
| 033 | [`033-booking-endpoints.md`](033-booking-endpoints.md) | Запрос пользователя + рабочий промпт | TASK-033 |
| 034 | [`034-cancel-booking.md`](034-cancel-booking.md) | Запрос пользователя + рабочий промпт | TASK-034 |
| 035 | [`035-review-and-push.md`](035-review-and-push.md) | Запрос пользователя + рабочий промпт | TASK-035 |
| 036 | [`036-final-backend-gate.md`](036-final-backend-gate.md) | Запрос пользователя + рабочий промпт | TASK-036 |
| 037 | [`037-idempotent-booking-retry.md`](037-idempotent-booking-retry.md) | Запрос пользователя + рабочий промпт | TASK-037 |
| 038 | [`038-booking-conflict-refresh.md`](038-booking-conflict-refresh.md) | Запрос пользователя + рабочий промпт | TASK-038 |
| 039 | [`039-cancellation-review-refresh.md`](039-cancellation-review-refresh.md) | Запрос пользователя + рабочий промпт | TASK-039 |
| 040 | [`040-client-load-states.md`](040-client-load-states.md) | Запрос пользователя + рабочий промпт | TASK-040 |
| 041 | [`041-strict-push-contract.md`](041-strict-push-contract.md) | Запрос пользователя + рабочий промпт | TASK-041 |
| 042 | [`042-client-api-boundary.md`](042-client-api-boundary.md) | Запрос пользователя + рабочий промпт | TASK-042 |
| 043 | [`043-client-moscow-time.md`](043-client-moscow-time.md) | Запрос пользователя + рабочий промпт | TASK-043 |
| 044 | [`044-client-ui-foundation.md`](044-client-ui-foundation.md) | Запрос пользователя + рабочий промпт | TASK-044 |
| 045 | [`045-extract-schedule-screen.md`](045-extract-schedule-screen.md) | Запрос пользователя + рабочий промпт | TASK-045 |
| 046 | [`046-extract-bookings-screen.md`](046-extract-bookings-screen.md) | Запрос пользователя + рабочий промпт | TASK-046 |
| 047 | [`047-extract-profile-screen.md`](047-extract-profile-screen.md) | Запрос пользователя + рабочий промпт | TASK-047 |
| 048 | [`048-extract-client-overlays.md`](048-extract-client-overlays.md) | Запрос пользователя + рабочий промпт | TASK-048 |
| 049 | [`049-extract-client-orchestration.md`](049-extract-client-orchestration.md) | Запрос пользователя + рабочий промпт | TASK-049 |
| 050 | [`050-client-lint-format.md`](050-client-lint-format.md) | Запрос пользователя + рабочий промпт | TASK-050 |
| 051 | [`051-client-dependency-audit.md`](051-client-dependency-audit.md) | Запрос пользователя + рабочий промпт | TASK-051 |
| 052 | [`052-client-ci.md`](052-client-ci.md) | Запрос пользователя + рабочий промпт | TASK-052 |
| 053 | [`053-reconcile-cl04.md`](053-reconcile-cl04.md) | Запрос пользователя + рабочий промпт | TASK-053 |
| 054 | [`054-client-accessibility-controls.md`](054-client-accessibility-controls.md) | Запрос пользователя + рабочий промпт | TASK-054 |
| 055 | [`055-remove-false-affordances.md`](055-remove-false-affordances.md) | Запрос пользователя + рабочий промпт | TASK-055 |
| 056 | [`056-client-responsive-safe-layout.md`](056-client-responsive-safe-layout.md) | Запрос пользователя + рабочий промпт | TASK-056 |
| 057 | [`057-client-backend-runtime-config.md`](057-client-backend-runtime-config.md) | Запрос пользователя + рабочий промпт | TASK-057 |
| 058 | [`058-client-backend-live-flow.md`](058-client-backend-live-flow.md) | Запрос пользователя + рабочий промпт | TASK-058 |
| 059 | [`059-final-client-gate.md`](059-final-client-gate.md) | Запрос пользователя + рабочий промпт | TASK-059 |
| 060 | [`060-development-status-sync.md`](060-development-status-sync.md) | Запрос пользователя + рабочий промпт | TASK-060 |
| 061 | [`061-final-development-doc-audit.md`](061-final-development-doc-audit.md) | Запрос пользователя + рабочий промпт | TASK-061 |
| 062 | [`062-testing-stage-audit.md`](062-testing-stage-audit.md) | Запрос пользователя + рабочий промпт | TASK-062 |

## Промпты дефектов

- BUG-001 и BUG-002 содержат свои рабочие промпты непосредственно в карточках рядом с симптомом и проверкой.
- BUG-003 ссылается на `007-cancelled-booking-history.md`.
- Встраивание первых двух промптов сохранено намеренно: перенос не даёт дополнительной трассируемости и исказил бы историческую структуру.

## Результат аудита

Проверено 28.09.2026: последовательность `000`–`062` непрерывна; каждый PROMPT `001`–`062` связан минимум с одной TASK/BUG-карточкой; каждая TASK `001`–`062` и каждый BUG имеют промпт; ссылки существуют. При новом запросе номер не переиспользуется, а карточка и индекс обновляются в том же изменении.
