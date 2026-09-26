from typing import Any

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi


def configure_openapi(application: FastAPI) -> None:
    def custom_openapi() -> dict[str, Any]:
        if application.openapi_schema is not None:
            return application.openapi_schema

        schema = get_openapi(
            title=application.title,
            version=application.version,
            description=application.description,
            routes=application.routes,
        )
        for path_item in schema.get("paths", {}).values():
            for operation in path_item.values():
                if not isinstance(operation, dict):
                    continue
                for response in operation.get("responses", {}).values():
                    content = response.get("content", {})
                    problem = content.get("application/problem+json")
                    regular_json = content.get("application/json")
                    if problem is not None and problem == regular_json:
                        content.pop("application/json")

        application.openapi_schema = schema
        return schema

    application.openapi = custom_openapi
