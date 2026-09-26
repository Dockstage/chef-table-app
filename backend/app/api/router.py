from fastapi import APIRouter

from app.api.routes.bookings import router as bookings_router
from app.api.routes.classes import router as classes_router
from app.api.routes.health import router as health_router
from app.api.routes.push_tokens import router as push_tokens_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(classes_router)
api_router.include_router(bookings_router)
api_router.include_router(push_tokens_router)
