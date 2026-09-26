# Repository Guidelines

## Project Structure & Module Organization

The repository contains an Expo/React Native client and a planned FastAPI backend. Before the monorepo move, the client entry point is `App.tsx`, modules are in `src/`, and tests are in `tests/`. The target layout is `client/`, `backend/`, shared `docs/`, and root `compose.yaml`. Keep analysis, design, and implementation plans in their numbered `docs/` directories.

## Build, Test, and Development Commands

Run the current client commands from the repository root; after the monorepo move, run them from `client/`:

- `npm run web` — start the Expo web development server.
- `npm run typecheck` — check strict TypeScript without emitting files.
- `npm test` — run the Vitest suite once.
- `npm run export:web` — produce the web bundle in `dist/`.

Document backend and Docker commands when they are introduced.

## Coding Style & Architecture

Use TypeScript strict mode, two-space indentation, `PascalCase` for components/types, and `camelCase` for functions/variables. Python follows Ruff. Organize by feature and direct dependencies toward domain logic. Do not build monoliths: split screens, handlers, services, repositories, schemas, UI, and configuration into focused modules. `App.tsx` and `backend/app/main.py` are composition roots, not business-logic containers.

## Testing Guidelines

Add deterministic tests with behavior changes and bug fixes. Use `*.test.ts` and `test_*.py`. Backend integration tests use PostgreSQL with real Alembic migrations, not SQLite. Keep client and backend suites independently runnable.

## Commit & Pull Request Guidelines

Use concise Conventional Commit subjects. Each task or bug requires a Markdown card, prompt, verification notes, and focused commit. Pull requests describe the problem, solution, checks, linked requirements, and UI screenshots when applicable.

## Режим работы

### Субагенты

Не создавай и не используй субагентов, параллельных агентов или делегирование задач, если пользователь прямо не попросил об этом в текущем сообщении. Не предлагай использовать субагентов по собственной инициативе.

### Экономия токенов

- Сначала изучай только файлы, необходимые для текущей задачи.
- Не сканируй весь репозиторий без необходимости.
- Не повторяй уже полученную информацию и не перечитывай неизменённые файлы.
- Не выполняй широкие исследования, поиск в интернете или объёмные проверки без необходимости.
- Предпочитай короткие, точные изменения массовым переписываниям.
- Перед долгими или ресурсоёмкими операциями кратко объясняй их необходимость.
- Не запускай проверки повторно без изменений, способных повлиять на результат.
- В итоге кратко указывай, что изменено, как проверено и что осталось сделать.
