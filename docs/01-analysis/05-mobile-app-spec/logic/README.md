# Индекс переиспользуемых логик

| ID | Название | Точки применения | Документ |
|---|---|---|---|
| LOGIC-001 | Период, даты и фильтрация расписания | SCR-001 | [LOGIC-001-schedule-filtering.md](LOGIC-001-schedule-filtering.md) |
| LOGIC-002 | Цена и прокат | CMP-001, BS-001, CMP-002 | [LOGIC-002-price-and-rental.md](LOGIC-002-price-and-rental.md) |
| LOGIC-003 | Создание и безопасный retry брони | BS-001 | [LOGIC-003-booking-submit.md](LOGIC-003-booking-submit.md) |
| LOGIC-004 | Дедлайн и отмена брони | CMP-002, DLG-001 | [LOGIC-004-cancellation.md](LOGIC-004-cancellation.md) |
| LOGIC-005 | Группировка броней и отзыв | SCR-002, MDL-001 | [LOGIC-005-booking-status.md](LOGIC-005-booking-status.md) |
| LOGIC-006 | Push permission и `class_cancelled` | SCR-003, SCR-002 | [LOGIC-006-push-cancellation.md](LOGIC-006-push-cancellation.md) |
| LOGIC-007 | Состояния, refresh и ошибки API | Все сетевые экраны | [LOGIC-007-screen-states.md](LOGIC-007-screen-states.md) |

Каждая логика имеет собственные входы, алгоритм, ошибки и критерии приёмки. Изменение правила требует impact analysis всех перечисленных точек применения.

