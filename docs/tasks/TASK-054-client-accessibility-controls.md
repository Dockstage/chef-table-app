# TASK-054 — Доступность интерактивных элементов

## Цель

Закрыть первые два пункта CL-08: минимальный размер touch targets и программную семантику controls.

## Требования

`NFR-003`, CL-08 и чеклист разработки.

## Промпт

[`docs/prompts/054-client-accessibility-controls.md`](../prompts/054-client-accessibility-controls.md).

## Выполнено

- сегменты увеличены с 38 до 44 px, close-кнопка — с 42 до 44 px;
- retry, stars, text close, cancel и review controls гарантируют минимум 44×44;
- bottom navigation и сегменты имеют роль `tab` и `selected`;
- rating/equipment используют `radio` и `checked`, disabled/busy передаются для недоступных действий;
- добавлены предметные accessible names для закрытия, отмены, оценки, retry и push;
- toast объявляется как alert;
- статический проход подтвердил роли у всех текущих `Pressable`; крупные cards/options уже превышали 44×44;
- contrast, font scaling, keyboard, screen reader и платформенная проверка не заявлены выполненными и остаются в CL-08.

## Проверка

- [x] `npm run lint`.
- [x] `npm run typecheck`.
- [x] `npm run format:check`.
- [x] Полный Vitest-suite: 55/55.
- [x] `npm run export:web`.
- [x] `git diff --check`.

## Commit

`bdba550` — `feat: improve client control accessibility`.
