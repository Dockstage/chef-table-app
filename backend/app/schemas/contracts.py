from datetime import datetime
from enum import StrEnum
from typing import Annotated, Literal
from uuid import UUID

from pydantic import AwareDatetime, Field, StringConstraints

from app.schemas.base import ContractModel

ShortText = Annotated[str, StringConstraints(min_length=1)]
Name = Annotated[str, StringConstraints(min_length=1, max_length=100)]
Dish = Annotated[str, StringConstraints(min_length=1, max_length=160)]
HexColor = Annotated[str, StringConstraints(pattern=r"^#[0-9A-Fa-f]{6}$")]


class Level(StrEnum):
    BEGINNER = "beginner"
    ADVANCED = "advanced"


class ClassStatus(StrEnum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class BookingStatus(StrEnum):
    CONFIRMED = "confirmed"
    ATTENDED = "attended"
    CANCELLED_BY_CLIENT = "cancelled_by_client"
    CANCELLED_BY_STUDIO = "cancelled_by_studio"


class EquipmentOption(StrEnum):
    OWN = "own"
    RENTAL = "rental"


class PushPlatform(StrEnum):
    ANDROID = "android"
    IOS = "ios"


class Chef(ContractModel):
    id: UUID
    name: Name
    role: Name
    rating: float = Field(ge=0, le=5)
    initials: str = Field(min_length=1, max_length=4)


class CookingClass(ContractModel):
    id: UUID
    title: str = Field(min_length=1, max_length=160)
    eyebrow: str = Field(max_length=80)
    description: str = Field(max_length=2000)
    dishes: list[Dish] = Field(min_length=1)
    level: Level
    chef: Chef
    starts_at: AwareDatetime
    duration_minutes: int = Field(ge=1)
    status: ClassStatus
    capacity: int = Field(ge=1)
    available_seats: int = Field(ge=0)
    price_kopecks: int = Field(ge=0)
    rental_price_kopecks: int = Field(ge=0)
    available_rental_kits: int = Field(ge=0)
    address: str = Field(min_length=1, max_length=300)
    accent: HexColor
    soft_accent: HexColor
    cancellation_reason: str | None = Field(max_length=500)


class CreateBookingRequest(ContractModel):
    class_id: UUID
    equipment_option: EquipmentOption
    allergy_notes: str = Field(max_length=300)


class Booking(ContractModel):
    id: UUID
    class_id: UUID
    status: BookingStatus
    equipment_option: EquipmentOption
    allergy_notes: str = Field(max_length=300)
    total_price_kopecks: int = Field(ge=0)
    created_at: datetime
    studio_cancellation_reason: str | None = Field(max_length=500)
    rating: int | None = Field(ge=1, le=5)
    review_comment: str | None = Field(max_length=500)


class CreateReviewRequest(ContractModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=500)


class PushTokenRequest(ContractModel):
    token: str = Field(min_length=1, max_length=4096)
    platform: PushPlatform


class ClassCancellationPush(ContractModel):
    type: Literal["class_cancelled"]
    booking_id: UUID
    reason: str = Field(min_length=1, max_length=500)
