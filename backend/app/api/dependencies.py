from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.repositories.bookings import SqlAlchemyBookingRepository
from app.db.repositories.catalog import SqlAlchemyCatalogRepository
from app.db.session import get_database_session
from app.services.bookings import BookingService
from app.services.catalog import CatalogService


def get_catalog_service(
    session: Annotated[Session, Depends(get_database_session)],
) -> CatalogService:
    return CatalogService(SqlAlchemyCatalogRepository(session))


CatalogServiceDependency = Annotated[CatalogService, Depends(get_catalog_service)]


def get_booking_service(
    session: Annotated[Session, Depends(get_database_session)],
) -> BookingService:
    return BookingService(SqlAlchemyBookingRepository(session))


BookingServiceDependency = Annotated[BookingService, Depends(get_booking_service)]
