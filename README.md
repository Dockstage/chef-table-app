# «Шеф-стол» — мобильное приложение кулинарной студии

Учебный MVP клиентского приложения для просмотра расписания и самостоятельной записи на кулинарные классы. Проект проходит полный цикл задания: анализ требований, архитектура и API, восемь пользовательских возможностей, тест-кейсы, найденные баги, исправления и Git-история.

## Что реализовано

- расписание на 7 дней по умолчанию с расширением до 14/30 дней и фильтром по уровню;
- карточка класса с меню, шефом, ценой и остатком мест;
- запись с выбором своего/прокатного набора, контролем прокатного фонда и сведениями об аллергиях;
- раздел предстоящих и прошлых записей;
- отмена записи с дедлайном 12 часов;
- сохранение отмены студией вместе с причиной;
- оценка шефа с необязательным комментарием после посещённого класса;
- регистрация нативного push-токена и обновление истории после отмены студией;
- loading, empty, success и предметные error states;
- доступные подписи и состояния интерактивных элементов.

Без настройки приложение использует асинхронный `MockStudioApi`. Для подключения API скопируйте `client/.env.example` в `client/.env` и задайте `EXPO_PUBLIC_API_BASE_URL`: фабрика автоматически выберет `HttpStudioApi`. У собственного FastAPI backend уже есть PostgreSQL-схема и инфраструктура; клиентские бизнес-endpoint реализуются следующими итерациями.

## Технологии

- Expo SDK 57;
- React Native 0.86 и React 19;
- TypeScript в strict-режиме;
- Vitest;
- Python 3.12, FastAPI, Pydantic и pytest для backend;
- OpenAPI 3.1;
- Mermaid для архитектурных схем.

Один проект запускается на Android, iOS и в браузере. Основные сценарии доступны в web-preview; системные push требуют development/production-сборку Android или iOS и настроенный backend-провайдер.

## Быстрый запуск

Требования: Node.js 22.13 или новее и npm.

```bash
cd client
npm install
npm run web
```

Для запуска с реальным API:

```bash
copy .env.example .env
# замените EXPO_PUBLIC_API_BASE_URL на адрес инфраструктуры студии
npm run web
```

После запуска открыть адрес, который покажет Expo, обычно `http://localhost:8081`.

Запуск на телефоне через Expo Go:

```bash
npm start
```

Затем отсканировать QR-код из терминала. Для нативной сборки и удалённых push потребуется настроенный Expo/EAS аккаунт; web fallback и обработка push-событий проверяются без устройства.

## Backend и база данных

FastAPI и PostgreSQL запускаются из корня репозитория. Миграции и seed выполняются отдельными командами и не входят в production startup.

```powershell
Copy-Item backend/.env.example backend/.env
# замените DEV_BEARER_TOKEN в backend/.env на локальное значение
docker compose up -d db
docker compose run --rm migrate
docker compose run --rm seed
docker compose up -d backend
```

API доступен на `http://127.0.0.1:8000`; `GET /health` проверяет состояние сервиса. Защищённые `/v1`-операции используют локальный `DEV_BEARER_TOKEN`; файл `backend/.env` не коммитится. Для запуска backend без Docker:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python -m pip install -e ".[dev]"
.\.venv\Scripts\python -m uvicorn app.main:app --reload
```

Проверки и остальные команды описаны в [`backend/README.md`](backend/README.md).

## Проверки

```bash
cd client
npm run typecheck
npm test
npm run export:web
```

Ожидаемый результат:

- TypeScript — без ошибок;
- 24 автоматических теста — успешно;
- web bundle — создаётся в `client/dist/`.

## Демонстрационные сценарии

1. На главном экране выбрать день и уровень класса.
2. Открыть карточку, выбрать прокатный набор и указать аллергию.
3. Подтвердить запись — приложение откроет «Мои записи».
4. В предстоящих классах проверить отмену студией и её причину.
5. В истории открыть завершённую «Домашнюю пасту» и поставить шефу оценку.

Даты тестовых классов вычисляются относительно текущего дня, поэтому демо не протухает.

## Документация

| Раздел | Содержимое |
|---|---|
| [`docs/01-analysis`](docs/01-analysis) | вопросы, допущения, MVP, user stories и use cases |
| [`docs/02-design`](docs/02-design) | архитектура, модель данных, sequence diagrams и OpenAPI |
| [`docs/03-development`](docs/03-development) | итеративные планы реализации клиента и backend |
| [`docs/source`](docs/source) | полный исходный бриф заказчика |
| [`docs/test-cases.md`](docs/test-cases.md) | 25 тест-кейсов и регрессионный минимум |
| [`docs/manual-test-report.md`](docs/manual-test-report.md) | отчёт о ручной проверке |
| [`docs/tasks`](docs/tasks) | отдельная карточка каждой задачи и каждого бага |
| [`docs/prompts`](docs/prompts) | все промпты, использованные при работе с ИИ |
| [`docs/evidence`](docs/evidence) | снимки ручной проверки новых сценариев |
| [`docs/lecture-alignment.md`](docs/lecture-alignment.md) | матрица работ по направлениям лекций |

## Границы MVP

В продукте реализуется только роль клиента. Админка, интерфейс шефа, формирование расписания, онлайн-оплата и лояльность находятся вне скоупа. Собственный FastAPI backend и PostgreSQL приняты как учебное расширение. Каркас, схема, миграции, seed и Docker реализованы; клиентские бизнес-endpoint ещё впереди. Production-доставка APNs/FCM остаётся вне скоупа.

## Структура

```text
client/App.tsx                  интерфейс и application state
client/src/domain/              типы и чистые бизнес-правила
client/src/data/                HTTP-адаптер, mock fallback и demo-данные
client/src/notifications/       регистрация и обработка push
client/tests/                   автоматические тесты
backend/app/                    FastAPI, SQLAlchemy-модели и seed
backend/migrations/             Alembic-миграции PostgreSQL
backend/tests/                  backend pytest-тесты
compose.yaml                    локальные PostgreSQL и FastAPI
docs/                           аналитика, проектирование и отчёты
```

## Найденные и исправленные баги

1. Mock API разрешал повторную активную бронь — исправлено в `dcf5ff8`.
2. Отменённый студией класс возвращал `SLOT_FULL` вместо `SLOT_CANCELLED` — исправлено в `f070a38`.
3. Отмена студией отображалась среди предстоящих — исправлено в `ef12f07`.

Подробные симптомы, требования, промпты, воспроизведение и проверка находятся в `docs/tasks/BUG-*.md`.

## Перед сдачей

Репозиторий опубликован: [Dockstage/chef-table-app](https://github.com/Dockstage/chef-table-app). Перед отправкой формы пройти актуальный [`SUBMISSION_CHECKLIST.md`](SUBMISSION_CHECKLIST.md). Не коммитить `node_modules`, `.expo`, `.npm-cache` и `dist`.
