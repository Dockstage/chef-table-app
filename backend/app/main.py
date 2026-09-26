from fastapi import FastAPI

from app.api.router import api_router


def create_app() -> FastAPI:
    application = FastAPI(
        title="Chef Table API",
        version="0.1.0",
        description="Client API for the Chef Table educational MVP.",
    )
    application.include_router(api_router)
    return application


app = create_app()
