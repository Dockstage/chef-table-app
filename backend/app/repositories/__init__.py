"""Repository contracts."""

from app.repositories.bookings import BookingRepository
from app.repositories.catalog import CatalogRepository

__all__ = ["BookingRepository", "CatalogRepository"]
