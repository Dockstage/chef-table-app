# Финальный автоматический регресс

Дата: 28.09.2026. Code revision: `3b4e84c`; незакоммиченные изменения затрагивали только документацию. Среда: Windows, Node.js 24.15.0, npm 11.12.1, Python 3.12.10, Docker 29.4.0.

## Client

| Проверка | Результат |
|---|---|
| `npm ci --include=dev --cache .npm-cache` | Успешно: 763 packages; 10 известных moderate в транзитивных Expo-инструментах |
| `npx expo install --check` | Dependencies are up to date |
| `npm run lint` | Успешно, warnings отсутствуют |
| `npm run format:check` | Все файлы соответствуют Prettier |
| `npm run typecheck` | Успешно |
| `npm test` | 10 файлов, 58/58 тестов |
| `EXPO_PUBLIC_API_MODE=mock npm run export:web` | Успешно, bundle создан в `client/dist/` |

Первый запуск clean install упёрся в Windows `EPERM` глобального npm cache, а sandbox-запуск — в запрет сети. Повтор с repository-local cache и разрешённым доступом завершился успешно; это ограничение среды, а не дефект проекта.

## Backend и PostgreSQL

| Проверка | Результат |
|---|---|
| `python -m ruff format --check .` | 61 файл уже отформатирован |
| `python -m ruff check .` | All checks passed |
| `python -m pytest` | 42/42 теста |
| `python -m app.contract_check ...` | 15 schemas, 0 operation gaps |
| `docker compose build backend` | Образ успешно собран |
| `docker compose run --rm backend python -m app.postgres_check` | Migrations, create/replay/cancel/review concurrency и push upsert прошли |

Контейнеры проекта остановлены через `docker compose stop`. Новых дефектов не найдено; код, зависимости и lock-файлы не изменялись.

## Итог

MIN-02 пройден полностью. Следующий gate — MIN-03: ручной full-stack web-smoke, viewport 360 px и свежие evidence.
