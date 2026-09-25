# Repository Guidelines

## Project Structure & Module Organization

This repository is currently an empty scaffold. Place production code in `src/`, tests in `tests/`, and non-code resources in `assets/`. Group modules by feature, and exclude generated directories such as `dist/` or `build/` from version control.

## Build, Test, and Development Commands

No build system, dependency manifest, or test runner is configured. When adding tooling, expose and document standard commands for development, testing, linting, and production builds through `package.json`, `pyproject.toml`, or a `Makefile`. Update this section with the actual commands in the same change.

## Coding Style & Naming Conventions

Commit the standard formatter and linter configuration for the chosen language. Use spaces unless the formatter requires tabs. Prefer `PascalCase` for types and components, `camelCase` for functions and variables, and lowercase hyphenated names for documentation and assets. Keep modules focused.

## Testing Guidelines

Add deterministic, independent tests with every behavior change or bug fix. Mirror source paths beneath `tests/` and follow framework conventions such as `user_service_test.py` or `user-service.test.ts`. Keep the full suite runnable with one documented command and define a coverage target when selecting a framework.

## Commit & Pull Request Guidelines

There is no commit history from which to infer conventions. Use concise, imperative subjects, optionally with Conventional Commit prefixes such as `feat:` or `fix:`. Pull requests should explain the problem and solution, list verification steps, and link issues. Include screenshots for UI changes and call out migrations or configuration changes.

## Режим работы

### Субагенты

Не создавай и не используй субагентов, параллельных агентов или делегирование задач, если пользователь прямо не попросил об этом в текущем сообщении. Не предлагай использовать субагентов по собственной инициативе.

### Экономия токенов

- Сначала изучай только файлы, необходимые для текущей задачи.
- Не сканируй весь репозиторий без необходимости.
- Не повторяй уже полученную информацию и не перечитывай неизменённые файлы.
- Не выполняй широкие исследования, поиск в интернете или объёмные проверки, если этого не требует задача или пользователь.
- Предпочитай короткие, точные изменения массовым переписываниям.
- Перед долгими или ресурсоёмкими операциями кратко объясняй их необходимость.
- Не запускай тесты, сборку или линтер повторно без изменений, способных повлиять на результат.
- В итоговом ответе кратко указывай, что изменено, как это проверено и что осталось сделать.
