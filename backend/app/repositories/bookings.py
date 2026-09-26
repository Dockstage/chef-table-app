from typing import Protocol
from uuid import UUID

from app.domain.bookings import BookingDetails, CreateBookingResult


class BookingRepository(Protocol):
    def list_bookings(self, client_id: UUID) -> list[BookingDetails]: ...

    def create_booking(
        self,
        client_id: UUID,
        idempotency_key: UUID,
        request_hash: str,
        class_id: UUID,
        equipment_option: str,
        allergy_notes: str,
    ) -> CreateBookingResult: ...
