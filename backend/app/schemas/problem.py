from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


def _to_camel(value: str) -> str:
    head, *tail = value.split("_")
    return head + "".join(part.capitalize() for part in tail)


class ProblemCode(StrEnum):
    INVALID_DATE_RANGE = "INVALID_DATE_RANGE"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    UNAUTHORIZED = "UNAUTHORIZED"
    NOT_FOUND = "NOT_FOUND"
    METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED"
    CLASS_NOT_FOUND = "CLASS_NOT_FOUND"
    BOOKING_NOT_FOUND = "BOOKING_NOT_FOUND"
    SLOT_FULL = "SLOT_FULL"
    SLOT_CANCELLED = "SLOT_CANCELLED"
    SLOT_NOT_BOOKABLE = "SLOT_NOT_BOOKABLE"
    DUPLICATE_BOOKING = "DUPLICATE_BOOKING"
    RENTAL_UNAVAILABLE = "RENTAL_UNAVAILABLE"
    IDEMPOTENCY_CONFLICT = "IDEMPOTENCY_CONFLICT"
    CANCELLATION_CLOSED = "CANCELLATION_CLOSED"
    BOOKING_NOT_ACTIVE = "BOOKING_NOT_ACTIVE"
    REVIEW_NOT_ALLOWED = "REVIEW_NOT_ALLOWED"
    RATE_LIMITED = "RATE_LIMITED"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"


class FieldError(BaseModel):
    model_config = ConfigDict(
        alias_generator=lambda value: _to_camel(value),
        populate_by_name=True,
        extra="forbid",
    )

    field: str
    message: str


class Problem(BaseModel):
    model_config = ConfigDict(
        alias_generator=lambda value: _to_camel(value),
        populate_by_name=True,
        extra="forbid",
    )

    status: int = Field(ge=400, le=599)
    code: ProblemCode
    message: str = Field(min_length=1, max_length=500)
    trace_id: str | None = None
    field_errors: list[FieldError] | None = None
