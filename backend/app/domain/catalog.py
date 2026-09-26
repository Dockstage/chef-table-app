from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True, slots=True)
class ChefDetails:
    id: UUID
    name: str
    role: str
    rating: float
    initials: str


@dataclass(frozen=True, slots=True)
class CookingClassDetails:
    id: UUID
    title: str
    eyebrow: str
    description: str
    dishes: list[str]
    level: str
    chef: ChefDetails
    starts_at: datetime
    duration_minutes: int
    status: str
    capacity: int
    available_seats: int
    price_kopecks: int
    rental_price_kopecks: int
    available_rental_kits: int
    address: str
    accent: str
    soft_accent: str
    cancellation_reason: str | None
