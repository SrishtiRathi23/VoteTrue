from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_security_headers_present_on_all_responses() -> None:
    """All responses must include required security headers."""
    response = client.get("/api/v1/health")
    assert "x-content-type-options" in response.headers
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
    status_codes = [
        local_client.post("/api/v1/ask", json={"question": "hi"}).status_code
        for _ in range(25)
    ]
    assert 429 in status_codes
