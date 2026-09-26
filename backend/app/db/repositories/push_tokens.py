from uuid import UUID

from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.db.models.notification import PushToken


class SqlAlchemyPushTokenRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def register(self, client_id: UUID, token: str, platform: str) -> None:
        statement = insert(PushToken).values(
            client_id=client_id,
            token=token,
            platform=platform,
            active=True,
        )
        with self._session.begin():
            self._session.execute(
                statement.on_conflict_do_update(
                    index_elements=[PushToken.token],
                    set_={
                        "client_id": client_id,
                        "platform": platform,
                        "active": True,
                        "updated_at": func.now(),
                    },
                )
            )
