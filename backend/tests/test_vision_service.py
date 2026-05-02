from unittest.mock import MagicMock

import pytest


@pytest.mark.asyncio
async def test_extract_text_returns_empty_string_on_api_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Vision service must return empty string on API failure, never raise."""
    from app.services import vision_service

    mock_client = MagicMock()
    mock_client.text_detection.side_effect = Exception("Vision API down")
    monkeypatch.setattr(vision_service, "vision_client", mock_client)

    result = await vision_service.extract_text_from_image(b"fake image bytes")
    assert result == ""


@pytest.mark.asyncio
async def test_extract_text_returns_detected_text(monkeypatch: pytest.MonkeyPatch) -> None:
    """Vision service should return primary text annotation when present."""
    from app.services import vision_service

    response = MagicMock()
    response.error.message = ""
    response.text_annotations = [MagicMock(description="Detected WhatsApp forward text\n")]

    mock_client = MagicMock()
    mock_client.text_detection.return_value = response
    monkeypatch.setattr(vision_service, "vision_client", mock_client)

    result = await vision_service.extract_text_from_image(b"fake image bytes")
    assert result == "Detected WhatsApp forward text"
