from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class Verdict(str, Enum):
    """Supported fact-check verdicts."""

    TRUE = "TRUE"
    MISLEADING = "MISLEADING"
    UNVERIFIABLE = "UNVERIFIABLE"


class SourceCitation(BaseModel):
    """Represents a single source citation from ECI documents."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "document_name": "ECI Voter Guide - Identification of Electors",
                "page_number": 7,
                "excerpt": "Accepted alternatives include Aadhaar Card and Passport.",
            }
        }
    )

    document_name: str = Field(description="Official ECI document or source name.")
    page_number: int | None = Field(
        default=None,
        description="Page number within the cited document when available.",
    )
    excerpt: str | None = Field(
        default=None,
        description="Short source excerpt supporting the generated answer or verdict.",
    )


class AskResponse(BaseModel):
    """Response model for the Ask VoteTrue endpoint."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "answer": "You can vote with EPIC or another approved photo ID.",
                "sources": [
                    {
                        "document_name": "ECI Voter Guide - Identification of Electors",
                        "page_number": 7,
                        "excerpt": "Accepted alternatives include Aadhaar Card.",
                    }
                ],
                "confidence": 0.92,
                "language": "en",
            }
        }
    )

    answer: str = Field(description="Grounded answer derived from retrieved ECI context.")
    sources: list[SourceCitation] = Field(
        description="Source citations used to support the answer."
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Honest retrieval similarity score without artificial floors.",
    )
    language: str = Field(description="Language code used for the answer.")


class ClaimVerification(BaseModel):
    """Verdict for a single claim extracted from a WhatsApp forward."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "claim": "Aadhaar card is mandatory at the polling booth.",
                "verdict": "MISLEADING",
                "explanation": "Aadhaar is one accepted ID, not the only mandatory ID.",
                "confidence": 0.88,
                "sources": [
                    {
                        "document_name": "ECI Voter Guide - Identification of Electors",
                        "page_number": 7,
                    }
                ],
            }
        }
    )

    claim: str = Field(description="Single factual claim extracted from the forward.")
    verdict: Verdict = Field(description="Fact-check verdict assigned to the claim.")
    explanation: str = Field(description="Plain-language rationale for the verdict.")
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Honest confidence derived from retrieval metadata.",
    )
    sources: list[SourceCitation] = Field(
        description="Source citations supporting the claim verdict."
    )


class ForwardVerificationResponse(BaseModel):
    """Response model for the WhatsApp Forward Verification Engine endpoint."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "extracted_text": "Aadhaar card is mandatory at the booth.",
                "claims": [
                    {
                        "claim": "Aadhaar card is mandatory at the booth.",
                        "verdict": "MISLEADING",
                        "explanation": "Aadhaar is accepted but not the only voter ID.",
                        "confidence": 0.88,
                        "sources": [
                            {
                                "document_name": "ECI Voter Guide - Identification of Electors",
                                "page_number": 7,
                            }
                        ],
                    }
                ],
                "total_claims": 1,
            }
        }
    )

    extracted_text: str = Field(description="OCR text extracted from the uploaded image.")
    claims: list[ClaimVerification] = Field(
        description="Per-claim verification results."
    )
    total_claims: int = Field(description="Total number of claims verified.")


class HealthResponse(BaseModel):
    """Response model for the health check endpoint."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "healthy",
                "environment": "production",
                "services": {
                    "gemini": "configured",
                    "chromadb": "local",
                    "vision": "google_cloud",
                },
            }
        }
    )

    status: str = Field(description="Overall API health status.")
    environment: str = Field(description="Configured runtime environment.")
    services: dict[str, str] = Field(
        description="Readiness summary for configured external services."
    )


class RetrievedChunk(BaseModel):
    """Internal model for a RAG document chunk."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "text": "EVMs are stand-alone, non-networked machines.",
                "document_name": "ECI EVM and VVPAT Factsheet",
                "page_number": 2,
                "similarity": 0.78,
                "metadata": {"source": "built_in_eci_seed"},
            }
        }
    )

    text: str = Field(description="Retrieved ECI document chunk text.")
    document_name: str = Field(
        default="Unknown ECI document",
        description="Source document name for the retrieved chunk.",
    )
    page_number: int | None = Field(
        default=None,
        description="Page number for the retrieved chunk when known.",
    )
    similarity: float = Field(
        default=0.0,
        description="Similarity score from vector retrieval or seed fallback scoring.",
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Raw retrieval metadata such as source, scoring method, or overlap.",
    )
