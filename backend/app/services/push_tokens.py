from uuid import UUID

from app.repositories.push_tokens import PushTokenRepository


class PushTokenService:
    def __init__(self, repository: PushTokenRepository) -> None:
        self._repository = repository

    def register(self, client_id: UUID, token: str, platform: str) -> None:
        self._repository.register(client_id, token, platform)
