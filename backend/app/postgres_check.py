from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import UUID

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, delete, func, select, text
from sqlalchemy.engine import URL, Engine
from sqlalchemy.orm import Session

from app.db.models import Booking, CookingClass, IdempotencyRecord, PushToken, Review
from app.db.repositories.bookings import SqlAlchemyBookingRepository
from app.db.repositories.push_tokens import SqlAlchemyPushTokenRepository
from app.db.seed import seed_database
from app.db.seed_data import CHEF_IDS, CLIENT_ID, PROGRAM_IDS
from app.db.session import create_database_engine
from app.domain.errors import (
    BookingNotActiveError,
    IdempotencyConflictError,
    ReviewNotAllowedError,
    SlotFullError,
)
from app.services.bookings import BookingService
from app.services.push_tokens import PushTokenService

CLASS_ID = UUID("2f000000-0000-4000-8000-000000000080")
ATTENDED_BOOKING_ID = UUID("3f000000-0000-4000-8000-000000000080")
CREATE_KEYS = (
    UUID("4f000000-0000-4000-8000-000000000080"),
    UUID("4f000000-0000-4000-8000-000000000081"),
)
PUSH_TOKEN = "chef-table-postgres-check-token"


def _create_test_database(source_url: URL) -> tuple[URL, Engine]:
    database_name = f"{source_url.database}_check"
    if not database_name.replace("_", "").isalnum():
        raise ValueError("Unsafe PostgreSQL check database name")
    admin_engine = create_engine(
        source_url.set(database="postgres"),
        isolation_level="AUTOCOMMIT",
    )
    with admin_engine.connect() as connection:
        connection.execute(
            text("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=:name"),
            {"name": database_name},
        )
        connection.execute(text(f'DROP DATABASE IF EXISTS "{database_name}"'))
        connection.execute(text(f'CREATE DATABASE "{database_name}"'))
    return source_url.set(database=database_name), admin_engine


def _migrate(database_url: URL) -> None:
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    config.attributes["database_url"] = database_url.render_as_string(hide_password=False)
    command.upgrade(config, "head")


def _drop_test_database(database_url: URL, admin_engine: Engine) -> None:
    with admin_engine.connect() as connection:
        connection.execute(
            text("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=:name"),
            {"name": database_url.database},
        )
        connection.execute(text(f'DROP DATABASE IF EXISTS "{database_url.database}"'))
    admin_engine.dispose()


def _cleanup(engine: Engine) -> None:
    with Session(engine) as session, session.begin():
        session.execute(delete(Review).where(Review.booking_id == ATTENDED_BOOKING_ID))
        session.execute(delete(IdempotencyRecord).where(IdempotencyRecord.key.in_(CREATE_KEYS)))
        session.execute(delete(PushToken).where(PushToken.token == PUSH_TOKEN))
        session.execute(delete(Booking).where(Booking.class_id == CLASS_ID))
        session.execute(delete(CookingClass).where(CookingClass.id == CLASS_ID))


def _setup_class(engine: Engine) -> None:
    with Session(engine) as session, session.begin():
        session.add(
            CookingClass(
                id=CLASS_ID,
                program_id=PROGRAM_IDS[0],
                chef_id=CHEF_IDS[0],
                starts_at=datetime.now(UTC) + timedelta(days=5),
                status="scheduled",
                capacity=1,
                available_seats=1,
                rental_kits_capacity=1,
                available_rental_kits=1,
                price_kopecks=450_000,
                rental_price_kopecks=40_000,
                address="PostgreSQL check",
                eyebrow="Concurrency check",
                accent="#C64F33",
                soft_accent="#F7DDD3",
                cancellation_reason=None,
            )
        )


def _booking_service(engine: Engine) -> tuple[Session, BookingService]:
    session = Session(engine)
    return session, BookingService(SqlAlchemyBookingRepository(session))


def _create(engine: Engine, key: UUID):
    session, service = _booking_service(engine)
    try:
        return key, service.create_booking(CLIENT_ID, key, CLASS_ID, "rental", "")
    finally:
        session.close()


def _cancel(engine: Engine, booking_id: UUID):
    session, service = _booking_service(engine)
    try:
        return service.cancel_booking(CLIENT_ID, booking_id)
    finally:
        session.close()


