from fastapi import APIRouter, Response, status

from app.api.auth import CurrentClientId
from app.api.dependencies import PushTokenServiceDependency
from app.api.responses import COMMON_ERROR_RESPONSES
from app.schemas.contracts import PushTokenRequest

router = APIRouter(prefix="/v1/push-tokens", tags=["Push"])


@router.post(
    "",
    operation_id="registerPushToken",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=COMMON_ERROR_RESPONSES,
)
def register_push_token(
    payload: PushTokenRequest,
    client_id: CurrentClientId,
    service: PushTokenServiceDependency,
) -> Response:
    service.register(client_id, payload.token, payload.platform.value)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
