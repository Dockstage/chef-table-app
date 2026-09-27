# Матрица трассировки MVP

Матрица связывает бизнес-цели с требованиями, сценариями, интерфейсом, API, текущей реализацией, проверками и историей изменений. Канонические ID можно искать в обе стороны: от `BR/FR/NFR` к `TC` и коду либо от `TC`, operationId и интерфейсного ID обратно к цели.

Статусы: **полностью** — целевое поведение реализовано и проверяется; **частично** — существует реализация или проверка, но не все критерии выполнены; **не покрыто** — есть только спецификация либо отсутствует воспроизводимая проверка.

## Бизнес-цепочки

| Цель | Истории / сценарии | Требования | Интерфейс и логика | Основные проверки | Статус |
|---|---|---|---|---|---|
| BR-001 Самообслуживание записи | US-01–US-03; UC-01 | FR-001–FR-008; NFR-001–NFR-003, NFR-007, NFR-009, NFR-012 | SCR-001; CMP-001; BS-001; LOGIC-001–LOGIC-003, LOGIC-007 | TC-001–TC-010, TC-017–TC-019, TC-023, TC-025; load-state tests | Частично: error/retry реализован, но нет измерения производительности |
| BR-002 Корректные остатки и уникальность | US-03; UC-01 | FR-005–FR-008; NFR-004, NFR-006–NFR-008, NFR-011 | BS-001; LOGIC-002, LOGIC-003 | TC-005–TC-010, TC-017, TC-018; PostgreSQL gate; client retry tests | Полностью: backend конкурентно безопасен, клиент повторяет неопределённую попытку с тем же ключом |
| BR-003 Управление записью и история | US-04, US-06; UC-02, UC-04 | FR-009–FR-011, FR-014; NFR-005, NFR-007 | SCR-002; CMP-002; DLG-001; LOGIC-004–LOGIC-007 | TC-011–TC-013, TC-016, TC-018, TC-022; mutation flow tests | Частично: mutation/refresh исправлен, native push-сценарий ещё не подтверждён |
| BR-004 Уведомление об отмене | US-06; UC-04 | FR-011, FR-013, FR-014; NFR-005, NFR-009 | SCR-003, SCR-002; CMP-002; LOGIC-006, LOGIC-007 | TC-016, TC-021, TC-022 | Частично: native-сценарии описаны и unit-tested, но не подтверждены на Android/iOS |
| BR-005 Обратная связь | US-05; UC-03 | FR-009, FR-012, FR-015; NFR-005 | SCR-002; CMP-002; MDL-001; LOGIC-005, LOGIC-007 | TC-014, TC-015, TC-020; backend review tests | Полностью |
| BR-006 Граница учебного MVP | US-01–US-06; UC-01–UC-04 | FR-015, FR-016; NFR-011 | SCR-001–SCR-003 и overlays | TC-024; backend auth tests | Полностью для принятой dev-auth границы |

## Функциональное покрытие

