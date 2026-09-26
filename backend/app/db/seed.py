from collections.abc import Sequence

from sqlalchemy import Table, func, select
from sqlalchemy.dialects.postgresql import insert

from app.db.models import (
    Booking,
    Chef,
    Client,
    CookingClass,
    IdempotencyRecord,
    Program,
    PushToken,
    Review,
)
from app.db.seed_data import build_seed_data
from app.db.session import create_database_engine

SEED_TABLES: Sequence[tuple[str, Table]] = (
    ("clients", Client.__table__),
    ("chefs", Chef.__table__),
    ("programs", Program.__table__),
    ("cooking_classes", CookingClass.__table__),
    ("bookings", Booking.__table__),
    ("reviews", Review.__table__),
    ("push_tokens", PushToken.__table__),
    ("idempotency_records", IdempotencyRecord.__table__),
)


def _upsert_rows(connection: object, table: Table, rows: list[dict[str, object]]) -> None:
    statement = insert(table).values(rows)
    primary_key_names = {column.name for column in table.primary_key.columns}
    updates = {
        column.name: getattr(statement.excluded, column.name)
        for column in table.columns
        if column.name not in primary_key_names
    }
    connection.execute(
        statement.on_conflict_do_update(
            index_elements=list(table.primary_key.columns),
            set_=updates,
        )
    )


def seed_database() -> dict[str, int]:
    data = build_seed_data()
    counts: dict[str, int] = {}
    engine = create_database_engine()

    with engine.begin() as connection:
        for name, table in SEED_TABLES:
            _upsert_rows(connection, table, data[name])
            counts[name] = connection.scalar(select(func.count()).select_from(table)) or 0

    engine.dispose()
    return counts


def main() -> None:
    counts = seed_database()
    summary = ", ".join(f"{name}={count}" for name, count in counts.items())
    print(f"Seed complete: {summary}")


if __name__ == "__main__":
    main()
