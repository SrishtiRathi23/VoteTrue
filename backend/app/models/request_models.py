from pydantic import BaseModel, Field, field_validator


class AskRequest(BaseModel):
    """Request model for the Ask VoteTrue endpoint."""

    question: str = Field(
        ...,
        min_length=5,
        max_length=500,
        description="Election-related question from the voter",
    )
    language: str = Field(
        default="en",
        description="Response language: 'en' for English, 'hi' for Hindi",
    )

    @field_validator("question")
    @classmethod
    def question_must_not_be_empty(cls, value: str) -> str:
        """Validates question is not just whitespace."""
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Question cannot be empty or whitespace")
        return cleaned

    @field_validator("language")
    @classmethod
    def language_must_be_supported(cls, value: str) -> str:
        """Validates language is one of the supported options."""
        if value not in {"en", "hi"}:
            raise ValueError("Language must be 'en' or 'hi'")
        return value
