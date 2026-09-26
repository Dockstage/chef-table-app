# PROMPT-040 — Состояния загрузки клиента

## Запрос пользователя

> Давай следующий шаг

## Рабочий промпт

Выполни CL-04 и LOGIC-007: введи независимые состояния `initial/loading/content/empty/error/refreshing/stale` для расписания и записей. Первичная ошибка должна отличаться от Empty и содержать постоянную кнопку retry; refresh failure сохраняет snapshot. Используй partial results, чтобы сбой одного top-level запроса или одной архивной карточки не обнулял другой экран. Добавь fallback, unit-тесты state machine/partial loading, проверь web export и синхронизируй TASK/PROMPT, план, архитектуру, чеклист и трассировку.
