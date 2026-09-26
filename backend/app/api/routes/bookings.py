from dataclasses import asdict
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Header, Path, Response, status

from app.api.auth import CurrentClientId
from app.api.dependencies import BookingServiceDependency
from app.api.responses import COMMON_ERROR_RESPONSES, problem_response
from app.schemas.contracts import Booking, CreateBookingRequest, CreateReviewRequest

router = APIRouter(prefix="/v1/bookings", tags=["Bookings"])
LIST_ERROR_RESPONSES = {
    status_code: response
    for status_code, response in COMMON_ERROR_RESPONSES.items()
    if status_code != 422
}


@router.get(
    "",
    operation_id="listBookings",
    response_model=list[Booking],
    responses=LIST_ERROR_RESPONSES,
)
def list_bookings(
    client_id: CurrentClientId,
    service: BookingServiceDependency,
) -> list[Booking]:
    return [Booking.model_validate(asdict(item)) for item in service.list_bookings(client_id)]


@router.post(
    "",
    operation_id="createBooking",
    response_model=Booking,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {
            "description": "Бронь создана либо воспроизведена.",
            "headers": {
                "Idempotency-Replayed": {
                    "description": "Возвращён ли сохранённый результат повтора.",
                    "schema": {"type": "boolean"},
                }
            },
        },
        404: problem_response("Класс не найден."),
        409: problem_response("Бронь конфликтует с текущим состоянием."),
        410: problem_response("Класс отменён студией."),
        **COMMON_ERROR_RESPONSES,
    },
)
def create_booking(
    payload: CreateBookingRequest,
    idempotency_key: Annotated[UUID, Header(alias="Idempotency-Key")],
    client_id: CurrentClientId,
    service: BookingServiceDependency,
    response: Response,
) -> Booking:
    result = service.create_booking(
        client_id,
        idempotency_key,
        payload.class_id,
        payload.equipment_option.value,
        payload.allergy_notes,
    )
    response.headers["Idempotency-Replayed"] = str(result.replayed).lower()
    return Booking.model_validate(asdict(result.booking))


@router.post(
    "/{bookingId}/cancel",
    operation_id="cancelBooking",
    response_model=Booking,
    responses={
        404: problem_response("Бронь не найдена."),
        409: problem_response("Отмена недоступна."),
        **COMMON_ERROR_RESPONSES,
    },
)
def cancel_booking(
    booking_id: Annotated[UUID, Path(alias="bookingId")],
    client_id: CurrentClientId,
    service: BookingServiceDependency,
) -> Booking:
    return Booking.model_validate(asdict(service.cancel_booking(client_id, booking_id)))


@router.post(
    "/{bookingId}/review",
    operation_id="createReview",
    response_model=Booking,
    status_code=status.HTTP_201_CREATED,
    responses={
        404: problem_response("Бронь не найдена."),
        409: problem_response("Эту запись нельзя оценить."),
        **COMMON_ERROR_RESPONSES,
    },
)
def create_review(
    booking_id: Annotated[UUID, Path(alias="bookingId")],
    payload: CreateReviewRequest,
    client_id: CurrentClientId,
    service: BookingServiceDependency,
) -> Booking:
    return Booking.model_validate(
        asdict(service.create_review(client_id, booking_id, payload.rating, payload.comment))
    )