| Требование | US / UC | SCR / LOGIC | API | Код | TC | Основной commit | Статус |
|---|---|---|---|---|---|---|---|
| FR-001 Периоды 7/14/30 | US-01 | SCR-001; LOGIC-001 | `listClasses` | `getScheduleQuery`, `DiscoverScreen`, `CatalogService` | TC-001, TC-019; backend catalog tests | `2f4b617`; TASK-032 | Полностью |
| FR-002 Фильтры | US-01 | SCR-001; CMP-001; LOGIC-001 | `listClasses` | `filterClasses`, `DiscoverScreen`, `SqlAlchemyCatalogRepository` | TC-002; backend catalog tests | `69ebdbd`; TASK-032 | Полностью |
| FR-003 Детали класса | US-02 | CMP-001; BS-001 | `listClasses`, `getClass` | `ClassCard`, `ClassModal`, catalog routes/repository | TC-004; backend catalog tests | `69ebdbd`; TASK-032 | Полностью |
| FR-004 Состояния чтения | US-01 | SCR-001; LOGIC-007 | `listClasses` | `LoadState`, `loadStudioSnapshot`, `DiscoverScreen`, `BookingsScreen` | TC-003; load-state/snapshot tests | `69ebdbd`, `60f08a0`; TASK-040 | Полностью |
| FR-005 Данные брони | US-03; UC-01 | BS-001; LOGIC-002, LOGIC-003 | `createBooking` | `ClassModal`, `executeBooking`, `BookingService` | TC-005–TC-007; booking flow tests; backend booking tests | `4d8a1b4`, `c803ceb`; TASK-033, TASK-038 | Полностью |
| FR-006 Цена и прокат | US-02, US-03; UC-01 | BS-001; LOGIC-002, LOGIC-003 | `getClass`, `createBooking` | catalog/booking repositories, client policies | TC-005, TC-017, TC-018; backend tests | `ac64757`; TASK-032, TASK-033 | Полностью |
| FR-007 Атомарность и идемпотентность | US-03; UC-01 | BS-001; LOGIC-003 | `createBooking` | `SqlAlchemyBookingRepository`, `IdempotencyRecord`, `getOrCreateBookingAttempt`, adapters | TC-007, TC-009, TC-018; PostgreSQL concurrency check; client retry tests | `dcf5ff8`, `a3c5ae1`, `b6262b3`; TASK-033, TASK-037 | Полностью |
| FR-008 Различимые ошибки | US-03; UC-01 | BS-001; LOGIC-003 | `createBooking` | полный `ProblemCode`, runtime DTO/Problem parsers, adapters, `executeBooking` | TC-008–TC-010, TC-017; HTTP/booking flow tests | `f070a38`, `ac64757`, `c803ceb`, `b1a3b69`; TASK-038, TASK-042 | Полностью |
| FR-009 Предстоящие и история | US-04, US-05; UC-02, UC-03 | SCR-002; CMP-002; LOGIC-005 | `listBookings` | `filterBookings`, `BookingsScreen`, booking repository | TC-011, TC-016; backend booking tests | `ef12f07`; TASK-033 | Полностью |
| FR-010 Отмена до дедлайна | US-04; UC-02 | SCR-002; DLG-001; LOGIC-004 | `cancelBooking` | client policy, `executeCancellation`, `BookingService`, booking repository | TC-012, TC-013, TC-018; mutation flow and backend cancellation tests | `69ebdbd`, `ac64757`, `c2cabdd`; TASK-034, TASK-039 | Полностью |
| FR-011 Отмена студией | US-04, US-06; UC-02, UC-04 | SCR-002; CMP-002; LOGIC-005, LOGIC-006 | `listBookings` | fixtures, `filterBookings`, push refresh | TC-016, TC-022 | `ef12f07`, `1edf78b` | Частично: внешняя серверная операция вне клиентского API |
| FR-012 Отзыв | US-05; UC-03 | SCR-002; MDL-001; LOGIC-005 | `createReview` | `ReviewModal`, mutation flow, `BookingService`, booking repository | TC-014, TC-015, TC-020; boundary/mutation and backend review tests | `d8dfe4a`, `c2cabdd`; TASK-035, TASK-039 | Полностью |
| FR-013 Регистрация push | US-06; UC-04 | SCR-003; LOGIC-006 | `registerPushToken` | notification adapter, push service/repository | TC-021; backend push tests | `1edf78b`; TASK-035 | Частично: backend готов, native e2e не подтверждён |
| FR-014 Обработка push | US-06; UC-04 | SCR-003, SCR-002; LOGIC-006 | `listBookings` | strict payload parser, interaction-aware subscriptions, addressed booking update | TC-022; push routing/subscription tests | `c8423d3`, `386bd6b`, `d24c81f`; TASK-041 | Частично: контракт и маршрутизация покрыты, native e2e нет |
| FR-015 Dev-идентификация | US-01–US-06; UC-01–UC-04 | Все сетевые сценарии | Все 7 operationId | `HttpStudioApi.getAccessToken`; FastAPI dev-auth | backend auth/Problem tests | `a3c5ae1`; TASK-030 | Частично: backend и `401` покрыты, provider клиента пока опционален |
| FR-016 Только клиентские возможности | — | SCR-001–SCR-003 | — | `App`, `BottomNav` | TC-024 | `69ebdbd` | Полностью |

## Покрытие качественных требований

