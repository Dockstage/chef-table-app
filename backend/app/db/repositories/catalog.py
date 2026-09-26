from datetime import datetime
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.db.models.catalog import Chef, CookingClass, Program
from app.domain.catalog import ChefDetails, CookingClassDetails


class SqlAlchemyCatalogRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def list_classes(
        self,
        starts_from: datetime,
        starts_to: datetime,
        level: str | None,
    ) -> list[CookingClassDetails]:
        statement = self._base_query().where(
            CookingClass.starts_at >= starts_from,
            CookingClass.starts_at < starts_to,
        )
        if level is not None:
            statement = statement.where(Program.level == level)
        statement = statement.order_by(CookingClass.starts_at, CookingClass.id)
        rows = self._session.execute(statement).all()
        return [
            self._to_details(cooking_class, program, chef) for cooking_class, program, chef in rows
        ]

    def get_class(self, class_id: UUID) -> CookingClassDetails | None:
        row = self._session.execute(
            self._base_query().where(CookingClass.id == class_id)
        ).one_or_none()
        if row is None:
            return None
        cooking_class, program, chef = row
        return self._to_details(cooking_class, program, chef)

    @staticmethod
    def _base_query() -> Select[tuple[CookingClass, Program, Chef]]:
        return (
            select(CookingClass, Program, Chef)
            .join(Program, CookingClass.program_id == Program.id)
            .join(Chef, CookingClass.chef_id == Chef.id)
        )

    @staticmethod
    def _to_details(
        cooking_class: CookingClass,
        program: Program,
        chef: Chef,
    ) -> CookingClassDetails:
        return CookingClassDetails(
            id=cooking_class.id,
            title=program.title,
            eyebrow=cooking_class.eyebrow,
            description=program.description,
            dishes=list(program.dishes),
            level=program.level,
            chef=ChefDetails(
                id=chef.id,
                name=chef.name,
                role=chef.role,
                rating=float(chef.rating),
                initials=chef.initials,
            ),
            starts_at=cooking_class.starts_at,
            duration_minutes=program.duration_minutes,
            status=cooking_class.status,
            capacity=cooking_class.capacity,
            available_seats=cooking_class.available_seats,
            price_kopecks=cooking_class.price_kopecks,
            rental_price_kopecks=cooking_class.rental_price_kopecks,
            available_rental_kits=cooking_class.available_rental_kits,
            address=cooking_class.address,
            accent=cooking_class.accent,
            soft_accent=cooking_class.soft_accent,
            cancellation_reason=cooking_class.cancellation_reason,
        )
