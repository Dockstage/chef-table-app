# Модель данных

Модель описывает целевую PostgreSQL-схему референсного FastAPI-backend и её проекцию в клиентский API. В БД используются `snake_case`, в JSON — `camelCase`. Время хранится как `timestamptz`, наружу передаётся ISO 8601 с offset; бизнес-дедлайны вычисляются в `Europe/Moscow`.

## ER-модель

```mermaid
erDiagram
    CLIENT ||--o{ BOOKING : creates
    CLIENT ||--o{ PUSH_TOKEN : registers
    CLIENT ||--o{ IDEMPOTENCY_RECORD : owns
    PROGRAM ||--o{ COOKING_CLASS : schedules
    CHEF ||--o{ COOKING_CLASS : leads
    COOKING_CLASS ||--o{ BOOKING : contains
    BOOKING ||--o| REVIEW : receives

    CLIENT {
      uuid id PK
      string name
      string phone UK
      timestamptz created_at
    }
    CHEF {
      uuid id PK
      string name
      string role
      decimal rating
      string initials
    }
    PROGRAM {
      uuid id PK
      string title
      string description
      string level
      jsonb dishes
      int duration_minutes
    }
    COOKING_CLASS {
      uuid id PK
      uuid program_id FK
      uuid chef_id FK
      timestamptz starts_at
      string status
      int capacity
      int available_seats
      int rental_kits_capacity
      int available_rental_kits
      int price_kopecks
      int rental_price_kopecks
      string address
      string eyebrow
      string accent
      string soft_accent
      string cancellation_reason nullable
    }
    BOOKING {
      uuid id PK
      uuid client_id FK
      uuid class_id FK
      string status
      string equipment_option
      string allergy_notes
      int total_price_kopecks
      string studio_cancellation_reason nullable
      timestamptz created_at
      timestamptz updated_at
    }
    REVIEW {
      uuid id PK
      uuid booking_id FK,UK
      int rating
      string comment nullable
      timestamptz created_at
    }
    PUSH_TOKEN {
      uuid id PK
      uuid client_id FK
      string token UK
      string platform
      boolean active
      timestamptz updated_at
    }
    IDEMPOTENCY_RECORD {
      uuid id PK
      uuid client_id FK
      uuid key
      string request_hash
      int response_status
      jsonb response_body
      timestamptz created_at
    }
```

## Владение и доступ клиента

| Сущность | Кто изменяет | Клиентский API | Назначение |
|---|---|---|---|
| Client | auth/infrastructure | Только текущий seeded client | Идентификация владельца данных |
| Chef | внешняя система студии / seed | Read-only внутри `CookingClass` | Ведущий класса |
| Program | внешняя система студии / seed | Read-only, поля встроены в `CookingClass` | Меню, уровень и длительность |
| CookingClass | внешняя система студии; backend меняет счётчики транзакционно | Read-only | Конкретный слот и остатки |
| Booking | клиентские команды и внешняя отмена/посещение | Read + create + допустимая отмена | Запись одного клиента на одно место |
| Review | клиент после посещения | Create once, read в `Booking` | Оценка конкретного посещения |
| PushToken | клиентское устройство | Register/update | Адрес доставки `class_cancelled` |
| IdempotencyRecord | backend | Не выдаётся | Безопасный повтор `createBooking` |

## Поля, enum и nullability

| Сущность | Поле | Тип/значения | Nullable | Ограничение |
|---|---|---|---:|---|
| Program | `level` | `beginner`, `advanced` | Нет | CHECK/enum |
| CookingClass | `status` | `scheduled`, `completed`, `cancelled` | Нет | Новая бронь только для `scheduled` |
| CookingClass | `cancellationReason` | string ≤ 500 | Да | Обязательно при `cancelled`, иначе `null` |
| CookingClass | `availableSeats` | int | Нет | `0..capacity` |
| CookingClass | `availableRentalKits` | int | Нет | `0..rentalKitsCapacity` |
| CookingClass | цены | int, копейки | Нет | `>= 0`, валюта RUB |
| Booking | `status` | `confirmed`, `attended`, `cancelled_by_client`, `cancelled_by_studio` | Нет | Переходы ограничены доменной политикой |
| Booking | `equipmentOption` | `own`, `rental` | Нет | Rental требует положительного остатка |
| Booking | `allergyNotes` | string ≤ 300 | Нет | Пустая строка означает «не указаны»; не логировать |
| Booking | `studioCancellationReason` | string ≤ 500 | Да | Обязательно только для `cancelled_by_studio` |
| Review | `rating` | integer 1–5 | Нет | CHECK |
| Review | `comment` | string ≤ 500 | Да | Пустой ввод нормализуется в `null` |
| PushToken | `platform` | `android`, `ios` | Нет | Web-токенов нет |
| IdempotencyRecord | `requestHash` | SHA-256 canonical validated payload | Нет | UTF-8 JSON с фиксированным порядком `classId`, `equipmentOption`, `allergyNotes` |

## Инварианты и уровень обеспечения

| Инвариант | Обеспечение |
|---|---|
| Не более одной активной брони клиента на класс | Partial unique index `(client_id, class_id) WHERE status = 'confirmed'` |
| Остатки не уходят ниже нуля | Row lock класса + CHECK constraints в одной транзакции |
| Прокат уменьшается только для `rental` | Booking service внутри той же транзакции |
| Итог = цена класса + тариф проката при `rental` | Сервер рассчитывает и сохраняет snapshot `total_price_kopecks` |
| Клиентская отмена возвращает ресурсы один раз | Переход только из `confirmed` под row lock |
| Отмена студией сохраняет причину | Транзакция меняет класс и все `confirmed`-брони с reason snapshot |
| Один отзыв на посещённую бронь | UNIQUE `review.booking_id` + проверка `booking.status = attended` |
| Идемпотентный повтор не создаёт новую бронь | UNIQUE `(client_id, key)` + сравнение `request_hash` и replay сохранённого ответа |
| Push-токен принадлежит текущему клиенту | Client ID берётся из Bearer identity, не из request body |

## Проекция API

- `CookingClass` объединяет поля `Program` и `Chef`, чтобы клиенту не требовались дополнительные запросы.
- `Booking` содержит `classId` и денормализованные `rating`/`reviewComment`; отсутствующий отзыв передаётся явными `null`.
- Причины отмены передаются явным `null` либо строкой согласно статусу; missing и null не смешиваются.
- `IdempotencyRecord`, внутренние FK и технические timestamps не раскрываются.
- По D-009 `IdempotencyRecord` не протухает в учебном MVP и удаляется только со сбросом БД; production retention остаётся OQ-009.
- Источником контрактных имён, required/nullability и ошибок остаётся `openapi.yaml`.

## Seed и миграции

Alembic создаёт новую схему без legacy-миграции. Seed добавляет demo-клиента, программы, шефов, классы и демонстрационные брони; повторный seed должен быть идемпотентным.
