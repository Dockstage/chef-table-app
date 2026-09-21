# Модель данных

```mermaid
erDiagram
    USER ||--o{ BOOKING : creates
    COOKING_CLASS ||--o{ BOOKING : contains
    CHEF ||--o{ COOKING_CLASS : leads
    PROGRAM ||--o{ COOKING_CLASS : schedules
    BOOKING ||--o| REVIEW : receives
    USER ||--o{ PUSH_TOKEN : registers

    USER {
      uuid id PK
      string name
      string phone
    }
    CHEF {
      uuid id PK
      string name
      string role
      number rating
      string initials
    }
    PROGRAM {
      uuid id PK
      string title
      string description
      string level
      string[] dishes
      int durationMinutes
    }
    COOKING_CLASS {
      uuid id PK
      uuid programId FK
      uuid chefId FK
      datetime startsAt
      string status
      int capacity
      int availableSeats
      int priceKopecks
      int rentalPriceKopecks
      int availableRentalKits
      string address
      string eyebrow
      string accent
      string softAccent
      string cancellationReason
    }
    BOOKING {
      uuid id PK
      uuid userId FK
      uuid classId FK
      string status
      string equipmentOption
      string allergyNotes
      int totalPriceKopecks
      datetime createdAt
      string studioCancellationReason
    }
    REVIEW {
      uuid id PK
      uuid bookingId FK
      int rating
      string comment
      datetime createdAt
    }
    PUSH_TOKEN {
      uuid userId FK
      string token
      string platform
    }
```

## Инварианты

- `availableSeats` находится в диапазоне от 0 до `capacity`.
- `availableRentalKits` находится в диапазоне от 0 до `capacity` и уменьшается только после подтверждения проката.
- Активная бронь уникальна по `(userId, classId)`.
- `totalPriceKopecks = priceKopecks + rentalPriceKopecks`, если выбран прокат.
- `allergyNotes` содержит не более 300 символов.
- `review.rating` — целое число от 1 до 5.
- Отзыв уникален по `bookingId`.
- Отменённый класс не может принимать новые брони.
- Push-токен привязывается к текущему авторизованному клиенту и платформе `android` или `ios`.

Модель описывает контракт, а не внутреннюю схему существующего backend. В ответе `Booking` API проекция отзыва денормализована в поля `rating` и `reviewComment`, а причина отмены студией передаётся как `studioCancellationReason`; сущность `REVIEW` на диаграмме сохраняет логическую связь один-к-одному.

