# MDL-001 · Оценка шефа

**Тип:** centered modal · **Приоритет:** Medium · **История:** US-05 · **Use Case:** UC-03 · **Дизайн:** [MDL-001](../03-design-brief/MDL-001-chef-review.md).

## Вход и выход

Открывается из CMP-002 только для `Booking.status == attended` и `rating == null`. Получает `bookingId`, `chef.name`, `class.title`. Close/«Не сейчас» не отправляет запрос. Success закрывает modal и обновляет CMP-002 из returned Booking.

## Элементы и валидация

| Элемент | Правило |
|---|---|
| Контекст | Имя шефа + класс, read-only |
| Rating radio group | Обязательно, integer 1–5, каждая зона ≥44×44 dp |
| Comment | Optional, максимум 500 символов, счётчик |
| Submit | Enabled только при rating 1–5 и not busy |
| «Не сейчас» | Закрывает без mutation |

## API `createReview`

`POST /bookings/{bookingId}/review`, body `{rating, comment?}`, Bearer. Пустой trimmed comment можно не передавать; в ответе ожидается `reviewComment: null`.

| Ответ | Реакция |
|---|---|
| `201 Booking` | Применить Booking, закрыть modal |
| `401` | Auth error, ввод сохранён |
| `404 BOOKING_NOT_FOUND` | Закрыть после refresh/сообщения, не показывать успех |
| `409 REVIEW_NOT_ALLOWED` | Refresh Booking; убрать CTA при существующем отзыве/неподходящем статусе |
| `422` | Inline rating/comment error |
| `429/500/503/network` | Сохранить ввод, retry; CTA разблокировать после ответа |

## Состояния

Initial (`rating=0`), Ready, Submitting, Error. Повторный tap при Submitting невозможен. Закрытие modal после ошибки допускается без изменения серверных данных.

## Критерии приёмки

- **AC-MDL001-01:** rating 0 не отправляется.
- **AC-MDL001-02:** comment >500 не попадает в запрос.
- **AC-MDL001-03:** timeout сохраняет выбранные rating/comment.
- **AC-MDL001-04:** после `201` повторный CTA исчезает, серверные значения видны в истории.

