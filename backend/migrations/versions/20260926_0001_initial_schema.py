"""Create the initial Chef Table schema.

Revision ID: 20260926_0001
Revises:
Create Date: 2026-09-26
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260926_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "clients",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("phone", sa.String(length=16), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("char_length(name) BETWEEN 1 AND 100", name="name_length"),
        sa.CheckConstraint(
            "phone ~ '^\\+[1-9][0-9]{1,14}$'",
            name="phone_e164",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_clients"),
        sa.UniqueConstraint("phone", name="uq_clients_phone"),
    )
    op.create_table(
        "chefs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("role", sa.String(length=100), nullable=False),
        sa.Column("rating", sa.Numeric(precision=2, scale=1), nullable=False),
        sa.Column("initials", sa.String(length=4), nullable=False),
        sa.CheckConstraint("char_length(name) BETWEEN 1 AND 100", name="name_length"),
        sa.CheckConstraint("char_length(role) BETWEEN 1 AND 100", name="role_length"),
        sa.CheckConstraint("char_length(initials) BETWEEN 1 AND 4", name="initials_length"),
        sa.CheckConstraint("rating BETWEEN 0 AND 5", name="rating_range"),
        sa.PrimaryKeyConstraint("id", name="pk_chefs"),
    )
    op.create_table(
        "programs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("level", sa.String(length=16), nullable=False),
        sa.Column("dishes", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.CheckConstraint("char_length(title) BETWEEN 1 AND 160", name="title_length"),
        sa.CheckConstraint("char_length(description) <= 2000", name="description_length"),
        sa.CheckConstraint(
            "level IN ('beginner', 'advanced')",
            name="level_value",
        ),
        sa.CheckConstraint(
            "jsonb_typeof(dishes) = 'array' AND jsonb_array_length(dishes) > 0",
            name="dishes_non_empty_array",
        ),
        sa.CheckConstraint("duration_minutes > 0", name="duration_positive"),
        sa.PrimaryKeyConstraint("id", name="pk_programs"),
    )
    op.create_table(
        "cooking_classes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("program_id", sa.Uuid(), nullable=False),
        sa.Column("chef_id", sa.Uuid(), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("available_seats", sa.Integer(), nullable=False),
        sa.Column("rental_kits_capacity", sa.Integer(), nullable=False),
        sa.Column("available_rental_kits", sa.Integer(), nullable=False),
        sa.Column("price_kopecks", sa.Integer(), nullable=False),
        sa.Column("rental_price_kopecks", sa.Integer(), nullable=False),
        sa.Column("address", sa.String(length=300), nullable=False),
        sa.Column("eyebrow", sa.String(length=80), nullable=False),
        sa.Column("accent", sa.String(length=7), nullable=False),
        sa.Column("soft_accent", sa.String(length=7), nullable=False),
        sa.Column("cancellation_reason", sa.String(length=500), nullable=True),
        sa.CheckConstraint(
            "status IN ('scheduled', 'completed', 'cancelled')",
            name="status_value",
        ),
        sa.CheckConstraint("capacity > 0", name="capacity_positive"),
        sa.CheckConstraint(
            "available_seats BETWEEN 0 AND capacity",
            name="available_seats_range",
        ),
        sa.CheckConstraint(
            "rental_kits_capacity >= 0",
            name="rental_capacity_non_negative",
        ),
        sa.CheckConstraint(
            "available_rental_kits BETWEEN 0 AND rental_kits_capacity",
            name="available_rental_kits_range",
        ),
        sa.CheckConstraint(
            "price_kopecks >= 0 AND rental_price_kopecks >= 0",
            name="prices_non_negative",
        ),
        sa.CheckConstraint(
            "char_length(address) BETWEEN 1 AND 300",
            name="address_length",
        ),
        sa.CheckConstraint(
            "char_length(eyebrow) <= 80",
            name="eyebrow_length",
        ),
        sa.CheckConstraint("accent ~ '^#[0-9A-Fa-f]{6}$'", name="accent_hex"),
        sa.CheckConstraint(
            "soft_accent ~ '^#[0-9A-Fa-f]{6}$'",
            name="soft_accent_hex",
        ),
        sa.CheckConstraint(
            "(status = 'cancelled' AND cancellation_reason IS NOT NULL "
            "AND char_length(cancellation_reason) BETWEEN 1 AND 500) OR "
            "(status <> 'cancelled' AND cancellation_reason IS NULL)",
            name="cancellation_reason_status",
        ),
        sa.ForeignKeyConstraint(
            ["chef_id"],
            ["chefs.id"],
            name="fk_cooking_classes_chef_id_chefs",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["program_id"],
            ["programs.id"],
            name="fk_cooking_classes_program_id_programs",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_cooking_classes"),
    )
    op.create_index("ix_cooking_classes_chef_id", "cooking_classes", ["chef_id"])
    op.create_index("ix_cooking_classes_program_id", "cooking_classes", ["program_id"])
    op.create_index("ix_cooking_classes_starts_at", "cooking_classes", ["starts_at"])
    op.create_index("ix_cooking_classes_status", "cooking_classes", ["status"])
    op.create_table(
        "bookings",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("client_id", sa.Uuid(), nullable=False),
        sa.Column("class_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("equipment_option", sa.String(length=16), nullable=False),
        sa.Column("allergy_notes", sa.String(length=300), nullable=False),
        sa.Column("total_price_kopecks", sa.Integer(), nullable=False),
        sa.Column("studio_cancellation_reason", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status IN ('confirmed', 'attended', 'cancelled_by_client', 'cancelled_by_studio')",
            name="status_value",
        ),
        sa.CheckConstraint(
            "equipment_option IN ('own', 'rental')",
            name="equipment_value",
        ),
        sa.CheckConstraint(
            "char_length(allergy_notes) <= 300",
            name="allergy_notes_length",
        ),
        sa.CheckConstraint(
            "total_price_kopecks >= 0",
            name="total_price_non_negative",
        ),
        sa.CheckConstraint(
            "(status = 'cancelled_by_studio' AND studio_cancellation_reason IS NOT NULL "
            "AND char_length(studio_cancellation_reason) BETWEEN 1 AND 500) OR "
            "(status <> 'cancelled_by_studio' AND studio_cancellation_reason IS NULL)",
            name="studio_cancellation_reason_status",
        ),
        sa.ForeignKeyConstraint(
            ["class_id"],
            ["cooking_classes.id"],
            name="fk_bookings_class_id_cooking_classes",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["client_id"],
            ["clients.id"],
            name="fk_bookings_client_id_clients",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_bookings"),
    )
    op.create_index("ix_bookings_class_id", "bookings", ["class_id"])
    op.create_index("ix_bookings_client_id", "bookings", ["client_id"])
    op.create_index("ix_bookings_status", "bookings", ["status"])
    op.create_index(
        "uq_bookings_active_client_class",
        "bookings",
        ["client_id", "class_id"],
        unique=True,
        postgresql_where=sa.text("status = 'confirmed'"),
    )
    op.create_table(
        "reviews",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("booking_id", sa.Uuid(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("rating BETWEEN 1 AND 5", name="rating_range"),
        sa.CheckConstraint(
            "comment IS NULL OR char_length(comment) <= 500",
            name="comment_length",
        ),
        sa.ForeignKeyConstraint(
            ["booking_id"],
            ["bookings.id"],
            name="fk_reviews_booking_id_bookings",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_reviews"),
        sa.UniqueConstraint("booking_id", name="uq_reviews_booking_id"),
    )
    op.create_table(
        "push_tokens",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("client_id", sa.Uuid(), nullable=False),
        sa.Column("token", sa.String(length=4096), nullable=False),
        sa.Column("platform", sa.String(length=16), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "char_length(token) BETWEEN 1 AND 4096",
            name="token_length",
        ),
        sa.CheckConstraint(
            "platform IN ('android', 'ios')",
            name="platform_value",
        ),
        sa.ForeignKeyConstraint(
            ["client_id"],
            ["clients.id"],
            name="fk_push_tokens_client_id_clients",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_push_tokens"),
        sa.UniqueConstraint("token", name="uq_push_tokens_token"),
    )
    op.create_index("ix_push_tokens_client_id", "push_tokens", ["client_id"])
    op.create_table(
        "idempotency_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("client_id", sa.Uuid(), nullable=False),
        sa.Column("key", sa.Uuid(), nullable=False),
        sa.Column("request_hash", sa.String(length=64), nullable=False),
        sa.Column("response_status", sa.Integer(), nullable=False),
        sa.Column("response_body", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "request_hash ~ '^[0-9a-f]{64}$'",
            name="request_hash_sha256",
        ),
        sa.CheckConstraint(
            "response_status BETWEEN 100 AND 599",
            name="response_status_range",
        ),
        sa.ForeignKeyConstraint(
            ["client_id"],
            ["clients.id"],
            name="fk_idempotency_records_client_id_clients",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_idempotency_records"),
        sa.UniqueConstraint(
            "client_id",
            "key",
            name="uq_idempotency_records_client_key",
        ),
    )
    op.create_index("ix_idempotency_records_client_id", "idempotency_records", ["client_id"])


def downgrade() -> None:
    op.drop_index("ix_idempotency_records_client_id", table_name="idempotency_records")
    op.drop_table("idempotency_records")
    op.drop_index("ix_push_tokens_client_id", table_name="push_tokens")
    op.drop_table("push_tokens")
    op.drop_table("reviews")
    op.drop_index(
        "uq_bookings_active_client_class",
        table_name="bookings",
        postgresql_where=sa.text("status = 'confirmed'"),
    )
    op.drop_index("ix_bookings_status", table_name="bookings")
    op.drop_index("ix_bookings_client_id", table_name="bookings")
    op.drop_index("ix_bookings_class_id", table_name="bookings")
    op.drop_table("bookings")
    op.drop_index("ix_cooking_classes_status", table_name="cooking_classes")
    op.drop_index("ix_cooking_classes_starts_at", table_name="cooking_classes")
    op.drop_index("ix_cooking_classes_program_id", table_name="cooking_classes")
    op.drop_index("ix_cooking_classes_chef_id", table_name="cooking_classes")
    op.drop_table("cooking_classes")
    op.drop_table("programs")
    op.drop_table("chefs")
    op.drop_table("clients")
