from datetime import UTC, datetime, timedelta
from uuid import UUID

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.exc import OperationalError

from app.api.dependencies import get_catalog_service
from app.config import Settings
from app.domain.catalog import ChefDetails, CookingClassDetails
from app.main import create_app
from app.services.catalog import CatalogService

TEST_TOKEN = "test-catalog-bearer-token-12345"
CLASS_ID = UUID("20000000-0000-4000-8000-000000000001")
CHEF_ID = UUID("10000000-0000-4000-8000-000000000001")


def cooking_class(
    class_id: UUID = CLASS_ID,
    *,
    starts_at: datetime | None = None,
    level: str = "beginner",
    status: str = "scheduled",
    cancellation_reason: str | None = None,
) -> CookingClassDetails:
    return CookingClassDetails(
        id=class_id,
        title="Паста с нуля",
        eyebrow="Готовим вместе",
        description="Замесим тесто и приготовим соус.",
        dishes=["Тальятелле", "Тирамису"],
        level=level,
        chef=ChefDetails(
            id=CHEF_ID,
            name="Михаил Орлов",
            role="Шеф итальянской кухни",
            rating=4.9,
            initials="МО",
        ),
        starts_at=starts_at or datetime(2026, 10, 3, 18, tzinfo=UTC),
        duration_minutes=180,
        status=status,
        capacity=12,
        available_seats=3,
        price_kopecks=450_000,
        rental_price_kopecks=40_000,
        available_rental_kits=2,
        address="Лофт «Шеф-стол», ул. Заводская, 12",
        accent="#C64F33",
        soft_accent="#F7DDD3",
        cancellation_reason=cancellation_reason,
    )


class FakeCatalogRepository:
    def __init__(self, classes: list[CookingClassDetails]) -> None:
        self.classes = classes
        self.last_level: str | None = None

    def list_classes(
        self,
        starts_from: datetime,
        starts_to: datetime,
        level: str | None,
    ) -> list[CookingClassDetails]:
        self.last_level = level
        return [
            item
            for item in self.classes
            if starts_from <= item.starts_at < starts_to and (level is None or item.level == level)
        ]

    def get_class(self, class_id: UUID) -> CookingClassDetails | None:
        return next((item for item in self.classes if item.id == class_id), None)


class UnavailableCatalogRepository(FakeCatalogRepository):
    def list_classes(
        self,
        starts_from: datetime,
        starts_to: datetime,
        level: str | None,
    ) -> list[CookingClassDetails]:
        raise OperationalError("SELECT cooking_classes", {}, Exception("database unavailable"))


def build_test_app(repository: FakeCatalogRepository):
    settings = Settings(
        _env_file=None,
        database_url="postgresql+psycopg://test:test@localhost:5432/test",
        dev_bearer_token=TEST_TOKEN,
    )
    application = create_app(settings)
    application.dependency_overrides[get_catalog_service] = lambda: CatalogService(repository)
    return application


def auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {TEST_TOKEN}"}


@pytest.mark.anyio
async def test_list_classes_filters_level_and_sorts_by_start() -> None:
    early = cooking_class(starts_at=datetime(2026, 10, 2, 10, tzinfo=UTC), level="advanced")
    late = cooking_class(
        UUID("20000000-0000-4000-8000-000000000002"),
        starts_at=datetime(2026, 10, 4, 10, tzinfo=UTC),
        level="advanced",
    )
    ignored = cooking_class(
        UUID("20000000-0000-4000-8000-000000000003"),
        starts_at=datetime(2026, 10, 3, 10, tzinfo=UTC),
        level="beginner",
    )
    repository = FakeCatalogRepository([late, ignored, early])
    application = build_test_app(repository)

    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        response = await client.get(
            "/v1/classes",
            params={
                "from": "2026-10-01T00:00:00Z",
                "to": "2026-10-05T00:00:00Z",
                "level": "advanced",
            },
            headers=auth_headers(),
        )

    assert response.status_code == 200
    assert [item["id"] for item in response.json()] == [str(early.id), str(late.id)]
    assert response.json()[0]["chef"]["name"] == "Михаил Орлов"
    assert response.json()[0]["cancellationReason"] is None
    assert repository.last_level == "advanced"


@pytest.mark.anyio
async def test_list_classes_returns_empty_array() -> None:
    application = build_test_app(FakeCatalogRepository([]))
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        response = await client.get(
            "/v1/classes",
            params={"from": "2026-10-01T00:00:00Z", "to": "2026-10-02T00:00:00Z"},
            headers=auth_headers(),
        )

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.anyio
async def test_invalid_date_range_returns_problem() -> None:
    application = build_test_app(FakeCatalogRepository([]))
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        response = await client.get(
            "/v1/classes",
            params={"from": "2026-10-02T00:00:00Z", "to": "2026-10-02T00:00:00Z"},
            headers=auth_headers(),
        )

    assert response.status_code == 400
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.json()["code"] == "INVALID_DATE_RANGE"


@pytest.mark.anyio
async def test_get_class_returns_cancelled_class() -> None:
    cancelled = cooking_class(
        status="cancelled",
        cancellation_reason="Поставка продуктов задерживается",
    )
    application = build_test_app(FakeCatalogRepository([cancelled]))
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        response = await client.get(f"/v1/classes/{cancelled.id}", headers=auth_headers())

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"
    assert response.json()["cancellationReason"] == "Поставка продуктов задерживается"


@pytest.mark.anyio
async def test_get_unknown_class_returns_problem() -> None:
    application = build_test_app(FakeCatalogRepository([]))
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        response = await client.get(f"/v1/classes/{CLASS_ID}", headers=auth_headers())

    assert response.status_code == 404
    assert response.json()["code"] == "CLASS_NOT_FOUND"


@pytest.mark.anyio
async def test_classes_require_auth_and_validate_parameters() -> None:
    application = build_test_app(FakeCatalogRepository([]))
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        unauthorized = await client.get(
            "/v1/classes",
            params={"from": "2026-10-01T00:00:00Z", "to": "2026-10-02T00:00:00Z"},
        )
        invalid = await client.get("/v1/classes/not-a-uuid", headers=auth_headers())

    assert unauthorized.status_code == 401
    assert unauthorized.json()["code"] == "UNAUTHORIZED"
    assert invalid.status_code == 422
    assert invalid.json()["code"] == "VALIDATION_ERROR"


@pytest.mark.anyio
async def test_database_outage_returns_service_unavailable_problem() -> None:
    application = build_test_app(UnavailableCatalogRepository([]))
    async with AsyncClient(
        transport=ASGITransport(app=application, raise_app_exceptions=False),
        base_url="http://test",
    ) as client:
        response = await client.get(
            "/v1/classes",
            params={"from": "2026-10-01T00:00:00Z", "to": "2026-10-02T00:00:00Z"},
            headers=auth_headers(),
        )

    assert response.status_code == 503
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.json()["code"] == "SERVICE_UNAVAILABLE"


def test_service_sorts_tied_repository_results_deterministically() -> None:
    starts_at = datetime(2026, 10, 3, 18, tzinfo=UTC)
    later_id = cooking_class(
        UUID("20000000-0000-4000-8000-000000000002"),
        starts_at=starts_at,
    )
    earlier_id = cooking_class(CLASS_ID, starts_at=starts_at)
    repository = FakeCatalogRepository([later_id, earlier_id])

    result = CatalogService(repository).list_classes(
        starts_at - timedelta(days=1),
        starts_at + timedelta(days=1),
        None,
    )

    assert [item.id for item in result] == [earlier_id.id, later_id.id]
