from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint(
            "status IN ('confirmed', 'attended', 'cancelled_by_client', 'cancelled_by_studio')",
            name="status_value",
        ),
        CheckConstraint("equipment_option IN ('own', 'rental')", name="equipment_value"),
        CheckConstraint("char_length(allergy_notes) <= 300", name="allergy_notes_length"),
        CheckConstraint("total_price_kopecks >= 0", name="total_price_non_negative"),
        CheckConstraint(
            "(status = 'cancelled_by_studio' AND studio_cancellation_reason IS NOT NULL "
            "AND char_length(studio_cancellation_reason) BETWEEN 1 AND 500) OR "
            "(status <> 'cancelled_by_studio' AND studio_cancellation_reason IS NULL)",
            name="studio_cancellation_reason_status",
        ),
        Index(
            "uq_bookings_active_client_class",
            "client_id",
            "class_id",
            unique=True,
            postgresql_where=text("status = 'confirmed'"),
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    client_id: Mapped[UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="RESTRICT"),
        index=True,
    )
    class_id: Mapped[UUID] = mapped_column(
        ForeignKey("cooking_classes.id", ondelete="RESTRICT"),
        index=True,
    )
    status: Mapped[str] = mapped_column(String(32), index=True)
    equipment_option: Mapped[str] = mapped_column(String(16))
    allergy_notes: Mapped[str] = mapped_column(String(300))
    total_price_kopecks: Mapped[int] = mapped_column(Integer)
    studio_cancellation_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="rating_range"),
        CheckConstraint("comment IS NULL OR char_length(comment) <= 500", name="comment_length"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    booking_id: Mapped[UUID] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"),
        unique=True,
    )
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
