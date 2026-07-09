import time
from collections import defaultdict

from fastapi import HTTPException, Request, status

_WINDOW_SECONDS = 60
_MAX_REQUESTS = 5
_store: dict[str, list[float]] = defaultdict(list)


def _cleanup(now: float) -> None:
    expired_keys = [k for k, v in _store.items() if v and v[-1] < now - _WINDOW_SECONDS]
    for k in expired_keys:
        del _store[k]


def rate_limit(request: Request) -> None:
    now = time.time()
    _cleanup(now)
    client_ip = request.client.host if request.client else "unknown"
    timestamps = _store[client_ip]
    timestamps = [t for t in timestamps if now - t < _WINDOW_SECONDS]
    _store[client_ip] = timestamps
    if len(timestamps) >= _MAX_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please wait before trying again.",
        )
    timestamps.append(now)