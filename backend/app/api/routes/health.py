from fastapi import APIRouter

from app.schemas.health import HealthResponse

router = APIRouter(tags=["operations"])


@router.get("/health", operation_id="healthCheck", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    return HealthResponse()
