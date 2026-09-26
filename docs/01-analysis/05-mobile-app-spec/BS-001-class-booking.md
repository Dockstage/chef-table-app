# BS-001 · Детали класса и запись

**Тип:** bottom sheet · **Приоритет:** Critical · **Истории:** US-02, US-03 · **Use Case:** UC-01 · **Дизайн:** [BS-001](../03-design-brief/BS-001-class-booking.md).

## Вход и lifecycle

Открывается из CMP-001 с `classId` и последним `CookingClass`. При необходимости актуализации вызывает `getClass(classId)`. Close/back до mutation закрывает sheet. После `201` sheet закрывается, returned Booking сохраняется, открывается SCR-002/upcoming, затем выполняется независимый refresh.

Локальная форма сбрасывается только при открытии другого classId или однозначном success/cancel. Ошибка запроса не очищает поля.

## Элементы

| ID | Элемент | Источник/валидация | Действие |
|---|---|---|---|
| FB-BS001-01 | Заголовок, description | `CookingClass` | — |
| FB-BS001-02 | Дата/время, длительность, уровень, адрес, шеф, места | `CookingClass` | Форматировать в Europe/Moscow |
| FB-BS001-03 | Меню | `dishes[]`, минимум 1 | Scroll content |
| FB-BS001-04 | Own/rental radio | default `own`; rental по LOGIC-002 | Изменяет preview |
| FB-BS001-05 | Allergy textarea | optional, `0..300` | Inline counter/error; не логировать |
| FB-BS001-06 | Price breakdown | LOGIC-002 | Read-only |
| FB-BS001-07 | Create CTA | валидная форма + bookable + not busy | LOGIC-003 |
| FB-BS001-08 | Cancel rule | static + `startsAt` context | Read-only |

## Валидация

- `classId` — валидный UUID из выбранного класса.
- `equipmentOption` — ровно `own` или `rental`; rental disabled при нуле.
- `allergyNotes` — строка, максимум 300 Unicode code points по D-010; empty допустим.
- `status == scheduled`, `availableSeats > 0`, валидные неотрицательные цены — предварительные UI-условия; backend проверяет повторно.
- CTA disabled при любой локальной ошибке и в `submitting`.

## API

### `getClass`

Используется для явного refresh/конфликта. `200` заменяет class snapshot; `404` закрывает возможность записи; остальные ошибки — LOGIC-007.

### `createBooking`

Headers: Bearer + стабильный `Idempotency-Key`. Body: `{classId, equipmentOption, allergyNotes}`. Полная retry/error-логика — LOGIC-003.

| Ответ | UI |
|---|---|
| `201` | Сохранить Booking, открыть SCR-002 |
| `409 SLOT_FULL` | Обновить класс, сохранить форму, CTA disabled при 0 |
| `409 RENTAL_UNAVAILABLE` | Сохранить allergies, предложить own |
| `409 DUPLICATE_BOOKING` | Путь к существующей записи |
| `409 SLOT_NOT_BOOKABLE` | Обновить/заблокировать CTA |
| `409 IDEMPOTENCY_CONFLICT` | Contract error, без скрытой новой попытки |
| `410 SLOT_CANCELLED` | Показать reason/status, запись закрыта |
| `422` | Inline `fieldErrors` |
| `429/5xx/network` | LOGIC-003/007, форма сохранена |

## Состояния

Content, Refreshing, Submitting, Conflict, Cancelled, Error/Stale. Первичный Loading нужен только если sheet открыт по classId без snapshot. Keyboard-safe scroll обязателен.

## Критерии приёмки

- **AC-BS001-01:** 301-й символ блокирует отправку и не попадает в запрос.
- **AC-BS001-02:** rental при нулевом остатке недоступен с объяснением.
- **AC-BS001-03:** повтор после timeout использует прежний ключ и payload.
- **AC-BS001-04:** `201` остаётся успехом при последующем refresh failure.
- **AC-BS001-05:** allergyNotes отсутствуют в toast/error/log.
- **AC-BS001-06:** от появления Content до отправки валидной формы требуется не более пяти действий по правилу NFR-012.
