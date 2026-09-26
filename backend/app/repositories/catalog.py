from datetime import datetime
from typing import Protocol
from uuid import UUID

from app.domain.catalog import CookingClassDetails


class CatalogRepository(Protocol):
    def list_classes(
        self,
        starts_from: datetime,
        starts_to: datetime,
        level: str | None,
    ) -> list[CookingClassDetails]: ...

    def get_class(self, class_id: UUID) -> CookingClassDetails | None: ...
