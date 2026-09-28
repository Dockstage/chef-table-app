# TASK-067 — Финальный ручной smoke

## Цель

Подтвердить ключевой пользовательский поток через реальный локальный backend и сохранить актуальные доказательства финального UI.

## Промпт

[`docs/prompts/067-final-manual-smoke.md`](../prompts/067-final-manual-smoke.md).

## Выполнено

- подняты PostgreSQL, migrations, seed, FastAPI и Expo web в HTTP-режиме;
- пройдены schedule, booking, duplicate, retry/conflict, cancel, review и web push fallback;
- при 360×800 подтверждено `document.scrollWidth=360`;
- созданные брони отменены, остатки восстановлены, итоговое backend-состояние проверено;
- сохранены свежие screenshots, UI JSON и API log;
- native-ограничения названы явно, Metro и контейнеры остановлены.

## Проверка

Результаты и ссылки: [`docs/04-testing/final-manual-smoke.md`](../04-testing/final-manual-smoke.md).

## Commit

`43cc651` — `docs: complete testing stage`.
