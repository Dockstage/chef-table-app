import hashlib
from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models.booking import Booking, Review
from app.db.models.catalog import CookingClass
from app.db.models.idempotency import IdempotencyRecord
from app.domain.bookings import BookingDetails, CreateBookingResult, is_cancellation_allowed
from app.domain.errors import (
    BookingNotActiveError,
    BookingNotFoundError,
    CancellationClosedError,
    CookingClassNotFoundError,
    DuplicateBookingError,
    IdempotencyConflictError,
    RentalUnavailableError,
    ReviewNotAllowedError,
    SlotCancelledError,
    SlotFullError,
    SlotNotBookableError,
)


class SqlAlchemyBookingRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def list_bookings(self, client_id: UUID) -> list[BookingDetails]:
        rows = self._session.execute(
            select(Booking, Review)
            .outerjoin(Review, Review.booking_id == Booking.id)
            .where(Booking.client_id == client_id)
            .order_by(Booking.created_at.desc(), Booking.id)
        ).all()
        return [self._to_details(booking, review) for booking, review in rows]

    def create_booking(
        self,
        client_id: UUID,
        idempotency_key: UUID,
        request_hash: str,
        class_id: UUID,
        equipment_option: str,
        allergy_notes: str,
    ) -> CreateBookingResult:
        with self._session.begin():
            self._lock_idempotency_key(client_id, idempotency_key)
            record = self._get_idempotency_record(client_id, idempotency_key)
            if record is not None:
                if record.request_hash != request_hash:
                    raise IdempotencyConflictError
                return CreateBookingResult(
                    booking=self._details_from_response(record.response_body),
                    replayed=True,
                )

            cooking_class = self._session.execute(
                select(CookingClass).where(CookingClass.id == class_id).with_for_update()
            ).scalar_one_or_none()
            if cooking_class is None:
                raise CookingClassNotFoundError
            if cooking_class.status == "cancelled":
                raise SlotCancelledError
            if cooking_class.status != "scheduled":
                raise SlotNotBookableError
            if cooking_class.available_seats <= 0:
                raise SlotFullError
            if equipment_option == "rental" and cooking_class.available_rental_kits <= 0:
                raise RentalUnavailableError

            duplicate = self._session.scalar(
                select(Booking.id).where(
                    Booking.client_id == client_id,
                    Booking.class_id == class_id,
                    Booking.status == "confirmed",
                )
            )
            if duplicate is not None:
                raise DuplicateBookingError

            total_price = cooking_class.price_kopecks
            if equipment_option == "rental":
                total_price += cooking_class.rental_price_kopecks
                cooking_class.available_rental_kits -= 1
            cooking_class.available_seats -= 1

            booking = Booking(
                client_id=client_id,
                class_id=class_id,
                status="confirmed",
                equipment_option=equipment_option,
                allergy_notes=allergy_notes,
                total_price_kopecks=total_price,
                studio_cancellation_reason=None,
            )
            self._session.add(booking)
            self._session.flush()
            self._session.refresh(booking)
            details = self._to_details(booking, None)
            self._session.add(
                IdempotencyRecord(
                    client_id=client_id,
                    key=idempotency_key,
                    request_hash=request_hash,
                    response_status=201,
                    response_body=self._response_body(details),
                )
            )

        return CreateBookingResult(booking=details, replayed=False)

    def cancel_booking(
        self,
        client_id: UUID,
        booking_id: UUID,
        now: datetime,
    ) -> BookingDetails:
        with self._session.begin():
            booking = self._session.execute(
                select(Booking)
                .where(Booking.id == booking_id, Booking.client_id == client_id)
                .with_for_update()
            ).scalar_one_or_none()
            if booking is None:
                raise BookingNotFoundError
            if booking.status != "confirmed":
                raise BookingNotActiveError

            cooking_class = self._session.execute(
                select(CookingClass).where(CookingClass.id == booking.class_id).with_for_update()
            ).scalar_one()
            if not is_cancellation_allowed(cooking_class.starts_at, now):
                raise CancellationClosedError

            booking.status = "cancelled_by_client"
            cooking_class.available_seats += 1
            if booking.equipment_option == "rental":
                cooking_class.available_rental_kits += 1
            self._session.flush()
            details = self._to_details(booking, None)

        return details

    def create_review(
        self,
        client_id: UUID,
        booking_id: UUID,
        rating: int,
        comment: str,
    ) -> BookingDetails:
        with self._session.begin():
            booking = self._session.execute(
                select(Booking)
                .where(Booking.id == booking_id, Booking.client_id == client_id)
                .with_for_update()
            ).scalar_one_or_none()
            if booking is None:
                raise BookingNotFoundError
            if booking.status != "attended":
                raise ReviewNotAllowedError

            existing_review = self._session.scalar(
                select(Review.id).where(Review.booking_id == booking.id)
            )
            if existing_review is not None:
                raise ReviewNotAllowedError

            review = Review(
                booking_id=booking.id,
                rating=rating,
                comment=comment or None,
            )
            self._session.add(review)
            self._session.flush()
            details = self._to_details(booking, review)

        return details

    def _lock_idempotency_key(self, client_id: UUID, idempotency_key: UUID) -> None:
        digest = hashlib.sha256(f"{client_id}:{idempotency_key}".encode()).digest()
        lock_id = int.from_bytes(digest[:8], byteorder="big", signed=True)
        self._session.execute(select(func.pg_advisory_xact_lock(lock_id)))

    def _get_idempotency_record(
        self,
        client_id: UUID,
        idempotency_key: UUID,
    ) -> IdempotencyRecord | None:
        return self._session.execute(
            select(IdempotencyRecord).where(
                IdempotencyRecord.client_id == client_id,
                IdempotencyRecord.key == idempotency_key,
            )
        ).scalar_one_or_none()

    @staticmethod
    def _to_details(booking: Booking, review: Review | None) -> BookingDetails:
        return BookingDetails(
            id=booking.id,
            class_id=booking.class_id,
            status=booking.status,
            equipment_option=booking.equipment_option,
            allergy_notes=booking.allergy_notes,
            total_price_kopecks=booking.total_price_kopecks,
            created_at=booking.created_at,
            studio_cancellation_reason=booking.studio_cancellation_reason,
            rating=review.rating if review else None,
            review_comment=review.comment if review else None,
        )

    @staticmethod
    def _response_body(booking: BookingDetails) -> dict[str, object]:
        return {
            "id": str(booking.id),
            "classId": str(booking.class_id),
            "status": booking.status,
            "equipmentOption": booking.equipment_option,
            "allergyNotes": booking.allergy_notes,
            "totalPriceKopecks": booking.total_price_kopecks,
            "createdAt": booking.created_at.isoformat(),
            "studioCancellationReason": booking.studio_cancellation_reason,
            "rating": booking.rating,
            "reviewComment": booking.review_comment,
        }

    @staticmethod
    def _details_from_response(body: dict[str, Any]) -> BookingDetails:
        return BookingDetails(
            id=UUID(str(body["id"])),
            class_id=UUID(str(body["classId"])),
            status=str(body["status"]),
            equipment_option=str(body["equipmentOption"]),
            allergy_notes=str(body["allergyNotes"]),
            total_price_kopecks=int(body["totalPriceKopecks"]),
            created_at=datetime.fromisoformat(str(body["createdAt"]).replace("Z", "+00:00")),
            studio_cancellation_reason=body.get("studioCancellationReason"),
            rating=body.get("rating"),
            review_comment=body.get("reviewComment"),
        )
