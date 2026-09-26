from collections.abc import Mapping
from typing import Final
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.schemas.problem import FieldError, Problem, ProblemCode

PROBLEM_HTTP_STATUS: Final[Mapping[ProblemCode, int]] = {
    ProblemCode.INVALID_DATE_RANGE: 400,
    ProblemCode.VALIDATION_ERROR: 422,
    ProblemCode.UNAUTHORIZED: 401,
    ProblemCode.NOT_FOUND: 404,
    ProblemCode.METHOD_NOT_ALLOWED: 405,
    ProblemCode.CLASS_NOT_FOUND: 404,
    ProblemCode.BOOKING_NOT_FOUND: 404,
    ProblemCode.SLOT_FULL: 409,
    ProblemCode.SLOT_CANCELLED: 410,
    ProblemCode.SLOT_NOT_BOOKABLE: 409,
    ProblemCode.DUPLICATE_BOOKING: 409,
    ProblemCode.RENTAL_UNAVAILABLE: 409,
    ProblemCode.IDEMPOTENCY_CONFLICT: 409,
    ProblemCode.CANCELLATION_CLOSED: 409,
    ProblemCode.BOOKING_NOT_ACTIVE: 409,
    ProblemCode.REVIEW_NOT_ALLOWED: 409,
    ProblemCode.RATE_LIMITED: 429,
    ProblemCode.INTERNAL_ERROR: 500,
    ProblemCode.SERVICE_UNAVAILABLE: 503,
}

DEFAULT_MESSAGES: Final[Mapping[ProblemCode, str]] = {
    ProblemCode.VALIDATION_ERROR: "Проверьте переданные данные.",
    ProblemCode.UNAUTHORIZED: "Требуется авторизация.",
    ProblemCode.NOT_FOUND: "Ресурс не найден.",
    ProblemCode.METHOD_NOT_ALLOWED: "Метод не поддерживается.",
    ProblemCode.INTERNAL_ERROR: "Не удалось выполнить запрос. Повторите позже.",
    ProblemCode.SERVICE_UNAVAILABLE: "Сервис временно недоступен. Повторите позже.",
}


class ApiProblem(Exception):
    def __init__(
        self,
        code: ProblemCode,
        message: str | None = None,
        *,
        field_errors: list[FieldError] | None = None,
        headers: Mapping[str, str] | None = None,
    ) -> None:
        super().__init__(code.value)
        self.code = code
        self.status = PROBLEM_HTTP_STATUS[code]
        self.message = message or DEFAULT_MESSAGES.get(code, "Не удалось выполнить запрос.")
        self.field_errors = field_errors
        self.headers = dict(headers or {})


def _trace_id(request: Request) -> str:
    return getattr(request.state, "request_id", str(uuid4()))


def _problem_response(
    request: Request,
    problem: ApiProblem,
) -> JSONResponse:
    trace_id = _trace_id(request)
    body = Problem(
        status=problem.status,
        code=problem.code,
        message=problem.message,
        trace_id=trace_id,
        field_errors=problem.field_errors,
    )
    headers = {"X-Request-ID": trace_id, **problem.headers}
    return JSONResponse(
        status_code=problem.status,
        content=body.model_dump(mode="json", by_alias=True, exclude_none=True),
        headers=headers,
        media_type="application/problem+json",
    )


def _validation_field_errors(exception: RequestValidationError) -> list[FieldError]:
    field_errors: list[FieldError] = []
    for error in exception.errors():
        location = [str(part) for part in error["loc"] if part not in {"body", "path", "query"}]
        error_type = str(error.get("type", ""))
        if error_type == "missing":
            message = "Обязательное поле."
        elif "too_long" in error_type:
            message = "Превышена допустимая длина."
        else:
            message = "Некорректное значение."
        field_errors.append(FieldError(field=".".join(location) or "request", message=message))
    return field_errors


def register_exception_handlers(application: FastAPI) -> None:
    @application.exception_handler(ApiProblem)
    async def handle_api_problem(request: Request, exception: ApiProblem) -> JSONResponse:
        return _problem_response(request, exception)

    @application.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request,
        exception: RequestValidationError,
    ) -> JSONResponse:
        return _problem_response(
            request,
            ApiProblem(
                ProblemCode.VALIDATION_ERROR,
                field_errors=_validation_field_errors(exception),
            ),
        )

    @application.exception_handler(StarletteHTTPException)
    async def handle_http_error(
        request: Request,
        exception: StarletteHTTPException,
    ) -> JSONResponse:
        if exception.status_code in {401, 403}:
            problem = ApiProblem(
                ProblemCode.UNAUTHORIZED,
                headers={"WWW-Authenticate": "Bearer"},
            )
        elif exception.status_code == 404:
            problem = ApiProblem(ProblemCode.NOT_FOUND)
        elif exception.status_code == 405:
            problem = ApiProblem(ProblemCode.METHOD_NOT_ALLOWED)
        else:
            problem = ApiProblem(ProblemCode.INTERNAL_ERROR)
        return _problem_response(request, problem)

    @application.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, _exception: Exception) -> JSONResponse:
        return _problem_response(request, ApiProblem(ProblemCode.INTERNAL_ERROR))
