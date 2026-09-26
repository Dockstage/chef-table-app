from dataclasses import asdict
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Path, Query
from pydantic import AwareDatetime

from app.api.auth import CurrentClientId
from app.api.dependencies import CatalogServiceDependency
from app.api.responses import COMMON_ERROR_RESPONSES, problem_response
from app.schemas.contracts import CookingClass, Level

router = APIRouter(prefix="/v1/classes", tags=["Classes"])


@router.get(
    "",
    operation_id="listClasses",
    response_model=list[CookingClass],
    responses={
        400: problem_response("Диапазон дат некорректен."),
        **COMMON_ERROR_RESPONSES,
    },
)
def list_classes(
    starts_from: Annotated[AwareDatetime, Query(alias="from")],
    starts_to: Annotated[AwareDatetime, Query(alias="to")],
    _client_id: CurrentClientId,
    service: CatalogServiceDependency,
    level: Annotated[Level, Query()] = None,
) -> list[CookingClass]:
    classes = service.list_classes(starts_from, starts_to, level.value if level else None)
    return [CookingClass.model_validate(asdict(item)) for item in classes]


@router.get(
    "/{classId}",
    operation_id="getClass",
    response_model=CookingClass,
    responses={
        404: problem_response("Класс не найден."),
        **COMMON_ERROR_RESPONSES,
    },
)
def get_class(
    class_id: Annotated[UUID, Path(alias="classId")],
    _client_id: CurrentClientId,
    service: CatalogServiceDependency,
) -> CookingClass:
    return CookingClass.model_validate(asdict(service.get_class(class_id)))
