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


class InMemoryCache:
    """
    TTL-based in-memory cache for Gemini API responses.
    Identical queries return cached results instantly, reducing latency and API
    usage at hackathon scale.
    """

    def __init__(self, ttl_seconds: int = 3600) -> None:
        self._store: dict[str, dict[str, Any]] = {}
        self._ttl = ttl_seconds

    def _make_key(self, query: str) -> str:
        """Generates a consistent MD5 cache key from query text."""
        return hashlib.md5(query.strip().lower().encode()).hexdigest()

    def get(self, query: str) -> dict[str, Any] | None:
        """
        Retrieves cached response for a query if not expired.

        Args:
            query: The original query string.

        Returns:
            Cached response dict or None if not found/expired.
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
        """
        key = self._make_key(query)
        self._store[key] = {
            "data": data,
            "timestamp": time.time(),
        }
        logger.info("cache_set key=%s", key[:8])

    def clear(self) -> None:
        """Clears all cached entries. Used by tests."""
        self._store.clear()


class RedisBackedCache(InMemoryCache):
    """Redis/MemoryStore cache with safe local fallback for development."""

    def __init__(self, redis_url: str, ttl_seconds: int = 3600) -> None:
        super().__init__(ttl_seconds=ttl_seconds)
        self._client = redis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=1,
            socket_timeout=1,
        )

    def get(self, query: str) -> dict[str, Any] | None:
        """Retrieves cached JSON from Redis; falls back to memory on errors."""
        key = self._make_key(query)
        try:
            cached = self._client.get(key)
            if cached:
                logger.info("redis_cache_hit key=%s", key[:8])
                return dict(json.loads(cached))
        except Exception as exc:
            logger.warning("redis_cache_get_failed error=%s", str(exc))
        return super().get(query)

    def set(self, query: str, data: dict[str, Any]) -> None:
        """Stores JSON in Redis with TTL; mirrors to memory as fallback."""
        key = self._make_key(query)
        try:
            self._client.setex(key, self._ttl, json.dumps(data))
            logger.info("redis_cache_set key=%s", key[:8])
        except Exception as exc:
            logger.warning("redis_cache_set_failed error=%s", str(exc))
        super().set(query, data)

    def clear(self) -> None:
        """Clears local fallback cache only; tests should not flush Redis."""
        super().clear()


settings = get_settings()
cache = (
    RedisBackedCache(settings.redis_url, ttl_seconds=3600)
    if redis is not None and settings.redis_url
    else InMemoryCache(ttl_seconds=3600)
)
