import hashlib
import json
from datetime import UTC, datetime
from uuid import UUID

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.dependencies import get_booking_service
from app.config import Settings
from app.domain.bookings import BookingDetails, CreateBookingResult
from app.domain.errors import (
    CookingClassNotFoundError,
    DuplicateBookingError,
    IdempotencyConflictError,
    RentalUnavailableError,
    SlotCancelledError,
    SlotFullError,
    SlotNotBookableError,
)
from app.main import create_app
from app.services.bookings import BookingService

TEST_TOKEN = "test-booking-bearer-token-12345"
CLIENT_ID = UUID("00000000-0000-4000-8000-000000000001")
BOOKING_ID = UUID("30000000-0000-4000-8000-000000000009")
CLASS_ID = UUID("20000000-0000-4000-8000-000000000001")
IDEMPOTENCY_KEY = UUID("40000000-0000-4000-8000-000000000009")


def booking() -> BookingDetails:
    return BookingDetails(
        id=BOOKING_ID,
        class_id=CLASS_ID,
        status="confirmed",
        equipment_option="rental",
        allergy_notes="Без орехов",
        total_price_kopecks=490_000,
        created_at=datetime(2026, 9, 26, 12, tzinfo=UTC),
        studio_cancellation_reason=None,
        rating=None,
        review_comment=None,
    )


class FakeBookingRepository:
    def __init__(self, *, replayed: bool = False, error: Exception | None = None) -> None:
        self.replayed = replayed
        self.error = error
        self.last_client_id: UUID | None = None
        self.last_hash: str | None = None

    def list_bookings(self, client_id: UUID) -> list[BookingDetails]:
        self.last_client_id = client_id
        return [booking()]

    def create_booking(
        self,
        client_id: UUID,
        idempotency_key: UUID,
        request_hash: str,
        class_id: UUID,
        equipment_option: str,
        allergy_notes: str,
    ) -> CreateBookingResult:
        self.last_client_id = client_id
        self.last_hash = request_hash
        if self.error is not None:
            raise self.error
        assert idempotency_key == IDEMPOTENCY_KEY
        assert class_id == CLASS_ID
        assert equipment_option == "rental"
        assert allergy_notes == "Без орехов"
        return CreateBookingResult(booking(), self.replayed)


def build_test_app(repository: FakeBookingRepository):
    settings = Settings(
        _env_file=None,
        database_url="postgresql+psycopg://test:test@localhost:5432/test",
        dev_bearer_token=TEST_TOKEN,
    )
    application = create_app(settings)
    application.dependency_overrides[get_booking_service] = lambda: BookingService(repository)
    return application


def auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {TEST_TOKEN}"}


@pytest.mark.anyio
async def test_list_bookings_uses_authenticated_client() -> None:
    repository = FakeBookingRepository()
    application = build_test_app(repository)
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        response = await client.get("/v1/bookings", headers=auth_headers())

    assert response.status_code == 200
    assert response.json()[0]["id"] == str(BOOKING_ID)
    assert response.json()[0]["rating"] is None
    assert repository.last_client_id == CLIENT_ID


@pytest.mark.anyio
@pytest.mark.parametrize("replayed", [False, True])
async def test_create_booking_returns_idempotency_state(replayed: bool) -> None:
    repository = FakeBookingRepository(replayed=replayed)
    application = build_test_app(repository)
    headers = {**auth_headers(), "Idempotency-Key": str(IDEMPOTENCY_KEY)}
    payload = {
        "classId": str(CLASS_ID),
        "equipmentOption": "rental",
        "allergyNotes": "Без орехов",
    }
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        response = await client.post("/v1/bookings", headers=headers, json=payload)

    canonical = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    assert response.status_code == 201
    assert response.headers["idempotency-replayed"] == str(replayed).lower()
    assert repository.last_hash == hashlib.sha256(canonical.encode()).hexdigest()


@pytest.mark.anyio
@pytest.mark.parametrize(
    ("error", "status", "code"),
    [
        (CookingClassNotFoundError(), 404, "CLASS_NOT_FOUND"),
        (SlotFullError(), 409, "SLOT_FULL"),
        (SlotCancelledError(), 410, "SLOT_CANCELLED"),
        (SlotNotBookableError(), 409, "SLOT_NOT_BOOKABLE"),
        (DuplicateBookingError(), 409, "DUPLICATE_BOOKING"),
        (RentalUnavailableError(), 409, "RENTAL_UNAVAILABLE"),
        (IdempotencyConflictError(), 409, "IDEMPOTENCY_CONFLICT"),
    ],
)
async def test_create_booking_maps_domain_errors(
    error: Exception,
    status: int,
    code: str,
) -> None:
    application = build_test_app(FakeBookingRepository(error=error))
    headers = {**auth_headers(), "Idempotency-Key": str(IDEMPOTENCY_KEY)}
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        response = await client.post(
            "/v1/bookings",
            headers=headers,
            json={
                "classId": str(CLASS_ID),
                "equipmentOption": "rental",
                "allergyNotes": "Без орехов",
            },
        )

    assert response.status_code == status
    assert response.json()["code"] == code
    assert response.headers["content-type"].startswith("application/problem+json")


@pytest.mark.anyio
async def test_create_booking_requires_auth_key_and_valid_body() -> None:
    application = build_test_app(FakeBookingRepository())
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        unauthorized = await client.get("/v1/bookings")
        missing_key = await client.post(
            "/v1/bookings",
            headers=auth_headers(),
            json={
                "classId": str(CLASS_ID),
                "equipmentOption": "own",
                "allergyNotes": "",
            },
        )
        invalid_body = await client.post(
            "/v1/bookings",
            headers={**auth_headers(), "Idempotency-Key": str(IDEMPOTENCY_KEY)},
            json={
                "classId": str(CLASS_ID),
                "equipmentOption": "own",
                "allergyNotes": "x" * 301,
            },
        )

    assert unauthorized.status_code == 401
    assert missing_key.status_code == 422
    assert invalid_body.status_code == 422
