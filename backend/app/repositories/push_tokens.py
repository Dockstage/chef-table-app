from typing import Protocol
from uuid import UUID


class PushTokenRepository(Protocol):
    def register(self, client_id: UUID, token: str, platform: str) -> None: ...
