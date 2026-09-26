# SCR-003 · Профиль

**Тип:** top-level screen · **Приоритет:** High · **История:** US-06 · **Дизайн:** [SCR-003](../03-design-brief/SCR-003-profile.md).

## Вход и данные

Вход через bottom tab. Имя/телефон seeded demo-клиента поступают из локальной auth-конфигурации, а не отдельного profile endpoint. Статистика считается из последнего успешного `listBookings`: `attended` и `confirmed`.

## Элементы

| ID | Элемент | Источник | Поведение |
|---|---|---|---|
| FB-003-01 | Demo identity | auth config | Read-only; токен не отображать |
| FB-003-02 | «Класс пройден» | bookings | Count `attended` |
| FB-003-03 | «В планах» | bookings | Count `confirmed` |
| FB-003-04 | Push setting | permission + registration state | LOGIC-006 |
| FB-003-05 | Placeholder-функции | вне MVP | Скрыть или явно disabled, без navigation |
| FB-003-06 | Версия | app metadata | Read-only |
| FB-003-07 | Bottom navigation | navigation | Активен «Профиль» |

## Push API

После OS permission granted вызвать `registerPushToken({token, platform})`.

| Ответ | Реакция |
|---|---|
| `204` | `enabled` |
| `401` | Auth error, registration не включена |
| `422` | Token/platform rejected; retry после нового token |
| `429` | Сохранить permission, повтор после `Retry-After` |
| `500/503/network` | Registration error + retry; не показывать `enabled` |

## Состояния push

`idle`, `requestingPermission`, `denied`, `registering`, `enabled`, `unsupported`, `error`. Повторный tap disabled для requesting/registering. Отказ разрешения не влияет на SCR-001/SCR-002.

## Критерии приёмки

- **AC-SCR003-01:** permission prompt появляется только после tap.
- **AC-SCR003-02:** web показывает unsupported и не вызывает OS/API.
- **AC-SCR003-03:** granted + API error не отображается как enabled.
- **AC-SCR003-04:** placeholder-строки нельзя принять за работающие функции.

