import argparse
import json
from collections.abc import Mapping
from copy import deepcopy
from enum import Enum
from pathlib import Path
from typing import Any

import yaml
from fastapi import FastAPI
from pydantic import BaseModel, TypeAdapter

from app.main import app
from app.schemas.contracts import (
    Booking,
    BookingStatus,
    Chef,
    ClassCancellationPush,
    ClassStatus,
    CookingClass,
    CreateBookingRequest,
    CreateReviewRequest,
    EquipmentOption,
    Level,
    PushPlatform,
    PushTokenRequest,
)
from app.schemas.problem import FieldError, Problem, ProblemCode

HTTP_METHODS = {"get", "post", "put", "patch", "delete"}
OUTSIDE_CONTRACT_OPERATIONS = {"healthCheck"}
DTO_TYPES: Mapping[str, type[BaseModel] | type[Enum]] = {
    "Level": Level,
    "ClassStatus": ClassStatus,
    "BookingStatus": BookingStatus,
    "EquipmentOption": EquipmentOption,
    "PushPlatform": PushPlatform,
    "Chef": Chef,
    "CookingClass": CookingClass,
    "CreateBookingRequest": CreateBookingRequest,
    "Booking": Booking,
    "CreateReviewRequest": CreateReviewRequest,
    "PushTokenRequest": PushTokenRequest,
    "FieldError": FieldError,
    "ProblemCode": ProblemCode,
    "Problem": Problem,
    "ClassCancellationPush": ClassCancellationPush,
}


def load_yaml(path: Path) -> dict[str, Any]:
    document = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(document, dict):
        raise ValueError(f"{path} must contain an OpenAPI object")
    return document


def load_gaps(path: Path) -> dict[str, dict[str, str]]:
    document = json.loads(path.read_text(encoding="utf-8"))
    gaps = document.get("missingOperations")
    if not isinstance(gaps, dict):
        raise ValueError(f"{path} must contain missingOperations")
    if not all(
        isinstance(operation_id, str) and isinstance(gap, dict)
        for operation_id, gap in gaps.items()
    ):
        raise ValueError(f"{path} contains an invalid operation gap")
    return gaps


def normalize_schema(schema: Any) -> Any:
    if isinstance(schema, list):
        return [normalize_schema(item) for item in schema]
    if not isinstance(schema, dict):
        return schema

    if "$ref" in schema:
        return {"$ref": str(schema["$ref"]).rsplit("/", 1)[-1]}

    if "anyOf" in schema:
        branches = [normalize_schema(item) for item in schema["anyOf"]]
        null_branches = [item for item in branches if item == {"type": "null"}]
        non_null = [item for item in branches if item != {"type": "null"}]
        if len(null_branches) == 1 and len(non_null) == 1 and "type" in non_null[0]:
            merged = deepcopy(non_null[0])
            current_type = merged["type"]
            merged["type"] = sorted(
                [*current_type, "null"]
                if isinstance(current_type, list)
                else [current_type, "null"]
            )
            return merged

    ignored = {"$defs", "default", "description", "examples", "title"}
    normalized = {
        key: normalize_schema(value) for key, value in schema.items() if key not in ignored
    }
    if isinstance(normalized.get("type"), list):
        normalized["type"] = sorted(normalized["type"])
    if isinstance(normalized.get("required"), list):
        normalized["required"] = sorted(normalized["required"])
    return normalized


def generated_schema(schema_type: type[BaseModel] | type[Enum]) -> dict[str, Any]:
    if issubclass(schema_type, BaseModel):
        return schema_type.model_json_schema(by_alias=True, mode="serialization")
    return TypeAdapter(schema_type).json_schema()


def compare_dto_schemas(contract: Mapping[str, Any]) -> list[str]:
    issues: list[str] = []
    canonical_schemas = contract.get("components", {}).get("schemas", {})
    unexpected = set(canonical_schemas) - set(DTO_TYPES)
    missing = set(DTO_TYPES) - set(canonical_schemas)
    if unexpected or missing:
        issues.append(
            f"DTO inventory differs: canonical_only={sorted(unexpected)}, "
            f"pydantic_only={sorted(missing)}"
        )
    for name, schema_type in DTO_TYPES.items():
        canonical = canonical_schemas.get(name)
        if canonical is None:
            issues.append(f"DTO {name}: schema is missing from canonical OpenAPI")
            continue
        actual = normalize_schema(generated_schema(schema_type))
        expected = normalize_schema(canonical)
        if actual != expected:
            issues.append(
                f"DTO {name}: Pydantic schema differs from canonical OpenAPI\n"
                f"expected={json.dumps(expected, ensure_ascii=False, sort_keys=True)}\n"
                f"actual={json.dumps(actual, ensure_ascii=False, sort_keys=True)}"
            )
    return issues


def resolve_local_ref(document: Mapping[str, Any], value: Mapping[str, Any]) -> Mapping[str, Any]:
    reference = value.get("$ref")
    if not isinstance(reference, str) or not reference.startswith("#/"):
        return value
    resolved: Any = document
    for part in reference[2:].split("/"):
        resolved = resolved[part]
    return resolved


