# Матрица трассировки MVP

Матрица связывает бизнес-цели с требованиями, сценариями, интерфейсом, API, текущей реализацией, проверками и историей изменений. Канонические ID можно искать в обе стороны: от `BR/FR/NFR` к `TC` и коду либо от `TC`, operationId и интерфейсного ID обратно к цели.

Статусы: **полностью** — целевое поведение реализовано и проверяется; **частично** — существует реализация или проверка, но не все критерии выполнены; **не покрыто** — есть только спецификация либо отсутствует воспроизводимая проверка.

## Бизнес-цепочки

| Цель | Истории / сценарии | Требования | Интерфейс и логика | Основные проверки | Статус |
|---|---|---|---|---|---|
| BR-001 Самообслуживание записи | US-01–US-03; UC-01 | FR-001–FR-008; NFR-001–NFR-003, NFR-007, NFR-009, NFR-012 | SCR-001; CMP-001; BS-001; LOGIC-001–LOGIC-003, LOGIC-007 | TC-001–TC-010, TC-017–TC-019, TC-023, TC-025 | Частично: нет полной обработки error/retry и измерения производительности |
| BR-002 Корректные остатки и уникальность | US-03; UC-01 | FR-005–FR-008; NFR-004, NFR-006–NFR-008, NFR-011 | BS-001; LOGIC-002, LOGIC-003 | TC-005–TC-010, TC-017, TC-018 | Частично: стабильный retry и конкурентный backend ещё не реализованы |
| BR-003 Управление записью и история | US-04, US-06; UC-02, UC-04 | FR-009–FR-011, FR-014; NFR-005, NFR-007 | SCR-002; CMP-002; DLG-001; LOGIC-004–LOGIC-007 | TC-011–TC-013, TC-016, TC-018, TC-022 | Частично: refresh failure отделён не во всех мутациях |
| BR-004 Уведомление об отмене | US-06; UC-04 | FR-011, FR-013, FR-014; NFR-005, NFR-009 | SCR-003, SCR-002; CMP-002; LOGIC-006, LOGIC-007 | TC-016, TC-021, TC-022 | Частично: native-сценарии описаны и unit-tested, но не подтверждены на Android/iOS |
| BR-005 Обратная связь | US-05; UC-03 | FR-009, FR-012, FR-015; NFR-005 | SCR-002; CMP-002; MDL-001; LOGIC-005, LOGIC-007 | TC-014, TC-015, TC-020 | Полностью для mock-клиента; auth/backend остаются целевыми |
| BR-006 Граница учебного MVP | US-01–US-06; UC-01–UC-04 | FR-015, FR-016; NFR-011 | SCR-001–SCR-003 и overlays | TC-024 | Частично: клиентская граница соблюдена, защищённый FastAPI ещё отсутствует |

## Функциональное покрытие

| Требование | US / UC | SCR / LOGIC | API | Код | TC | Основной commit | Статус |
|---|---|---|---|---|---|---|---|
| FR-001 Периоды 7/14/30 | US-01 | SCR-001; LOGIC-001 | `listClasses` | `getScheduleQuery`, `DiscoverScreen`, adapters | TC-001, TC-019 | `2f4b617` | Полностью |
| FR-002 Фильтры | US-01 | SCR-001; CMP-001; LOGIC-001 | `listClasses` | `filterClasses`, `DiscoverScreen` | TC-002 | `69ebdbd` | Полностью |
| FR-003 Детали класса | US-02 | CMP-001; BS-001 | `listClasses`, `getClass` | `ClassCard`, `ClassModal`, adapters | TC-004 | `69ebdbd` | Полностью |
| FR-004 Состояния чтения | US-01 | SCR-001; LOGIC-007 | `listClasses` | `refresh`, `DiscoverScreen` | TC-003 | `69ebdbd` | Частично: нет отдельного постоянного Error state и TC на retry |
| FR-005 Данные брони | US-03; UC-01 | BS-001; LOGIC-002, LOGIC-003 | `createBooking` | `ClassModal`, `handleBook`, adapters | TC-005–TC-007 | `4d8a1b4` | Полностью для текущей формы |
| FR-006 Цена и прокат | US-02, US-03; UC-01 | BS-001; LOGIC-002, LOGIC-003 | `getClass`, `createBooking` | `getBookingTotal`, `MockStudioApi` | TC-005, TC-017, TC-018 | `ac64757` | Полностью для mock; backend впереди |
| FR-007 Атомарность и идемпотентность | US-03; UC-01 | BS-001; LOGIC-003 | `createBooking` | `HttpStudioApi`, `MockStudioApi` | TC-007, TC-009, TC-018 | `dcf5ff8`, `a3c5ae1` | Частично: ключ создаётся заново при каждом вызове; нет replay/concurrency test |
| FR-008 Различимые ошибки | US-03; UC-01 | BS-001; LOGIC-003 | `createBooking` | `ApiErrorCode`, adapters, `handleBook` | TC-008–TC-010, TC-017 | `f070a38`, `ac64757` | Частично: не все OpenAPI-коды типизированы, после конфликта нет refresh |
| FR-009 Предстоящие и история | US-04, US-05; UC-02, UC-03 | SCR-002; CMP-002; LOGIC-005 | `listBookings` | `filterBookings`, `BookingsScreen` | TC-011, TC-016 | `ef12f07` | Полностью |
| FR-010 Отмена до дедлайна | US-04; UC-02 | SCR-002; DLG-001; LOGIC-004 | `cancelBooking` | `canCancelBooking`, `handleCancel`, adapters | TC-012, TC-013, TC-018 | `69ebdbd`, `ac64757` | Полностью для mock; транзакция backend впереди |
| FR-011 Отмена студией | US-04, US-06; UC-02, UC-04 | SCR-002; CMP-002; LOGIC-005, LOGIC-006 | `listBookings` | fixtures, `filterBookings`, push refresh | TC-016, TC-022 | `ef12f07`, `1edf78b` | Частично: внешняя серверная операция вне клиентского API |
| FR-012 Отзыв | US-05; UC-03 | SCR-002; MDL-001; LOGIC-005 | `createReview` | `ReviewModal`, `handleReview`, adapters | TC-014, TC-015, TC-020 | `d8dfe4a` | Полностью для mock; backend впереди |
| FR-013 Регистрация push | US-06; UC-04 | SCR-003; LOGIC-006 | `registerPushToken` | `registerForPushNotifications`, adapters | TC-021 | `1edf78b` | Частично: нет подтверждённого native e2e |
| FR-014 Обработка push | US-06; UC-04 | SCR-003, SCR-002; LOGIC-006 | `listBookings` | `pushPayload`, subscriptions, `refresh` | TC-022 | `c8423d3`, `386bd6b` | Частично: unit есть, native e2e нет |
| FR-015 Dev-идентификация | US-01–US-06; UC-01–UC-04 | Все сетевые сценарии | Все 7 operationId | `HttpStudioApi.getAccessToken` | — | `a3c5ae1` | Не покрыто: provider опционален, нет проверки `401` и backend |
| FR-016 Только клиентские возможности | — | SCR-001–SCR-003 | — | `App`, `BottomNav` | TC-024 | `69ebdbd` | Полностью |

