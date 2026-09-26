from typing import Any

from app.schemas.problem import Problem

PROBLEM_CONTENT = {
    "application/problem+json": {
        "schema": {"$ref": "#/components/schemas/Problem"},
    }
}


def problem_response(description: str) -> dict[str, Any]:
    return {
        "model": Problem,
        "description": description,
        "content": PROBLEM_CONTENT,
    }


UNAUTHORIZED_RESPONSE = problem_response("Bearer-токен отсутствует или невалиден.")
VALIDATION_RESPONSE = problem_response("Параметры не прошли структурную валидацию.")
INTERNAL_ERROR_RESPONSE = problem_response("Непредвиденная серверная ошибка.")
SERVICE_UNAVAILABLE_RESPONSE = problem_response("Зависимость временно недоступна.")
RATE_LIMITED_RESPONSE = {
    **problem_response("Превышен лимит запросов."),
    "headers": {
        "Retry-After": {
            "description": "Через сколько секунд допустим повтор.",
            "schema": {"type": "integer", "minimum": 1},
        }
    },
}

COMMON_ERROR_RESPONSES = {
    401: UNAUTHORIZED_RESPONSE,
    422: VALIDATION_RESPONSE,
    429: RATE_LIMITED_RESPONSE,
    500: INTERNAL_ERROR_RESPONSE,
    503: SERVICE_UNAVAILABLE_RESPONSE,
}
