# Чек-лист сдачи

## Уже готово

- [x] Выбран один бриф — «Кулинарная студия».
- [x] Описаны требования MVP, user stories и сценарии.
- [x] Подготовлены архитектурный план, схема данных и OpenAPI.
- [x] Реализованы минимум 3 функции — фактически 8 пользовательских возможностей.
- [x] Составлены 25 тест-кейсов; автоматический регресс содержит 58 client и 42 backend-теста.
- [x] Найдены и исправлены 3 бага.
- [x] Для задач, багов и промптов созданы `.md`-файлы.
- [x] Выполнены отдельные Git-коммиты.
- [x] TypeScript, тесты и web-сборка проходят.
- [x] Автор всех коммитов — `Gagik Asatryan <100160634+Dockstage@users.noreply.github.com>`.
- [x] Репозиторий опубликован на GitHub.
- [x] Добавлены свежие screenshots и machine-readable logs финального full-stack smoke.
- [x] Реализованы HTTP-адаптер и клиентская push-интеграция.
- [x] `.env` и локальные артефакты исключены из Git.
- [x] TypeScript-модель, ER-схема и OpenAPI согласованы.
- [x] Полный исходный бриф сохранён в `docs/source/`.

## Перед отправкой формы

1. Убедиться, что `git status` чистый и GitHub содержит итоговые отчёты/evidence.
2. Открыть [репозиторий](https://github.com/Dockstage/chef-table-app) в режиме инкогнито и убедиться, что он доступен проверяющим.
3. В форму задания вставить ссылку на репозиторий.
4. В инструментах указать: Codex, Expo, React Native, TypeScript, Vitest, Expo Notifications, Python, FastAPI, SQLAlchemy, PostgreSQL и Docker.
5. При необходимости заменить демонстрационные имя и телефон в `client/src/features/profile/ProfileScreen.tsx` — на оценивание функций это не влияет.

Нативная доставка push на физическом Android/iOS не проверена: доступной нативной среды и production APNs/FCM-ключей не было. Клиентские ветви foreground, открытия уведомления и холодного запуска покрыты автоматическими тестами; web fallback и backend-регистрация токена проверены вручную.

Финальный регресс уже выполнен и сохранён в `docs/04-testing/final-automated-regression.md`. Не повторять его без изменений кода, зависимостей или конфигурации. Если такие изменения появятся, выполнить:

```powershell
cd client
npm ci --include=dev
npx expo install --check
npm run lint
npm run format:check
npm run typecheck
npm test
$env:EXPO_PUBLIC_API_MODE="mock"
npm run export:web
cd ..
git status
```

`git status` должен показать чистую рабочую ветку.
