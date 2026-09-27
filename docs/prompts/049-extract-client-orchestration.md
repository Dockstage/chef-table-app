# PROMPT-049 — Вынос application orchestration

## Запрос пользователя

> Давай к следующему шагу

## Рабочий промпт

Заверши CL-02: вынеси состояние, загрузку, mutation/push orchestration из `client/App.tsx` в application hook, а app shell и навигацию — в отдельный application-компонент. Оставь `App.tsx` composition root, который создаёт API и собирает приложение. Общие view-state типы размести в shared, не создавай зависимости между feature-модулями. Учти зарезервированный Expo Router путь `src/app`. Обнови архитектуру и чеклисты, выполни typecheck, полный Vitest-suite и Expo web-export, затем создай сфокусированный commit.