def _review(engine: Engine):
    session, service = _booking_service(engine)
    try:
        return service.create_review(CLIENT_ID, ATTENDED_BOOKING_ID, 5, "PostgreSQL check")
    finally:
        session.close()


def _parallel(function, arguments: tuple[object, object]) -> tuple[list[object], list[Exception]]:
    results: list[object] = []
    errors: list[Exception] = []
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(function, argument) for argument in arguments]
        for future in as_completed(futures):
            try:
                results.append(future.result())
            except Exception as exception:  # noqa: BLE001 - the checker asserts exact types below
                errors.append(exception)
    return results, errors


def run_check() -> None:
    source_engine = create_database_engine()
    source_url = source_engine.url
    source_engine.dispose()
    test_url, admin_engine = _create_test_database(source_url)
    try:
        _migrate(test_url)
        engine = create_database_engine(test_url.render_as_string(hide_password=False))
    except Exception:
        _drop_test_database(test_url, admin_engine)
        raise
    try:
        seed_database(test_url.render_as_string(hide_password=False))
        _cleanup(engine)
        _setup_class(engine)

        created, create_errors = _parallel(lambda key: _create(engine, key), CREATE_KEYS)
        assert len(created) == 1
        assert len(create_errors) == 1 and isinstance(create_errors[0], SlotFullError)
        winning_key, created_result = created[0]
        booking_id = created_result.booking.id

        replay_session, replay_service = _booking_service(engine)
        try:
            replay = replay_service.create_booking(
                CLIENT_ID,
                winning_key,
                CLASS_ID,
                "rental",
                "",
            )
        finally:
            replay_session.close()
        assert replay.replayed

        conflict_session, conflict_service = _booking_service(engine)
        try:
            try:
                conflict_service.create_booking(
                    CLIENT_ID,
                    winning_key,
                    CLASS_ID,
                    "own",
                    "",
                )
            except IdempotencyConflictError:
                pass
            else:
                raise AssertionError("Expected IdempotencyConflictError")
        finally:
            conflict_session.close()

        cancelled, cancel_errors = _parallel(
            lambda current_id: _cancel(engine, current_id),
            (booking_id, booking_id),
        )
        assert len(cancelled) == 1
        assert len(cancel_errors) == 1 and isinstance(cancel_errors[0], BookingNotActiveError)

        with Session(engine) as session, session.begin():
            session.add(
                Booking(
                    id=ATTENDED_BOOKING_ID,
                    client_id=CLIENT_ID,
                    class_id=CLASS_ID,
                    status="attended",
                    equipment_option="own",
                    allergy_notes="",
                    total_price_kopecks=450_000,
                    studio_cancellation_reason=None,
                )
            )

        reviewed, review_errors = _parallel(lambda _: _review(engine), (1, 2))
        assert len(reviewed) == 1
        assert len(review_errors) == 1 and isinstance(review_errors[0], ReviewNotAllowedError)

        with Session(engine) as session:
            push_service = PushTokenService(SqlAlchemyPushTokenRepository(session))
            push_service.register(CLIENT_ID, PUSH_TOKEN, "android")
            push_service.register(CLIENT_ID, PUSH_TOKEN, "ios")

        with Session(engine) as session:
            cooking_class = session.get(CookingClass, CLASS_ID)
            assert cooking_class is not None
            assert cooking_class.available_seats == 1
            assert cooking_class.available_rental_kits == 1
            assert (
                session.scalar(
                    select(func.count())
                    .select_from(IdempotencyRecord)
                    .where(IdempotencyRecord.key.in_(CREATE_KEYS))
                )
                == 1
            )
            assert (
                session.scalar(
                    select(func.count())
                    .select_from(Review)
                    .where(Review.booking_id == ATTENDED_BOOKING_ID)
                )
                == 1
            )
            push_token = session.scalar(select(PushToken).where(PushToken.token == PUSH_TOKEN))
            assert push_token is not None and push_token.platform == "ios"

        print("PostgreSQL check passed: create/replay/cancel/review concurrency and push upsert")
    finally:
        engine.dispose()
        _drop_test_database(test_url, admin_engine)


if __name__ == "__main__":
    run_check()
