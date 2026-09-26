from copy import deepcopy
from pathlib import Path

from app.contract_check import check_contract, collect_operations, compare_dto_schemas, load_yaml

BACKEND_ROOT = Path(__file__).parents[1]
CONTRACT_PATH = BACKEND_ROOT.parent / "docs" / "02-design" / "openapi.yaml"
GAPS_PATH = BACKEND_ROOT / "contract-gaps.json"


def test_runtime_and_dto_match_canonical_contract() -> None:
    assert check_contract(CONTRACT_PATH, GAPS_PATH) == []


def test_contract_check_detects_dto_drift() -> None:
    changed_contract = deepcopy(load_yaml(CONTRACT_PATH))
    changed_contract["components"]["schemas"]["Chef"]["properties"]["name"]["maxLength"] = 99

    issues = compare_dto_schemas(changed_contract)

    assert any(issue.startswith("DTO Chef:") for issue in issues)


def test_operation_signature_includes_transport_contract() -> None:
    operations = collect_operations(load_yaml(CONTRACT_PATH))

    create_booking = operations["createBooking"]
    assert create_booking["method"] == "post"
    assert create_booking["path"] == "/bookings"
    assert create_booking["requestBody"]["required"] is True
    assert create_booking["requestBody"]["content"]["application/json"] == {
        "$ref": "CreateBookingRequest"
    }
    assert set(create_booking["responses"]) == {
        "201",
        "401",
        "404",
        "409",
        "410",
        "422",
        "429",
        "500",
        "503",
    }
    assert create_booking["security"] == [{"bearerAuth": []}]
