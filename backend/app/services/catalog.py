from datetime import datetime
from uuid import UUID

from app.domain.catalog import CookingClassDetails
from app.domain.errors import CookingClassNotFoundError, InvalidDateRangeError
from app.repositories.catalog import CatalogRepository


class CatalogService:
    def __init__(self, repository: CatalogRepository) -> None:
        self._repository = repository

    def list_classes(
        self,
        starts_from: datetime,
        starts_to: datetime,
        level: str | None,
    ) -> list[CookingClassDetails]:
        if starts_from >= starts_to:
            raise InvalidDateRangeError
        classes = self._repository.list_classes(starts_from, starts_to, level)
        return sorted(classes, key=lambda item: (item.starts_at, item.id))

    def get_class(self, class_id: UUID) -> CookingClassDetails:
        cooking_class = self._repository.get_class(class_id)
        if cooking_class is None:
            raise CookingClassNotFoundError
        return cooking_class
