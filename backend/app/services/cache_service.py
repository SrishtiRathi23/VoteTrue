import hashlib
import json
import time
from typing import Any

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

try:
    import redis
except ImportError:
    redis = None

RedisError = redis.RedisError if redis is not None else RuntimeError


class InMemoryCache:
    """
    TTL-based in-memory cache for Gemini API responses.
    Identical queries return cached results instantly, reducing latency and API
    usage at hackathon scale.
    """

    def __init__(self, ttl_seconds: int = 3600) -> None:
        """
        Initialize an in-process TTL cache.

        Args:
            ttl_seconds: Number of seconds each cached value remains valid.

        Returns:
            None.

        Raises:
            None.
        """
        self._store: dict[str, dict[str, Any]] = {}
        self._ttl = ttl_seconds

    def _make_key(self, query: str) -> str:
        """
        Generate a deterministic cache key from query text.

        Args:
            query: Raw query string to normalize.

        Returns:
            MD5 hex digest suitable for local and Redis cache keys.

        Raises:
            None.
        """
        return hashlib.md5(query.strip().lower().encode()).hexdigest()

    def get(self, query: str) -> dict[str, Any] | None:
        """
        Retrieves cached response for a query if not expired.

        Args:
            query: The original query string.

        Returns:
            Cached response dict or None if not found/expired.

        Raises:
            None.
        """
        key = self._make_key(query)
        entry = self._store.get(key)

        if not entry:
            return None

        if time.time() - float(entry["timestamp"]) > self._ttl:
            del self._store[key]
            logger.info("cache_expired key=%s", key[:8])
            return None

        logger.info("cache_hit key=%s", key[:8])
        return dict(entry["data"])

    def set(self, query: str, data: dict[str, Any]) -> None:
        """
        Stores a response in cache with current timestamp.

        Args:
            query: The original query string.
            data: The response data to cache.

        Returns:
            None.

        Raises:
            None.
        """
        key = self._make_key(query)
        self._store[key] = {
            "data": data,
            "timestamp": time.time(),
        }
        logger.info("cache_set key=%s", key[:8])

    def clear(self) -> None:
        """
        Clear all cached entries.

        Args:
            None.

        Returns:
            None.

        Raises:
            None.
        """
        self._store.clear()


class RedisBackedCache(InMemoryCache):
    """Redis/MemoryStore cache with safe local fallback for development."""

    def __init__(self, redis_url: str, ttl_seconds: int = 3600) -> None:
        """
        Initialize a Redis-backed cache with an in-memory fallback.

        Args:
            redis_url: Redis connection URL.
            ttl_seconds: Number of seconds each Redis value remains valid.

        Returns:
            None.

        Raises:
            redis.RedisError: May be raised by the Redis client constructor if
                the URL is invalid.
        """
        super().__init__(ttl_seconds=ttl_seconds)
        self._client = redis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=1,
            socket_timeout=1,
        )

    def get(self, query: str) -> dict[str, Any] | None:
        """
        Retrieve cached JSON from Redis or local memory.

        Args:
            query: Original query string.

        Returns:
            Cached response data, or None when no valid entry exists.

        Raises:
            None. Redis errors are logged and handled by the fallback cache.
        """
        key = self._make_key(query)
        try:
            cached = self._client.get(key)
            if cached:
                logger.info("redis_cache_hit key=%s", key[:8])
                return dict(json.loads(cached))
        except (RedisError, OSError, json.JSONDecodeError, TypeError) as exc:
            logger.warning("redis_cache_get_failed error=%s", str(exc))
        return super().get(query)

    def set(self, query: str, data: dict[str, Any]) -> None:
        """
        Store JSON in Redis and mirror it to local memory.

        Args:
            query: Original query string.
            data: Response data to cache.

        Returns:
            None.

        Raises:
            None. Redis errors are logged and the memory mirror is still used.
        """
        key = self._make_key(query)
        try:
            self._client.setex(key, self._ttl, json.dumps(data))
            logger.info("redis_cache_set key=%s", key[:8])
        except (RedisError, OSError, TypeError, ValueError) as exc:
            logger.warning("redis_cache_set_failed error=%s", str(exc))
        super().set(query, data)

    def clear(self) -> None:
        """
        Clear only the local fallback cache.

        Args:
            None.

        Returns:
            None.

        Raises:
            None.
        """
        super().clear()


settings = get_settings()
cache = (
    RedisBackedCache(settings.redis_url, ttl_seconds=3600)
    if redis is not None and settings.redis_url
    else InMemoryCache(ttl_seconds=3600)
)