| Требование | Связи | Реализация / доказательство | TC | Commit | Статус и пробел |
|---|---|---|---|---|---|
| NFR-001 Интерактивность ≤ 2 с | BR-001; US-01; SCR-001 | Целевой профиль описан | — | `a6dd292` | Не покрыто: нет 20 release-замеров |
| NFR-002 Viewport 360×800 | BR-001; US-01, US-02; все SCR | React Native styles; screenshot evidence | TC-023 | `7420444` | Частично: ручная web-проверка, native не проверен |
| NFR-003 Touch и WCAG AA | BR-001; US-01, US-02; все SCR/overlay | Accessibility-атрибуты и UX-правки | — | `afde6b` | Не покрыто: нет замеров областей и контраста |
| NFR-004 Конкурентная целостность | BR-002; US-03; UC-01; LOGIC-003 | Row/advisory locks, partial unique index; изолированный PostgreSQL gate create/cancel/review | TC-007–TC-009, TC-018; backend tests | `dcf5ff8`, `ac64757`; TASK-033, TASK-036 | Частично: критические гонки доказаны, нагрузочный прогон 20 запросов ещё впереди |
| NFR-005 Данные при read failure | BR-003–BR-005; US-04–US-06; LOGIC-007 | Независимые read states, сохранение snapshot, partial class fallback и mutation-before-refresh | load-state, snapshot и mutation flow tests | `0bfe5a2`, `c803ceb`, `c2cabdd`, `60f08a0`; TASK-038–TASK-040 | Полностью |
| NFR-006 Нет аллергий/токенов в логах | BR-002; US-03; UC-01 | Безопасный JSON-log без headers/body | backend log-safety test | `a6dd292`; TASK-030 | Покрыто для backend-инфраструктуры; клиентские технические каналы проверяются отдельно |
| NFR-007 Однозначные деньги и время | BR-001, BR-003; US-02–US-04; LOGIC-001, LOGIC-002, LOGIC-004 | Копейки, ISO 8601, `Europe/Moscow` domain policies и zoned seed | TC-005, TC-012, TC-013, TC-019; client timezone tests | `ed714fc`; TASK-043 | Полностью |
| NFR-008 OpenAPI compatibility в CI | BR-002; US-03; UC-01 | OpenAPI 1.2, backend contract gate и client runtime DTO validation | backend contract + client HTTP tests | `60dae24`, `b1a3b69`; TASK-031, TASK-042 | Частично: runtime-защита готова, CI и автоматическая OpenAPI→TypeScript-сверка отсутствуют |
| NFR-009 Android/iOS, web-preview | BR-001, BR-004; US-01, US-06; SCR-003 | Platform branch и пояснение web-push | TC-021–TC-023 | `1edf78b`, `7420444` | Частично: нет прогона на двух native-платформах |
| NFR-010 Сквозная проверяемость Must | Все Must | Эта матрица и канонические ссылки в `test-cases.md` | TC-001–TC-025 | TASK-021 | Частично: связи созданы, но часть Must пока без теста |
| NFR-011 Граница учебной auth | BR-006; US-01–US-06; UC-01–UC-04 | Bearer dependency, env-secret, `401` Problem | auth, все семь API и log-safety tests | `a3c5ae1`, `0a4ef79`; TASK-030, TASK-032–TASK-035 | Полностью для учебной dev-auth |
| NFR-012 Путь ≤ 5 действий | BR-001; US-03; UC-01; BS-001 | Целевой поток и правило подсчёта описаны | TC-025 | TASK-022 | Частично: есть ручной кейс, требуется фактический прогон после UI-доработки |

## Обратный индекс проверок

Канонические связи `TC → FR/NFR` хранятся в столбце «Требование» файла [`test-cases.md`](../test-cases.md). Тест без канонического ID считается нетрассируемым. Требование без TC в таблицах выше считается непокрытым, даже если соответствующий код существует.

## Документальная линия

- `a6dd292` — BR/FR/NFR; `073d281` — US/UC.
- `595342e` — реестр интерфейса и дизайн-брифы.
- `60dae24` — data model, sequences и OpenAPI.
- `0bfe5a2` — мобильные ТЗ и `LOGIC-*`.
- TASK/BUG-карточки в `docs/tasks/` фиксируют полную историю реализации и ручной проверки.

## Выводы для следующих этапов

1. Аналитические связи полны: все 6 BR и 16 FR имеют нисходящую цепочку; NFR привязаны к сценариям или общим границам.
2. Критические пробелы реализации: FR-015, NFR-008 и NFR-011.
3. Критические пробелы тестирования: NFR-001, NFR-003, NFR-005, NFR-006, NFR-008, NFR-011; частично покрыты NFR-002, NFR-004, NFR-007 и NFR-009.
4. Эти пробелы не маскируются статусом документации и остаются открытыми в `docs/lecture-gap-checklists.md`.
