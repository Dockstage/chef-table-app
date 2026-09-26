import hashlib
import json
from collections.abc import Callable
from datetime import UTC, datetime
from uuid import UUID

from app.domain.bookings import BookingDetails, CreateBookingResult
from app.repositories.bookings import BookingRepository


class BookingService:
    def __init__(
        self,
        repository: BookingRepository,
        clock: Callable[[], datetime] | None = None,
    ) -> None:
        self._repository = repository
        self._clock = clock or (lambda: datetime.now(UTC))

    def list_bookings(self, client_id: UUID) -> list[BookingDetails]:
        return self._repository.list_bookings(client_id)

    def create_booking(
        self,
        client_id: UUID,
        idempotency_key: UUID,
        class_id: UUID,
        equipment_option: str,
        allergy_notes: str,
    ) -> CreateBookingResult:
        payload = {
            "classId": str(class_id),
            "equipmentOption": equipment_option,
            "allergyNotes": allergy_notes,
        }
        canonical_payload = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        request_hash = hashlib.sha256(canonical_payload.encode()).hexdigest()
        return self._repository.create_booking(
            client_id,
            idempotency_key,
            request_hash,
            class_id,
            equipment_option,
            allergy_notes,
        )

    def cancel_booking(self, client_id: UUID, booking_id: UUID) -> BookingDetails:
        return self._repository.cancel_booking(client_id, booking_id, self._clock())
