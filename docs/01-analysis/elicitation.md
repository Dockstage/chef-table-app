# Выявление требований

Этот файл служит индексом этапа elicitation. Канонические результаты разделены, чтобы вопросы и описание предметной области не смешивались:

- [`customer-questions.md`](customer-questions.md) — вопросы, ответы, статусы, источники, допущения и отложенные production-решения;
- [`domain-description.md`](domain-description.md) — границы домена, акторы, сущности, жизненные циклы и бизнес-правила;
- [`decisions/decision-log.md`](decisions/decision-log.md) — решения, возникшие после исходного брифа;
- [`decisions/ADR-001-own-backend.md`](decisions/ADR-001-own-backend.md) — обоснование собственного FastAPI-backend.

## Статус этапа

- Вопросы, необходимые для формализации учебного MVP, закрыты.
- Неопределённости production вынесены отдельно и не заполняются догадками.
- Исходный бриф сохранён без изменений.
- Требования формализованы в отдельных `business-requirements.md`, `functional-requirements.md` и `non-functional-requirements.md`.
- Следующий этап — усилить User Stories и Use Cases и связать их с каноническими требованиями.
