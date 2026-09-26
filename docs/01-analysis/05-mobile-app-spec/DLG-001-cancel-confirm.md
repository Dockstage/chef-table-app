# DLG-001 · Подтверждение отмены

**Тип:** system dialog · **Приоритет:** High · **История:** US-04 · **Use Case:** UC-02 · **Дизайн:** [DLG-001](../03-design-brief/DLG-001-cancel-confirm.md).

## Вход

Открывается из CMP-002 для `confirmed`, если клиентский preview LOGIC-004 разрешает отмену. Native использует `Alert`; web-preview — browser confirm с тем же смыслом.

## Элементы

- Заголовок «Отменить запись?».
- Текст «Место станет доступно другим гостям.».
- «Оставить» — безопасное закрытие без API.
- «Отменить запись» — destructive action, запускает `cancelBooking` один раз.

## API `cancelBooking`

`POST /bookings/{bookingId}/cancel`, Bearer, без body.

| Ответ | Реакция |
|---|---|
| `200 Booking` | Применить `cancelled_by_client`, перенести в History, затем refresh |
| `401` | Auth error, статус не менять |
| `404 BOOKING_NOT_FOUND` | Refresh; не удалять карточку оптимистически |
| `409 CANCELLATION_CLOSED` | Оставить confirmed, показать «Отмена закрыта» |
| `409 BOOKING_NOT_ACTIVE` | Refresh и показать актуальный status/reason |
| `422` | Contract/ID error, безопасный fallback |
| `429/500/503/network` | Статус не менять, retry доступен |

## Состояния

Dialog сам не хранит Loading. После destructive tap он закрывается, а busy/error отображаются на CMP-002. Повторное cancel-действие блокируется до ответа. Success mutation не откатывается при refresh failure.

## Критерии приёмки

- **AC-DLG001-01:** «Оставить» не вызывает API.
- **AC-DLG001-02:** ровно за 12 часов destructive action доступно.
- **AC-DLG001-03:** timeout не меняет статус локально.
- **AC-DLG001-04:** `BOOKING_NOT_ACTIVE` не возвращает место на клиенте арифметически.

