from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class Verdict(str, Enum):
    """Supported fact-check verdicts."""

    TRUE = "TRUE"
    MISLEADING = "MISLEADING"
    UNVERIFIABLE = "UNVERIFIABLE"


class SourceCitation(BaseModel):
    """Represents a single source citation from ECI documents."""

    document_name: str
    page_number: int | None = None
    excerpt: str | None = None


class AskResponse(BaseModel):
    """Response model for the Ask VoteTrue endpoint."""

    answer: str
    sources: list[SourceCitation]
    confidence: float = Field(ge=0.0, le=1.0)
    language: str


class ClaimVerification(BaseModel):
    """Verdict for a single claim extracted from a WhatsApp forward."""

    claim: str
    verdict: Verdict
    explanation: str
    confidence: float = Field(ge=0.0, le=1.0)
    sources: list[SourceCitation]


class ForwardVerificationResponse(BaseModel):
    """Response model for the WhatsApp Forward Verification Engine endpoint."""

    extracted_text: str
    claims: list[ClaimVerification]
    total_claims: int


class HealthResponse(BaseModel):
    """Response model for the health check endpoint."""

    status: str
    environment: str
    services: dict[str, str]


class RetrievedChunk(BaseModel):
    """Internal model for a RAG document chunk."""

    text: str
    document_name: str = "Unknown ECI document"
    page_number: int | None = None
    similarity: float = 0.0
    metadata: dict[str, Any] = Field(default_factory=dict)
