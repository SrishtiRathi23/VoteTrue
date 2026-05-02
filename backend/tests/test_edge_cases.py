import json
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException


class FakeUploadFile:
    """Small async upload stub for route-level edge tests."""

    content_type = "image/png"

    async def read(self) -> bytes:
        """Return deterministic fake image bytes.

        Args:
            None.

        Returns:
            Bytes passed to the route after validation is patched out.

        Raises:
            None.
        """
        return b"fake-image"


@pytest.mark.asyncio
async def test_verify_forward_empty_image_text_returns_422(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Empty OCR output must stop verification with a clear client error."""
    from app.routes import verify_forward

    monkeypatch.setattr(verify_forward, "validate_image_upload", lambda *_: None)
    monkeypatch.setattr(verify_forward, "validate_image_content", lambda *_: None)

    class EmptyVisionService:
        async def extract_text_from_image(self, _: bytes) -> str:
            return ""

    with pytest.raises(HTTPException) as raised:
        await verify_forward.verify_forward(
            FakeUploadFile(),
            gemini=MagicMock(),
            rag=MagicMock(),
            vision=EmptyVisionService(),
        )

    assert raised.value.status_code == 422
    assert "No text" in str(raised.value.detail)


@pytest.mark.asyncio
async def test_verify_single_claim_malformed_gemini_json_returns_unverifiable(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Malformed Gemini JSON must become UNVERIFIABLE instead of crashing."""
    from app.models.response_models import RetrievedChunk
    from app.services import gemini_service

    def raise_json_decode_error(_: str) -> object:
        raise json.JSONDecodeError("bad json", "{", 0)

    mock_response = MagicMock()
    mock_response.text = "{"
    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response
    monkeypatch.setattr(gemini_service, "model", mock_model)
    monkeypatch.setattr(gemini_service.json, "loads", raise_json_decode_error)

    result = await gemini_service.verify_single_claim(
        "Aadhaar is mandatory to vote.",
        [
            RetrievedChunk(
                text="Aadhaar is one accepted identity document.",
                document_name="ECI Voter Guide",
                page_number=7,
                similarity=0.72,
            )
        ],
    )

    assert result.verdict.value == "UNVERIFIABLE"
    assert result.confidence == 0.72
    assert result.sources[0].document_name == "ECI Voter Guide"


@pytest.mark.asyncio
async def test_extract_claims_empty_text_after_malformed_json_returns_empty(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Empty OCR text plus malformed JSON must return no claims, not an error."""
    from app.services import gemini_service

    mock_response = MagicMock()
    mock_response.text = "{"
    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response
    monkeypatch.setattr(gemini_service, "model", mock_model)

    result = await gemini_service.extract_claims_from_text("")

    assert result == []


@pytest.mark.asyncio
async def test_rag_retrieval_timeout_returns_builtin_eci_seed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Vector DB timeouts must fall back to built-in ECI seed chunks."""
    from app.services import rag_service

    async def fake_embed(_: str) -> list[float]:
        return [0.1, 0.2, 0.3]

    def timeout_query(**_: object) -> dict[str, list[list[object]]]:
        raise TimeoutError("vector database offline")

    monkeypatch.setattr(rag_service, "embed_text", fake_embed)
    monkeypatch.setattr(rag_service.collection, "query", timeout_query)

    result = await rag_service.RAGService().query_documents("What ID can I use to vote?")

    assert result
    assert result[0].metadata["source"] == "built_in_eci_seed"
    assert result[0].document_name.startswith("ECI")


@pytest.mark.asyncio
async def test_redis_connection_failures_use_memory_fallback() -> None:
    """Redis failures must not lose cached state inside the process."""
    from app.services.cache_service import InMemoryCache, RedisBackedCache

    class FailingRedisClient:
        def get(self, _: str) -> str | None:
            raise ConnectionError("redis offline")

        def setex(self, *_: object) -> None:
            raise ConnectionError("redis offline")

    cache = RedisBackedCache.__new__(RedisBackedCache)
    InMemoryCache.__init__(cache, ttl_seconds=3600)
    cache._client = FailingRedisClient()

    cache.set("What ID can I use?", {"answer": "Use an approved photo ID."})
    result = cache.get("What ID can I use?")

    assert result == {"answer": "Use an approved photo ID."}
