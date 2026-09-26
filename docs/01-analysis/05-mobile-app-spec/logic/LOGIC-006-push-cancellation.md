# LOGIC-006 · Push permission и `class_cancelled`

**Приоритет:** High · **Точки:** SCR-003, SCR-002 · **Требования:** FR-013, FR-014, NFR-009.

## Подключение

1. Не запрашивать системное разрешение при запуске или входе на SCR-003.
2. После явного tap на строку уведомлений проверить платформу.
3. Web → `unsupported`, системный prompt не открывается.
4. Android/iOS → запросить permission; при denied показать объяснение без блокировки приложения.
5. При granted получить нативный APNs/FCM device token и вызвать `registerPushToken`.
6. Только после `204` показать `enabled`; ошибка регистрации возвращает состояние retry, даже если OS permission уже выдан.

## Payload и обработка

Допустим только объект:

```json
{"type":"class_cancelled","bookingId":"<uuid>","reason":"<non-empty>"}
```

Проверять все три поля и UUID до побочного эффекта. Malformed/чужой `type` игнорируется и диагностируется без PII.

- Foreground: вызвать `listBookings`, сохранить текущий tab, показать постоянный статус/причину и ненавязчивое сообщение.
- Tap/cold start: после инициализации обновить брони и открыть SCR-002 → История; затем очистить last response.
- Повтор payload безопасен: он только перечитывает состояние.
- Offline/5xx: прежние брони остаются, показывается retry; reason из push не подменяет серверное состояние.

## Критерии

- Denied/unsupported не блокируют ни один основной сценарий.
- Payload без `bookingId` или `reason` не запускает refresh/navigation.
- Cold-start response обрабатывается один раз.
- Web никогда не сообщает `enabled`.