## Покрытие качественных требований

| Требование | Связи | Реализация / доказательство | TC | Commit | Статус и пробел |
|---|---|---|---|---|---|
| NFR-001 Интерактивность ≤ 2 с | BR-001; US-01; SCR-001 | Целевой профиль описан | — | `a6dd292` | Не покрыто: нет 20 release-замеров |
| NFR-002 Viewport 360×800 | BR-001; US-01, US-02; все SCR | React Native styles; screenshot evidence | TC-023 | `7420444` | Частично: ручная web-проверка, native не проверен |
| NFR-003 Touch и WCAG AA | BR-001; US-01, US-02; все SCR/overlay | Accessibility-атрибуты и UX-правки | — | `afde6b` | Не покрыто: нет замеров областей и контраста |
| NFR-004 Конкурентная целостность | BR-002; US-03; UC-01; LOGIC-003 | Проверки mock на место, дубль и прокат | TC-007–TC-009, TC-018 | `dcf5ff8`, `ac64757` | Частично: нет 20 параллельных запросов и replay |
| NFR-005 Данные при read failure | BR-003–BR-005; US-04–US-06; LOGIC-007 | Целевое состояние описано | — | `0bfe5a2` | Не покрыто: нет component/scenario test; refresh смешан с мутацией |
| NFR-006 Нет аллергий/токенов в логах | BR-002; US-03; UC-01 | Логирование PII в коде не добавлено | — | `a6dd292` | Не покрыто: отсутствует тест-перехватчик логов |
| NFR-007 Однозначные деньги и время | BR-001, BR-003; US-02–US-04; LOGIC-001, LOGIC-002, LOGIC-004 | Копейки, ISO 8601, domain policies | TC-005, TC-012, TC-013, TC-019 | `ed714fc` | Частично: timezone backend ещё не проверен |
| NFR-008 OpenAPI compatibility в CI | BR-002; US-03; UC-01 | OpenAPI 1.1 подготовлен | — | `60dae24` | Не покрыто: FastAPI и schema-check в CI отсутствуют |
| NFR-009 Android/iOS, web-preview | BR-001, BR-004; US-01, US-06; SCR-003 | Platform branch и пояснение web-push | TC-021–TC-023 | `1edf78b`, `7420444` | Частично: нет прогона на двух native-платформах |
| NFR-010 Сквозная проверяемость Must | Все Must | Эта матрица и канонические ссылки в `test-cases.md` | TC-001–TC-025 | TASK-021 | Частично: связи созданы, но часть Must пока без теста |
| NFR-011 Граница учебной auth | BR-006; US-01–US-06; UC-01–UC-04 | Bearer header поддержан; `.env` исключён | — | `a3c5ae1`, `0a4ef79` | Не покрыто: нет обязательного токена, `401`-теста и backend |
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
2. Критические пробелы реализации: FR-007, FR-008, FR-015, NFR-005, NFR-008 и NFR-011.
3. Критические пробелы тестирования: NFR-001, NFR-003, NFR-005, NFR-006, NFR-008, NFR-011; частично покрыты NFR-002, NFR-004, NFR-007 и NFR-009.
4. Эти пробелы не маскируются статусом документации и остаются открытыми в `docs/lecture-gap-checklists.md`.
