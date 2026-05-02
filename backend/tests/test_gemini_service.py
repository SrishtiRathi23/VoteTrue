from unittest.mock import MagicMock

import pytest


@pytest.mark.asyncio
async def test_extract_claims_returns_empty_on_bad_json(monkeypatch: pytest.MonkeyPatch) -> None:
    """Claim extraction returns empty when no factual election claim is present."""
    from app.services import gemini_service

    mock_response = MagicMock()
    mock_response.text = "not valid json at all"
    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response
    monkeypatch.setattr(gemini_service, "model", mock_model)

    result = await gemini_service.extract_claims_from_text("some WhatsApp forward text")
    assert result == []


@pytest.mark.asyncio
async def test_extract_claims_uses_keyword_fallback_on_bad_json(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Claim extraction must not fail closed when OCR text has obvious claims."""
    from app.services import gemini_service

    mock_response = MagicMock()
    mock_response.text = "not valid json at all"
    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response
    monkeypatch.setattr(gemini_service, "model", mock_model)

    result = await gemini_service.extract_claims_from_text(
        "Aadhaar card is mandatory to vote. Polling closes at 3 PM. "
        "EVMs can be hacked by Bluetooth."
    )

    assert len(result) == 3
    assert "Aadhaar" in result[0]


@pytest.mark.asyncio
async def test_extract_claims_parses_json_fence(monkeypatch: pytest.MonkeyPatch) -> None:
    """Claim extraction must tolerate markdown JSON fences."""
    from app.services import gemini_service

    mock_response = MagicMock()
    mock_response.text = '```json\n["Voting closes at 4 PM.", "Aadhaar is mandatory."]\n```'
    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response
    monkeypatch.setattr(gemini_service, "model", mock_model)

    result = await gemini_service.extract_claims_from_text("some WhatsApp forward text")
    assert result == ["Voting closes at 4 PM.", "Aadhaar is mandatory."]


@pytest.mark.asyncio
async def test_verify_claim_returns_unverifiable_on_failure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """verify_single_claim must return UNVERIFIABLE verdict on any exception."""
    from app.models.response_models import RetrievedChunk
    from app.services import gemini_service

    mock_model = MagicMock()
    mock_model.generate_content.side_effect = Exception("Gemini down")
    monkeypatch.setattr(gemini_service, "model", mock_model)

    result = await gemini_service.verify_single_claim(
        "some claim",
        [RetrievedChunk(text="some context", document_name="ECI Doc")],
    )

    assert result.verdict.value == "UNVERIFIABLE"
    assert result.confidence == 0.0
    assert result.sources


@pytest.mark.asyncio
async def test_verify_claim_fallback_preserves_similarity_confidence(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Fallback confidence must come from retrieval similarity, not a floor."""
    from app.models.response_models import RetrievedChunk
    from app.services import gemini_service

    mock_model = MagicMock()
    mock_model.generate_content.side_effect = Exception("Gemini down")
    monkeypatch.setattr(gemini_service, "model", mock_model)

    result = await gemini_service.verify_single_claim(
        "some claim",
        [
            RetrievedChunk(
                text="some context",
                document_name="ECI Doc",
                similarity=0.61,
            )
        ],
    )

    assert result.confidence == 0.61
    assert result.sources[0].document_name == "ECI Doc"


@pytest.mark.asyncio
async def test_generate_answer_returns_source_metadata(monkeypatch: pytest.MonkeyPatch) -> None:
    """Answer generation should preserve RAG source citations."""
    from app.models.response_models import RetrievedChunk
    from app.services import gemini_service

    mock_response = MagicMock()
    mock_response.text = "Use any approved photo ID. [Source: ECI Doc, Page 7]"
    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response
    monkeypatch.setattr(gemini_service, "model", mock_model)

    result = await gemini_service.generate_answer(
        question="What ID can I use?",
        context_chunks=[
            RetrievedChunk(
                text="Approved IDs are listed here.",
                document_name="ECI Voter Guide",
                page_number=7,
                similarity=0.91,
            )
        ],
    )

    assert result["confidence"] == 0.91
    assert result["sources"][0]["document_name"] == "ECI Voter Guide"


@pytest.mark.asyncio
async def test_generate_answer_honest_confidence(monkeypatch: pytest.MonkeyPatch) -> None:
    """generate_answer with a RetrievedChunk(similarity=0.61) should return confidence 0.61."""
    from app.models.response_models import RetrievedChunk
    from app.services import gemini_service

    mock_response = MagicMock()
    mock_response.text = "Answer."
    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response
    monkeypatch.setattr(gemini_service, "model", mock_model)

    result = await gemini_service.generate_answer(
        question="What ID can I use?",
        context_chunks=[
            RetrievedChunk(
                text="Some context.",
                document_name="ECI Doc",
                similarity=0.61,
            )
        ],
    )

    assert result["confidence"] == 0.61


@pytest.mark.asyncio
async def test_input_safety_classifier_blocks_adversarial_prompt(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """LLM safety classifier must block non-neutral voting requests."""
    from app.services import gemini_service

    mock_response = MagicMock()
    mock_response.text = '{"is_safe": false, "reason": "asks who to vote for"}'
    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response
    monkeypatch.setattr(gemini_service, "model", mock_model)
    gemini_service.cache_service.cache.clear()

    is_safe, reason = await gemini_service.assess_input_safety(
        "Which candidate should I support?"
    )

    assert is_safe is False
    assert "vote" in reason


@pytest.mark.asyncio
async def test_input_safety_classifier_uses_cache(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Repeated safety checks must use cache instead of another Gemini call."""
    from app.services import gemini_service

    mock_response = MagicMock()
    mock_response.text = '{"is_safe": true, "reason": "election process question"}'
    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response
    monkeypatch.setattr(gemini_service, "model", mock_model)
    gemini_service.cache_service.cache.clear()

    first = await gemini_service.assess_input_safety("What ID can I use to vote?")
    second = await gemini_service.assess_input_safety("What ID can I use to vote?")

    assert first == second
    assert mock_model.generate_content.call_count == 1


@pytest.mark.asyncio
async def test_input_safety_classifier_fails_open_to_keyword_guard(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Classifier outages must not crash the route; keyword guard remains active."""
    from app.services import gemini_service

    mock_model = MagicMock()
    mock_model.generate_content.side_effect = Exception("Gemini down")
    monkeypatch.setattr(gemini_service, "model", mock_model)
    gemini_service.cache_service.cache.clear()

    is_safe, reason = await gemini_service.assess_input_safety("What ID can I use?")

    assert is_safe is True
    assert "classifier unavailable" in reason
