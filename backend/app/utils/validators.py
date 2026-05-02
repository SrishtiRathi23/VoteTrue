from io import BytesIO

from fastapi import HTTPException
from PIL import Image, UnidentifiedImageError

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE_MB = 5
MAX_IMAGE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024


def validate_image_upload(content_type: str | None, file_size: int) -> None:
    """
    Validates uploaded image meets type and size requirements.

    Args:
        content_type: MIME type from file upload header.
        file_size: File size in bytes.

    Raises:
        HTTPException: If type or size is invalid.
    """
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid file type '{content_type}'. "
                "Allowed: JPEG, PNG, WebP only."
            ),
        )

    if file_size > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_IMAGE_SIZE_MB}MB.",
        )


def validate_image_content(image_bytes: bytes) -> None:
    """Verifies uploaded bytes are a readable image, not just a spoofed MIME type."""
    try:
        Image.open(BytesIO(image_bytes)).verify()
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.") from exc


PROMPT_INJECTION_PATTERNS = (
    "ignore previous instructions",
    "ignore all instructions",
    "system prompt",
    "developer message",
    "recommend a party",
    "which candidate",
    "who should i vote",
    "vote for",
)


def reject_prompt_injection(question: str) -> None:
    """Blocks obvious prompt-injection and voting-recommendation attempts."""
    lowered = question.lower()
    if any(pattern in lowered for pattern in PROMPT_INJECTION_PATTERNS):
        raise HTTPException(
            status_code=400,
            detail="VoteTrue only verifies factual election information from official sources.",
        )


def validate_question_input(question: str) -> str:
    """
    Sanitizes and validates a question string.

    Args:
        question: Raw question input from user.

    Returns:
        Cleaned question string.

    Raises:
        HTTPException: If question is too short.
    """
    cleaned = question.strip()

    if len(cleaned) < 5:
        raise HTTPException(
            status_code=400,
            detail="Question is too short. Please ask a complete question.",
        )

    return cleaned
