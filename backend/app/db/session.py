from collections.abc import Generator

from fastapi import Request
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session

from app.config import get_settings


def create_database_engine(database_url: str | None = None) -> Engine:
    url = database_url or get_settings().database_url
    return create_engine(url, pool_pre_ping=True)


def get_database_session(request: Request) -> Generator[Session]:
    engine: Engine = request.app.state.database_engine
    with Session(engine) as session:
        yield session
