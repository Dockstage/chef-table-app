from uuid import UUID

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.dependencies import get_push_token_service
from app.config import Settings
from app.main import create_app
from app.services.push_tokens import PushTokenService

TEST_TOKEN = "test-push-bearer-token-12345"
CLIENT_ID = UUID("00000000-0000-4000-8000-000000000001")


class FakePushTokenRepository:
    def __init__(self) -> None:
        self.registration: tuple[UUID, str, str] | None = None

    def register(self, client_id: UUID, token: str, platform: str) -> None:
        self.registration = (client_id, token, platform)


def build_test_app(repository: FakePushTokenRepository):
    settings = Settings(
        _env_file=None,
        database_url="postgresql+psycopg://test:test@localhost:5432/test",
        dev_bearer_token=TEST_TOKEN,
    )
    application = create_app(settings)
    application.dependency_overrides[get_push_token_service] = lambda: PushTokenService(repository)
    return application


@pytest.mark.anyio
async def test_register_push_token_returns_no_content() -> None:
    repository = FakePushTokenRepository()
    application = build_test_app(repository)
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        response = await client.post(
            "/v1/push-tokens",
            headers={"Authorization": f"Bearer {TEST_TOKEN}"},
            json={"token": "native-device-token", "platform": "android"},
        )

    assert response.status_code == 204
    assert response.content == b""
    assert repository.registration == (CLIENT_ID, "native-device-token", "android")


@pytest.mark.anyio
async def test_register_push_token_requires_auth_and_valid_payload() -> None:
    application = build_test_app(FakePushTokenRepository())
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        unauthorized = await client.post(
            "/v1/push-tokens",
            json={"token": "native-device-token", "platform": "ios"},
        )
        invalid = await client.post(
            "/v1/push-tokens",
            headers={"Authorization": f"Bearer {TEST_TOKEN}"},
            json={"token": "", "platform": "web"},
        )

    assert unauthorized.status_code == 401
    assert invalid.status_code == 422
