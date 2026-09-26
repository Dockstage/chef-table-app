from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Chef(Base):
    __tablename__ = "chefs"
    __table_args__ = (
        CheckConstraint("char_length(name) BETWEEN 1 AND 100", name="name_length"),
        CheckConstraint("char_length(role) BETWEEN 1 AND 100", name="role_length"),
        CheckConstraint("char_length(initials) BETWEEN 1 AND 4", name="initials_length"),
        CheckConstraint("rating BETWEEN 0 AND 5", name="rating_range"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(100))
    rating: Mapped[Decimal] = mapped_column(Numeric(2, 1))
    initials: Mapped[str] = mapped_column(String(4))


class Program(Base):
    __tablename__ = "programs"
    __table_args__ = (
        CheckConstraint("char_length(title) BETWEEN 1 AND 160", name="title_length"),
        CheckConstraint("char_length(description) <= 2000", name="description_length"),
        CheckConstraint("level IN ('beginner', 'advanced')", name="level_value"),
        CheckConstraint(
            "jsonb_typeof(dishes) = 'array' AND jsonb_array_length(dishes) > 0",
            name="dishes_non_empty_array",
        ),
        CheckConstraint("duration_minutes > 0", name="duration_positive"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text)
    level: Mapped[str] = mapped_column(String(16))
    dishes: Mapped[list[str]] = mapped_column(JSONB)
    duration_minutes: Mapped[int] = mapped_column(Integer)


class CookingClass(Base):
    __tablename__ = "cooking_classes"
    __table_args__ = (
        CheckConstraint(
            "status IN ('scheduled', 'completed', 'cancelled')",
            name="status_value",
        ),
        CheckConstraint("capacity > 0", name="capacity_positive"),
        CheckConstraint(
            "available_seats BETWEEN 0 AND capacity",
            name="available_seats_range",
        ),
        CheckConstraint("rental_kits_capacity >= 0", name="rental_capacity_non_negative"),
        CheckConstraint(
            "available_rental_kits BETWEEN 0 AND rental_kits_capacity",
            name="available_rental_kits_range",
        ),
        CheckConstraint(
            "price_kopecks >= 0 AND rental_price_kopecks >= 0",
            name="prices_non_negative",
        ),
        CheckConstraint("char_length(address) BETWEEN 1 AND 300", name="address_length"),
        CheckConstraint("char_length(eyebrow) <= 80", name="eyebrow_length"),
        CheckConstraint("accent ~ '^#[0-9A-Fa-f]{6}$'", name="accent_hex"),
        CheckConstraint("soft_accent ~ '^#[0-9A-Fa-f]{6}$'", name="soft_accent_hex"),
        CheckConstraint(
            "(status = 'cancelled' AND cancellation_reason IS NOT NULL "
            "AND char_length(cancellation_reason) BETWEEN 1 AND 500) OR "
            "(status <> 'cancelled' AND cancellation_reason IS NULL)",
            name="cancellation_reason_status",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    program_id: Mapped[UUID] = mapped_column(
        ForeignKey("programs.id", ondelete="RESTRICT"),
        index=True,
    )
    chef_id: Mapped[UUID] = mapped_column(
        ForeignKey("chefs.id", ondelete="RESTRICT"),
        index=True,
    )
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    status: Mapped[str] = mapped_column(String(16), index=True)
    capacity: Mapped[int] = mapped_column(Integer)
    available_seats: Mapped[int] = mapped_column(Integer)
    rental_kits_capacity: Mapped[int] = mapped_column(Integer)
    available_rental_kits: Mapped[int] = mapped_column(Integer)
    price_kopecks: Mapped[int] = mapped_column(Integer)
    rental_price_kopecks: Mapped[int] = mapped_column(Integer)
    address: Mapped[str] = mapped_column(String(300))
    eyebrow: Mapped[str] = mapped_column(String(80))
    accent: Mapped[str] = mapped_column(String(7))
    soft_accent: Mapped[str] = mapped_column(String(7))
    cancellation_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
