import logging
from typing import Annotated
from uuid import UUID

import pytest
from fastapi import APIRouter, Depends
from httpx import ASGITransport, AsyncClient
from pydantic import BaseModel, Field, ValidationError

from app.api.auth import get_current_client_id
from app.api.errors import PROBLEM_HTTP_STATUS, ApiProblem
from app.api.middleware import JsonLogFormatter
from app.config import Settings
from app.domain.identity import DEMO_CLIENT_ID
from app.main import create_app
from app.schemas.problem import ProblemCode

TEST_TOKEN = "test-dev-bearer-token-12345"


class ValidationProbe(BaseModel):
    allergy_notes: str = Field(alias="allergyNotes", max_length=3)


def build_test_app():
    settings = Settings(
        _env_file=None,
        database_url="postgresql+psycopg://test:test@localhost:5432/test",
        cors_origins=["http://localhost:8081"],
        log_level="DEBUG",
        dev_bearer_token=TEST_TOKEN,
    )
    application = create_app(settings)
    router = APIRouter(prefix="/v1")

    @router.get("/auth-probe")
    async def auth_probe(
        client_id: Annotated[UUID, Depends(get_current_client_id)],
    ) -> dict[str, str]:
        return {"clientId": str(client_id)}

    @router.post("/validation-probe")
    async def validation_probe(_payload: ValidationProbe) -> dict[str, str]:
        return {"status": "ok"}

    @router.get("/missing-class")
    async def missing_class() -> None:
        raise ApiProblem(ProblemCode.CLASS_NOT_FOUND, "Класс не найден.")

    @router.get("/unexpected-error")
    async def unexpected_error() -> None:
        raise RuntimeError("private allergy details")

    application.include_router(router)
    return application


@pytest.mark.anyio
async def test_request_id_and_cors_are_applied() -> None:
    application = build_test_app()
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        response = await client.options(
            "/v1/auth-probe",
            headers={
                "Origin": "http://localhost:8081",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:8081"
    assert response.headers["x-request-id"]


@pytest.mark.anyio
@pytest.mark.parametrize("authorization", [None, "Bearer wrong-token-value"])
async def test_missing_or_invalid_token_returns_problem(authorization: str | None) -> None:
    application = build_test_app()
    headers = {"Authorization": authorization} if authorization else {}
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        response = await client.get("/v1/auth-probe", headers=headers)

    body = response.json()
    assert response.status_code == 401
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.headers["www-authenticate"] == "Bearer"
    assert response.headers["x-request-id"] == body["traceId"]
    assert body["code"] == "UNAUTHORIZED"
    assert body["message"] == "Требуется авторизация."


@pytest.mark.anyio
async def test_valid_token_returns_seeded_client_identity() -> None:
    application = build_test_app()
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        response = await client.get(
            "/v1/auth-probe",
            headers={"Authorization": f"Bearer {TEST_TOKEN}"},
        )

    assert response.status_code == 200
    assert response.json() == {"clientId": str(DEMO_CLIENT_ID)}


@pytest.mark.anyio
async def test_validation_error_uses_problem_contract() -> None:
    application = build_test_app()
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        response = await client.post(
            "/v1/validation-probe",
            json={"allergyNotes": "too long"},
        )

    body = response.json()
    assert response.status_code == 422
    assert body["code"] == "VALIDATION_ERROR"
    assert body["fieldErrors"] == [
        {"field": "allergyNotes", "message": "Превышена допустимая длина."}
    ]
    assert response.headers["x-request-id"] == body["traceId"]


@pytest.mark.anyio
async def test_unknown_route_and_domain_resource_use_problem_contract() -> None:
    application = build_test_app()
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        route_response = await client.get("/does-not-exist")
        resource_response = await client.get("/v1/missing-class")
        method_response = await client.post("/health")

    assert route_response.status_code == 404
    assert route_response.json()["code"] == "NOT_FOUND"
    assert resource_response.status_code == 404
    assert resource_response.json()["code"] == "CLASS_NOT_FOUND"
    assert method_response.status_code == 405
    assert method_response.json()["code"] == "METHOD_NOT_ALLOWED"


@pytest.mark.anyio
async def test_unexpected_errors_are_generic_and_logs_exclude_sensitive_values() -> None:
    application = build_test_app()
    records: list[logging.LogRecord] = []

    class CaptureHandler(logging.Handler):
        def emit(self, record: logging.LogRecord) -> None:
            records.append(record)

    logger = logging.getLogger("chef_table.http")
    handler = CaptureHandler()
    logger.addHandler(handler)
    try:
        async with AsyncClient(
            transport=ASGITransport(app=application, raise_app_exceptions=False),
            base_url="http://test",
        ) as client:
            response = await client.get(
                "/v1/unexpected-error",
                headers={"Authorization": f"Bearer {TEST_TOKEN}"},
            )
    finally:
        logger.removeHandler(handler)

    body = response.json()
    rendered_logs = "\n".join(JsonLogFormatter().format(record) for record in records)
    assert response.status_code == 500
    assert body["code"] == "INTERNAL_ERROR"
    assert "private allergy details" not in response.text
    assert TEST_TOKEN not in rendered_logs
    assert "private allergy details" not in rendered_logs
    assert "request_failed" in rendered_logs


def test_settings_reject_invalid_database_and_cors() -> None:
    assert set(PROBLEM_HTTP_STATUS) == set(ProblemCode)
    with pytest.raises(ValidationError):
        Settings(_env_file=None, database_url="sqlite:///test.db")
    with pytest.raises(ValidationError):
        Settings(_env_file=None, cors_origins=["*"])
