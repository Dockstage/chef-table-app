from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.errors import register_exception_handlers
from app.api.middleware import RequestContextMiddleware, configure_logging
from app.api.openapi import configure_openapi
from app.api.router import api_router
from app.config import Settings, get_settings
from app.db.session import create_database_engine


def create_app(settings: Settings | None = None) -> FastAPI:
    resolved_settings = settings or get_settings()
    configure_logging(resolved_settings.log_level)
    application = FastAPI(
        title="Chef Table API",
        version="1.2.0",
        description="Client API for the Chef Table educational MVP.",
    )
    application.state.settings = resolved_settings
    application.state.database_engine = create_database_engine(resolved_settings.database_url)
    register_exception_handlers(application)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=resolved_settings.cors_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
    )
    application.add_middleware(RequestContextMiddleware)
    application.include_router(api_router)
    configure_openapi(application)
    return application


app = create_app()