def parameter_signature(
    document: Mapping[str, Any],
    parameters: list[Mapping[str, Any]],
) -> list[dict[str, Any]]:
    signature = []
    for parameter in parameters:
        resolved = resolve_local_ref(document, parameter)
        signature.append(
            {
                "in": resolved.get("in"),
                "name": resolved.get("name"),
                "required": bool(resolved.get("required", False)),
                "schema": normalize_schema(resolved.get("schema", {})),
            }
        )
    return sorted(signature, key=lambda item: (str(item["in"]), str(item["name"])))


def content_signature(content: Mapping[str, Any]) -> dict[str, Any]:
    return {
        media_type: normalize_schema(media.get("schema", {}))
        for media_type, media in content.items()
    }


def response_signature(
    document: Mapping[str, Any],
    responses: Mapping[str, Mapping[str, Any]],
) -> dict[str, Any]:
    signature: dict[str, Any] = {}
    for status, response in responses.items():
        resolved = resolve_local_ref(document, response)
        signature[str(status)] = {
            "content": content_signature(resolved.get("content", {})),
            "headers": {
                name: normalize_schema(header.get("schema", {}))
                for name, header in resolved.get("headers", {}).items()
            },
        }
    return signature


def security_signature(security: list[Mapping[str, list[str]]]) -> list[dict[str, list[str]]]:
    return sorted(
        (
            {name: sorted(scopes) for name, scopes in requirement.items()}
            for requirement in security
        ),
        key=lambda item: json.dumps(item, sort_keys=True),
    )


def collect_operations(document: Mapping[str, Any]) -> dict[str, dict[str, Any]]:
    operations: dict[str, dict[str, Any]] = {}
    for path, path_item in document.get("paths", {}).items():
        for method, operation in path_item.items():
            if method not in HTTP_METHODS or not isinstance(operation, dict):
                continue
            operation_id = operation.get("operationId")
            if not operation_id:
                continue
            if operation_id in operations:
                raise ValueError(f"duplicate operationId: {operation_id}")
            request_body = operation.get("requestBody")
            if request_body:
                resolved_body = resolve_local_ref(document, request_body)
                body_signature: dict[str, Any] | None = {
                    "required": bool(resolved_body.get("required", False)),
                    "content": content_signature(resolved_body.get("content", {})),
                }
            else:
                body_signature = None
            operations[operation_id] = {
                "method": method,
                "path": path.removeprefix("/v1"),
                "parameters": parameter_signature(
                    document,
                    [*path_item.get("parameters", []), *operation.get("parameters", [])],
                ),
                "requestBody": body_signature,
                "responses": response_signature(document, operation.get("responses", {})),
                "security": security_signature(
                    operation.get("security", document.get("security", []))
                ),
            }
    return operations


def compare_operations(
    contract: Mapping[str, Any],
    gaps: Mapping[str, Mapping[str, str]],
    application: FastAPI,
) -> list[str]:
    issues: list[str] = []
    canonical = collect_operations(contract)
    runtime = collect_operations(application.openapi())
    runtime = {
        operation_id: signature
        for operation_id, signature in runtime.items()
        if operation_id not in OUTSIDE_CONTRACT_OPERATIONS
    }

    missing = set(canonical) - set(runtime)
    unexpected = set(runtime) - set(canonical)
    declared = set(gaps)
    if missing != declared:
        issues.append(
            "operation gaps differ: "
            f"missing={sorted(missing)}, declared={sorted(declared)}, "
            f"undeclared={sorted(missing - declared)}, stale={sorted(declared - missing)}"
        )
    if unexpected:
        issues.append(f"runtime has operations absent from canonical OpenAPI: {sorted(unexpected)}")

    for operation_id in sorted(set(canonical) & set(runtime)):
        if canonical[operation_id] != runtime[operation_id]:
            expected = json.dumps(canonical[operation_id], ensure_ascii=False, sort_keys=True)
            actual = json.dumps(runtime[operation_id], ensure_ascii=False, sort_keys=True)
            issues.append(
                f"operation {operation_id}: runtime schema differs from canonical OpenAPI\n"
                f"expected={expected}\n"
                f"actual={actual}"
            )

    for operation_id, gap in gaps.items():
        if not gap.get("iteration", "").startswith("BE-") or not gap.get("reason", "").strip():
            issues.append(f"operation gap {operation_id}: iteration and reason are required")
    return issues


def check_contract(
    contract_path: Path,
    gaps_path: Path,
    application: FastAPI = app,
) -> list[str]:
    contract = load_yaml(contract_path)
    gaps = load_gaps(gaps_path)
    return [
        *compare_dto_schemas(contract),
        *compare_operations(contract, gaps, application),
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description="Check FastAPI DTO and operation compatibility")
    parser.add_argument("--contract", type=Path, required=True)
    parser.add_argument("--gaps", type=Path, required=True)
    arguments = parser.parse_args()

    issues = check_contract(arguments.contract, arguments.gaps)
    if issues:
        raise SystemExit("Contract check failed:\n- " + "\n- ".join(issues))
    gap_count = len(load_gaps(arguments.gaps))
    print(f"Contract check passed: {len(DTO_TYPES)} schemas, {gap_count} declared operation gaps")


if __name__ == "__main__":
    main()
