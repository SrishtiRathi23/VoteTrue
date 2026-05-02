import asyncio
import json
import re
from collections.abc import Sequence
from typing import Any

from app.config import get_settings
from app.models.response_models import (
    ClaimVerification,
    RetrievedChunk,
    SourceCitation,
    Verdict,
)
from app.prompts.system_prompts import (
    CLAIM_EXTRACTION_PROMPT_V1,
    FACT_CHECK_SYSTEM_PROMPT_V1,
    INPUT_SAFETY_PROMPT_V1,
)
from app.services import cache_service
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)
GEMINI_TIMEOUT_SECONDS = 30

try:
    import google.generativeai as genai
except ImportError:
    genai = None

if settings.gemini_api_key and genai is not None:
    genai.configure(api_key=settings.gemini_api_key)


class MissingGeminiModel:
    """Fail-closed placeholder when Gemini SDK is unavailable locally."""

    def generate_content(self, prompt: str) -> Any:
        raise RuntimeError("Gemini SDK is not installed or configured")


model = genai.GenerativeModel("gemini-1.5-flash") if genai is not None else MissingGeminiModel()


def _similarity_confidence(context_chunks: Sequence[RetrievedChunk | str]) -> float:
    """Reports confidence from retrieval similarity only; no artificial floor."""
    similarities = [
        float(chunk.similarity)
        for chunk in context_chunks
        if isinstance(chunk, RetrievedChunk)
    ]
    return min(max(similarities), 1.0) if similarities else 0.0


def _fallback_answer(
    question: str,
    context_chunks: Sequence[RetrievedChunk | str],
    language: str,
) -> dict[str, Any]:
    """Builds a conservative cited answer from retrieved context."""
    sources = _sources_from_chunks(context_chunks)
    first = context_chunks[0]
    text = first.text if isinstance(first, RetrievedChunk) else str(first)
    clean_text = _clean_source_text(text)
    prefix = "Based on official ECI context, "
    if language == "hi":
        prefix = "Official ECI context ke aadhaar par: "
    return {
        "answer": f"{prefix}{clean_text[:420].strip()}",
        "confidence": _similarity_confidence(context_chunks),
        "sources": [source.model_dump() for source in sources],
    }


def _clean_source_text(text: str) -> str:
    """Removes source-url boilerplate from fallback answer text."""
    lines = [
        line
        for line in text.splitlines()
        if not line.startswith("Source:") and not line.startswith("Official URL:")
    ]
    cleaned = " ".join(lines).strip()
    return cleaned or text


def _strip_json_fence(raw_text: str) -> str:
    """Removes common markdown code fences from Gemini JSON output."""
    raw = raw_text.strip()
    if not raw.startswith("```"):
        return raw

    raw = raw.removeprefix("```").strip()
    if raw.startswith("json"):
        raw = raw[4:].strip()
    return raw.removesuffix("```").strip()


def _fallback_claims_from_text(text: str) -> list[str]:
    """Extracts obvious election-rule claims when Gemini extraction fails."""
    claim_keywords = (
        "mandatory",
        "must",
        "required",
        "closes",
        "close",
        "polling",
        "booth",
        "evm",
        "evms",
        "hacked",
        "hack",
        "bluetooth",
        "wifi",
        "nota",
        "aadhaar",
        "aadhar",
        "vote",
        "voting",
    )
    normalized = re.sub(r"\s+", " ", text.replace("\n", ". ")).strip()
    candidates = re.split(r"(?<=[.!?])\s+|;\s+", normalized)
    claims = []
    for candidate in candidates:
        cleaned = candidate.strip(" -•\t")
        if len(cleaned) < 12:
            continue
        if any(keyword in cleaned.lower() for keyword in claim_keywords):
            claims.append(cleaned if cleaned.endswith((".", "!", "?")) else f"{cleaned}.")
    return list(dict.fromkeys(claims))[:8]


def _chunk_text(chunk: RetrievedChunk | str) -> str:
    """Formats a retrieved chunk for prompt context."""
    if isinstance(chunk, RetrievedChunk):
        page = f", Page {chunk.page_number}" if chunk.page_number is not None else ""
        return f"[Source: {chunk.document_name}{page}]\n{chunk.text}"
    return chunk


def _sources_from_chunks(chunks: Sequence[RetrievedChunk | str]) -> list[SourceCitation]:
    """Builds citations from retrieved chunk metadata."""
    sources: list[SourceCitation] = []
    seen: set[tuple[str, int | None]] = set()
    for chunk in chunks:
        if not isinstance(chunk, RetrievedChunk):
            continue
        key = (chunk.document_name, chunk.page_number)
        if key in seen:
            continue
        seen.add(key)
        sources.append(
            SourceCitation(
                document_name=chunk.document_name,
                page_number=chunk.page_number,
                excerpt=chunk.text[:220],
            )
        )
    return sources


async def assess_input_safety(question: str) -> tuple[bool, str]:
    """Uses Gemini as a second-layer safety classifier for adversarial prompts."""
    cache_key = f"safety:{question}"
    cached = cache_service.cache.get(cache_key)
    if cached is not None:
        logger.info("input_safety_cache_hit")
        return bool(cached.get("is_safe", True)), str(cached.get("reason", ""))

    prompt = f"{INPUT_SAFETY_PROMPT_V1}\n\nUSER MESSAGE:\n{question}"
    try:
        response = await asyncio.wait_for(
            asyncio.to_thread(model.generate_content, prompt),
            timeout=10,
        )
        data = json.loads(_strip_json_fence(response.text))
        result = {
            "is_safe": bool(data.get("is_safe", True)),
            "reason": str(data.get("reason", "")),
        }
        cache_service.cache.set(cache_key, result)
        return result["is_safe"], result["reason"]
    except Exception as exc:
        logger.warning("input_safety_classifier_unavailable error=%s", str(exc))
        return True, "classifier unavailable; keyword guard still applied"


