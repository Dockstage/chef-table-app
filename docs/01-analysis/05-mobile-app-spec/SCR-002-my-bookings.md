# SCR-002 · Мои записи

**Тип:** top-level screen · **Приоритет:** Critical · **Истории:** US-04–US-06 · **Дизайн:** [SCR-002](../03-design-brief/SCR-002-my-bookings.md).

## Вход и выход

- Вход: bottom tab, `201` из BS-001, push tap/cold start.
- После успешной брони открыть сегмент `upcoming`; после `class_cancelled` — `history`.
- CMP-002 → DLG-001 для отмены или MDL-001 для отзыва.

## Данные и API

При первом входе/refresh вызвать `listBookings`. Для каждого `classId`, отсутствующего в локальном каталоге, вызвать `getClass`; кешировать по ID. Сбой отдельного `getClass` не должен удалять сам Booking: показать ограниченную карточку и retry.

| Ответ | Реакция |
|---|---|
| `200 []` | Empty выбранного сегмента |
| `200 data` | LOGIC-005 группирует статусы |
| `401` | Auth error |
| `404` от `getClass` | Booking остаётся; класс помечен недоступным для деталей |
| `429/500/503/network` | LOGIC-007 |

## Элементы

| ID | Элемент | Источник | Действие/правило |
|---|---|---|---|
| FB-002-01 | Хедер «Мои классы» | static | — |
| FB-002-02 | `upcoming/history` | local state | LOGIC-005 |
| CMP-002 | Карточка брони | `Booking` + `CookingClass` | Статус, цена, дата, класс, шеф |
| FB-002-03 | Empty/Error/Retry | read state | LOGIC-007 |
| FB-002-04 | Bottom navigation | navigation | Активен «Мои записи» |

### CMP-002

| Условие | Дополнительные поля/действия |
|---|---|
| `confirmed` | countdown, cancel action по LOGIC-004 |
| `attended`, `rating == null` | CTA «Оценить шефа» → MDL-001 |
| `attended`, rating | сохранённая оценка и nullable comment |
| `cancelled_by_client` | текстовый статус, без действий |
| `cancelled_by_studio` | причина обязательна, без действий |

Цена берётся только из `Booking.totalPriceKopecks`. Аллергии в карточке не показываются.

## Состояния

Loading/Content/Empty/Error/Refreshing/Stale — по LOGIC-007. Mutation busy хранится на уровне конкретного booking/action и не блокирует unrelated cards. При success mutation применить returned Booking до общего refresh.

## Критерии приёмки

- **AC-SCR002-01:** каждый Booking отображается ровно в одном сегменте.
- **AC-SCR002-02:** refresh failure не удаляет ранее подтверждённые карточки.
- **AC-SCR002-03:** push open приводит к History и видимой причине после серверного refresh.
- **AC-SCR002-04:** отсутствующий класс не приводит к молчаливому исчезновению брони.

