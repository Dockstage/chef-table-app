import json
import logging
import sys
from datetime import UTC, datetime
from time import perf_counter
from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class JsonLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "event": record.getMessage(),
        }
        for key in ("request_id", "method", "path", "status", "duration_ms", "exception_type"):
            if hasattr(record, key):
                payload[key] = getattr(record, key)
        return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def configure_logging(level: str) -> None:
    logger = logging.getLogger("chef_table")
    logger.setLevel(level)
    logger.propagate = False

    handler = next(
        (item for item in logger.handlers if getattr(item, "chef_table_handler", False)),
        None,
    )
    if handler is None:
        handler = logging.StreamHandler(sys.stderr)
        handler.chef_table_handler = True  # type: ignore[attr-defined]
        handler.setFormatter(JsonLogFormatter())
        logger.addHandler(handler)
    handler.setLevel(level)


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = str(uuid4())
        request.state.request_id = request_id
        started_at = perf_counter()
        logger = logging.getLogger("chef_table.http")
        common = {
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
        }

        try:
            response = await call_next(request)
        except Exception as exception:
            logger.error(
                "request_failed",
                extra={**common, "exception_type": type(exception).__name__},
            )
            raise

        duration_ms = round((perf_counter() - started_at) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        logger.info(
            "request_completed",
            extra={
                **common,
                "status": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        return response