async def generate_answer(
    question: str,
    context_chunks: Sequence[RetrievedChunk | str],
    language: str = "en",
) -> dict[str, Any]:
    """
    Generates a source-cited answer to an election question using retrieved ECI
    document context.

    Args:
        question: Voter's question.
        context_chunks: Retrieved RAG chunks from ChromaDB.
        language: Response language code.

    Returns:
        Dict with answer, confidence, and sources.
    """
    if not context_chunks:
        return {
            "answer": (
                "I could not find relevant information in official ECI documents "
                "to answer this question."
            ),
            "confidence": 0.0,
            "sources": [],
        }

    context = "\n\n".join(_chunk_text(chunk) for chunk in context_chunks)
    sources = _sources_from_chunks(context_chunks)

    prompt = f"""
{FACT_CHECK_SYSTEM_PROMPT_V1}

CONTEXT FROM ECI DOCUMENTS:
{context}

VOTER QUESTION: {question}

Respond in {"Hindi" if language == "hi" else "English"}.
"""

    try:
        response = await asyncio.wait_for(
            asyncio.to_thread(model.generate_content, prompt),
            timeout=GEMINI_TIMEOUT_SECONDS,
        )
        logger.info("gemini_answer_generated question_length=%s", len(question))
        return {
            "answer": response.text,
            "confidence": _similarity_confidence(context_chunks),
            "sources": [source.model_dump() for source in sources],
        }
    except Exception as exc:
        logger.error("gemini_answer_failed error=%s", str(exc))
        return _fallback_answer(question, context_chunks, language)


async def extract_claims_from_text(text: str) -> list[str]:
    """
    Extracts verifiable factual claims from WhatsApp forward text using Gemini with
    structured JSON output.

    Args:
        text: Raw text extracted from image via OCR.

    Returns:
        List of claim strings ready for RAG verification.
    """
    prompt = f"{CLAIM_EXTRACTION_PROMPT_V1}\n\nWHATSAPP FORWARD TEXT:\n{text}"

    try:
        response = await asyncio.wait_for(
            asyncio.to_thread(model.generate_content, prompt),
            timeout=GEMINI_TIMEOUT_SECONDS,
        )
        claims = json.loads(_strip_json_fence(response.text))
        if not isinstance(claims, list):
            return _fallback_claims_from_text(text)
        clean_claims = [str(claim).strip() for claim in claims if str(claim).strip()]
        if not clean_claims:
            clean_claims = _fallback_claims_from_text(text)
        logger.info("claims_extracted count=%s", len(clean_claims))
        return clean_claims[:8]
    except Exception as exc:
        logger.error("claim_extraction_failed error=%s", str(exc))
        return _fallback_claims_from_text(text)


async def verify_single_claim(
    claim: str,
    context_chunks: Sequence[RetrievedChunk | str],
) -> ClaimVerification:
    """
    Verifies a single extracted claim against ECI document context.

    Args:
        claim: Single factual claim to verify.
        context_chunks: Retrieved RAG chunks for this claim.

    Returns:
        ClaimVerification with verdict, explanation, confidence, sources.
    """
    if not context_chunks:
        return ClaimVerification(
            claim=claim,
            verdict=Verdict.UNVERIFIABLE,
            explanation="Could not verify this claim against available ECI documents.",
            confidence=0.0,
            sources=[],
        )

    context = "\n\n".join(_chunk_text(chunk) for chunk in context_chunks)
    fallback_sources = _sources_from_chunks(context_chunks)

    prompt = f"""
{FACT_CHECK_SYSTEM_PROMPT_V1}

CONTEXT FROM ECI DOCUMENTS:
{context}

CLAIM TO VERIFY: {claim}

Respond ONLY as valid JSON with this exact structure:
{{
  "verdict": "TRUE" or "MISLEADING" or "UNVERIFIABLE",
  "explanation": "plain language explanation under 100 words",
  "confidence": 0.0 to 1.0,
  "source_document": "document name",
  "source_page": page number as integer or null
}}
"""

    try:
        response = await asyncio.wait_for(
            asyncio.to_thread(model.generate_content, prompt),
            timeout=GEMINI_TIMEOUT_SECONDS,
        )
        data = json.loads(_strip_json_fence(response.text))

        sources = []
        if data.get("source_document"):
            sources.append(
                SourceCitation(
                    document_name=str(data["source_document"]),
                    page_number=data.get("source_page"),
                )
            )

        return ClaimVerification(
            claim=claim,
            verdict=Verdict(data["verdict"]),
            explanation=str(data["explanation"]),
            confidence=float(data["confidence"]),
            sources=sources or fallback_sources,
        )
    except Exception as exc:
        logger.error("claim_verification_failed error=%s", str(exc))
        return ClaimVerification(
            claim=claim,
            verdict=Verdict.UNVERIFIABLE,
            explanation=(
                "The claim could not be conclusively verified, but relevant "
                "official ECI context is available for manual review."
            ),
            confidence=_similarity_confidence(context_chunks),
            sources=fallback_sources,
        )
