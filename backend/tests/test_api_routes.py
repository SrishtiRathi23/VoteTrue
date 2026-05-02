from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.services import cache_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def safe_input_classifier() -> None:
    """Keeps route tests fast; dedicated Gemini tests cover the classifier."""
    from app.routes import ask

    class SafeGeminiService:
        async def assess_input_safety(self, _: str) -> tuple[bool, str]:
            return True, ""

    app.dependency_overrides[ask.get_gemini_service] = SafeGeminiService
    yield
    app.dependency_overrides.pop(ask.get_gemini_service, None)


def test_health_endpoint_returns_200() -> None:
    """Health endpoint must return 200 with healthy status."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_ask_endpoint_rejects_empty_question() -> None:
    """Ask endpoint must reject questions under 5 characters."""
    response = client.post("/api/v1/ask", json={"question": "hi"})
    assert response.status_code == 422


def test_ask_endpoint_rejects_invalid_language() -> None:
    """Ask endpoint must reject unsupported language codes."""
    response = client.post(
        "/api/v1/ask",
        json={"question": "What are polling hours?", "language": "fr"},
    )
    assert response.status_code == 422


def test_ask_endpoint_falls_back_without_context(monkeypatch) -> None:
    """Ask endpoint must not call Gemini when RAG has no verified context."""
    from app.routes import ask

    class EmptyRAGService:
        async def query_documents(self, _: str):
            return []

    cache_service.cache.clear()
    app.dependency_overrides[ask.get_rag_service] = EmptyRAGService

    response = client.post(
        "/api/v1/ask",
        json={"question": "What documents can I use to vote?"},
    )
    app.dependency_overrides.pop(ask.get_rag_service, None)

    assert response.status_code == 200
    body = response.json()
    assert body["confidence"] == 0.0
    assert body["sources"] == []


def test_verify_forward_rejects_wrong_file_type() -> None:
    """Forward verification endpoint must reject unsupported uploads before OCR."""
    response = client.post(
        "/api/v1/verify-forward",
        files={"file": ("forward.txt", b"text", "text/plain")},
    )
    assert response.status_code == 400


def test_verify_forward_rejects_corrupted_image_bytes() -> None:
    """Forward verification must reject spoofed image uploads before OCR."""
    response = client.post(
        "/api/v1/verify-forward",
        files={"file": ("forward.png", b"not a real image", "image/png")},
    )
    assert response.status_code == 400


def test_legacy_alias_route_still_rejects_wrong_file_type() -> None:
    """Hidden compatibility alias (/verify-flyer) must reject non-image uploads."""
    response = client.post(
        "/api/v1/verify-flyer",
        files={"file": ("forward.txt", b"text", "text/plain")},
    )
    assert response.status_code == 400


def test_ask_endpoint_blocks_voting_recommendations() -> None:
    """Prompt-injection layer must block voting recommendation requests."""
    from app.routes import ask

    app.dependency_overrides.pop(ask.get_gemini_service, None)
    response = client.post(
        "/api/v1/ask",
        json={"question": "Who should I vote for in this election?"},
    )
    assert response.status_code == 400
