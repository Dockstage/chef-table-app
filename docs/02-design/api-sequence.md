# API-последовательности

## Создание брони

`Idempotency-Key` создаётся один раз на логическую попытку и сохраняется клиентом для сетевого retry. Сервер является единственным источником решения об остатках.

```mermaid
sequenceDiagram
    actor Client
    participant App
    participant API as FastAPI
    participant Auth
    participant Service as BookingService
    participant DB as PostgreSQL

    Client->>App: Подтвердить запись
    App->>API: POST /v1/bookings<br/>Bearer + Idempotency-Key + payload
    API->>Auth: Проверить dev Bearer identity
    alt Токен отсутствует или невалиден
        Auth-->>API: Reject
        API-->>App: 401 UNAUTHORIZED
    else Клиент определён
        Auth-->>API: clientId
        API->>Service: createBooking(clientId, key, payload)
        Service->>DB: Найти (clientId, key)
        alt Ключ найден, hash совпадает
            DB-->>Service: Сохранённые status + body
            Service-->>API: Replay результата
            API-->>App: 201 Booking + Idempotency-Replayed: true
        else Ключ найден, payload отличается
            Service-->>API: Idempotency conflict
            API-->>App: 409 IDEMPOTENCY_CONFLICT
        else Новый ключ
            Service->>DB: BEGIN + lock CookingClass
            alt Класс не найден
                Service->>DB: ROLLBACK
                API-->>App: 404 CLASS_NOT_FOUND
            else Класс cancelled
                Service->>DB: ROLLBACK
                API-->>App: 410 SLOT_CANCELLED
                App-->>Client: Показать отмену и обновить слот
            else Класс не scheduled или активная бронь существует
                Service->>DB: ROLLBACK
                API-->>App: 409 SLOT_NOT_BOOKABLE / DUPLICATE_BOOKING
            else Нет места или проката
                Service->>DB: ROLLBACK
                API-->>App: 409 SLOT_FULL / RENTAL_UNAVAILABLE
                App-->>Client: Сохранить форму, обновить остатки
            else Все инварианты выполнены
                Service->>DB: Создать Booking, уменьшить остатки,<br/>сохранить idempotency response, COMMIT
                DB-->>Service: Booking confirmed
                Service-->>API: Booking
                API-->>App: 201 Booking + Idempotency-Replayed: false
                App->>API: GET /v1/bookings
                API-->>App: Актуальные брони
                App-->>Client: SCR-002 «Мои записи»
            end
        end
    end
```

Unique/CHECK constraints остаются последней линией защиты при гонке. Их нарушение маппится в тот же предметный `409`, а не в необработанный `500`.

## Отмена студией и push

Действие студии приходит из внешней управляющей системы и не является endpoint клиентского API.

```mermaid
sequenceDiagram
    participant Studio as Внешняя система студии
    participant Backend
    participant DB as PostgreSQL
    participant Push as APNs/FCM
    participant App

    Studio->>Backend: Отменить class + reason
    Backend->>DB: BEGIN; class=cancelled;<br/>confirmed bookings=cancelled_by_studio + reason
    DB-->>Backend: COMMIT
    Backend->>Push: class_cancelled {bookingId, reason}
    Push-->>App: Foreground / tap / cold start
    App->>App: Проверить type, bookingId, reason
    alt Payload валиден
        App->>Backend: GET /v1/bookings + Bearer
        Backend-->>App: Booking status + reason
        App-->>App: Открыть SCR-002 / История<br/>и очистить cold-start response
    else Payload malformed
        App->>App: Игнорировать событие, не менять данные
    end
```
