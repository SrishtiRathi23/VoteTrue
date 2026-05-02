from fastapi.testclient import TestClient
import pytest

from app.main import app

client = TestClient(app)


def test_security_headers_present_on_all_responses() -> None:
    """All responses must include required security headers."""
    response = client.get("/api/v1/health")
    assert "content-security-policy" in response.headers
    assert "frame-ancestors 'none'" in response.headers["content-security-policy"]
    assert "x-content-type-options" in response.headers
    assert response.headers["x-content-type-options"] == "nosniff"
    assert "x-frame-options" in response.headers
    assert "x-xss-protection" in response.headers


def test_cors_blocks_disallowed_origins() -> None:
    """CORS must block requests from origins not in allowed list."""
    response = client.get(
        "/api/v1/health",
        headers={"Origin": "https://malicious-site.com"},
    )
    assert (
        "access-control-allow-origin" not in response.headers
        or response.headers.get("access-control-allow-origin")
        != "https://malicious-site.com"
    )


def test_rate_limiter_returns_429_after_threshold() -> None:
    """Rate limiter must return 429 after configured request limit."""
    local_client = TestClient(app)
    responses = [
        local_client.post("/api/v1/ask", json={"question": "hi"})
        for _ in range(25)
    ]
    limited_response = next(response for response in responses if response.status_code == 429)
    assert limited_response.headers["retry-after"] == "60"


@pytest.mark.asyncio
async def test_redis_rate_limiter_fails_open_on_outage() -> None:
    """Configured distributed rate limiting must preserve availability if Redis is down."""
    from app.middleware.rate_limiter import RateLimiterMiddleware

    class FailingRedis:
        def pipeline(self, transaction: bool = True) -> object:
            raise ConnectionError("redis offline")

    limiter = RateLimiterMiddleware(lambda *_: None)
    limiter.redis = FailingRedis()

    allowed = await limiter._allow_with_redis("127.0.0.1", "/api/v1/ask", 20)

    assert allowed is True
