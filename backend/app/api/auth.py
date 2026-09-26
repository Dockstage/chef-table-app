import secrets
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.api.errors import ApiProblem
from app.config import Settings
from app.domain.identity import DEMO_CLIENT_ID
from app.schemas.problem import ProblemCode

bearer_scheme = HTTPBearer(auto_error=False, scheme_name="bearerAuth")


async def get_current_client_id(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> UUID:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise ApiProblem(
            ProblemCode.UNAUTHORIZED,
            headers={"WWW-Authenticate": "Bearer"},
        )

    settings: Settings = request.app.state.settings
    configured_token = settings.dev_bearer_token
    if configured_token is None:
        raise ApiProblem(ProblemCode.SERVICE_UNAVAILABLE)

    if not secrets.compare_digest(credentials.credentials, configured_token.get_secret_value()):
        raise ApiProblem(
            ProblemCode.UNAUTHORIZED,
            headers={"WWW-Authenticate": "Bearer"},
        )

    return DEMO_CLIENT_ID


CurrentClientId = Annotated[UUID, Depends(get_current_client_id)]
