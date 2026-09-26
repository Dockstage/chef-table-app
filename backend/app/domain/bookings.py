from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True, slots=True)
class BookingDetails:
    id: UUID
    class_id: UUID
    status: str
    equipment_option: str
    allergy_notes: str
    total_price_kopecks: int
    created_at: datetime
    studio_cancellation_reason: str | None
    rating: int | None
    review_comment: str | None


@dataclass(frozen=True, slots=True)
class CreateBookingResult:
    booking: BookingDetails
    replayed: bool
