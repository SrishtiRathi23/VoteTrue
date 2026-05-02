import time
from collections import defaultdict
from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

try:
    import redis.asyncio as redis_async
except ImportError:
    redis_async = None


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiter. Limits each IP to MAX_REQUESTS_PER_MINUTE
    requests per minute. No external dependency required.
    """

    def __init__(self, app: Callable[..., Awaitable[Response]]) -> None:
        super().__init__(app)
        self.request_counts: dict[str, list[float]] = defaultdict(list)
        settings = get_settings()
        self.redis = (
            redis_async.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=1,
                socket_timeout=1,
            )
            if redis_async is not None and settings.redis_url
            else None
        )

    async def dispatch(self, request: Request, call_next) -> Response:
        settings = get_settings()
        client_ip = request.client.host if request.client else "unknown"
        if self.redis is not None:
            allowed = await self._allow_with_redis(
                client_ip,
                request.url.path,
                settings.max_requests_per_minute,
            )
            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please wait a moment."},
                )
            return await call_next(request)

        now = time.time()
        window = 60.0

        self.request_counts[client_ip] = [
            request_time
            for request_time in self.request_counts[client_ip]
            if now - request_time < window
        ]

        if len(self.request_counts[client_ip]) >= settings.max_requests_per_minute:
            logger.warning(
                "rate_limit_exceeded ip=%s path=%s limit=%s timestamp=%s",
                client_ip,
                request.url.path,
                settings.max_requests_per_minute,
                now,
            )
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please wait a moment."},
            )

        self.request_counts[client_ip].append(now)
        return await call_next(request)

    async def _allow_with_redis(self, client_ip: str, path: str, limit: int) -> bool:
        """Uses Redis/MemoryStore for Cloud Run-safe distributed rate limiting."""
        assert self.redis is not None
        now_ms = int(time.time() * 1000)
        window_ms = 60_000
        key = f"rate-limit:{client_ip}"
        try:
            async with self.redis.pipeline(transaction=True) as pipe:
                await pipe.zremrangebyscore(key, 0, now_ms - window_ms)
                await pipe.zadd(key, {str(now_ms): now_ms})
                await pipe.zcard(key)
                await pipe.expire(key, 60)
                results = await pipe.execute()
            count = int(results[2])
            if count > limit:
                logger.warning(
                    "rate_limit_exceeded_distributed ip=%s path=%s limit=%s timestamp=%s",
                    client_ip,
                    path,
                    limit,
                    now_ms,
                )
                return False
            return True
        except Exception as exc:
            logger.warning("redis_rate_limiter_unavailable error=%s", str(exc))
            return True
