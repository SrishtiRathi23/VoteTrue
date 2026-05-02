import asyncio
import json
import re
from collections.abc import Sequence
from typing import Any

from app.config import (
    CLAIM_KEYWORDS,
    GEMINI_MODEL_NAME,
    GEMINI_TIMEOUT_SECONDS,
    INPUT_SAFETY_TIMEOUT_SECONDS,
    Settings,
    get_settings,
)
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

try:
    from google.api_core.exceptions import GoogleAPIError
    import google.generativeai as genai
except ImportError:
    GoogleAPIError = RuntimeError
    genai = None

if settings.gemini_api_key and genai is not None:
    genai.configure(api_key=settings.gemini_api_key)


class MissingGeminiModel:
    """Fail-closed placeholder when Gemini SDK is unavailable locally."""

    def generate_content(self, prompt: str) -> Any:
        """
        Raise a clear error when Gemini is unavailable.

        Args:
            prompt: Prompt text that would have been sent to Gemini.

        Returns:
            Never returns successfully.

        Raises:
            RuntimeError: Always raised because the SDK is unavailable.
        """
        raise RuntimeError("Gemini SDK is not installed or configured")


model = genai.GenerativeModel(GEMINI_MODEL_NAME) if genai is not None else MissingGeminiModel()


def _similarity_confidence(context_chunks: Sequence[RetrievedChunk | str]) -> float:
    """
    Report confidence from retrieval similarity only.

    Args:
        context_chunks: Retrieved chunks or raw context strings.

    Returns:
        Highest available similarity, bounded to 1.0, or 0.0.

    Raises:
        None.
    """
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
    """
    Build a conservative cited answer from retrieved context.

    Args:
        question: User question that triggered answer generation.
        context_chunks: Retrieved chunks used for fallback grounding.
        language: Response language code.

    Returns:
        Dict containing answer text, honest confidence, and source citations.

    Raises:
        IndexError: If called with an empty context chunk sequence.
    """
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
    """
    Remove source-url boilerplate from fallback answer text.

    Args:
        text: Raw chunk text.

    Returns:
        Cleaned text with source boilerplate removed where possible.

    Raises:
        None.
    """
    lines = [
        line
        for line in text.splitlines()
        if not line.startswith("Source:") and not line.startswith("Official URL:")
    ]
    cleaned = " ".join(lines).strip()
    return cleaned or text


def _strip_json_fence(raw_text: str) -> str:
    """
    Remove common markdown code fences from Gemini JSON output.

    Args:
        raw_text: Raw Gemini response text.

    Returns:
        JSON-like text without surrounding markdown fences.

    Raises:
        None.
    """
    raw = raw_text.strip()
    if not raw.startswith("```"):
        return raw

    raw = raw.removeprefix("```").strip()
    if raw.startswith("json"):
        raw = raw[4:].strip()
    return raw.removesuffix("```").strip()


def _fallback_claims_from_text(text: str) -> list[str]:
    """
    Extract obvious election-rule claims when Gemini extraction fails.

    Args:
        text: OCR text from a forwarded image.

    Returns:
        Up to eight deduplicated claim strings.

    Raises:
        None.
    """
    normalized = re.sub(r"\s+", " ", text.replace("\n", ". ")).strip()
    candidates = re.split(r"(?<=[.!?])\s+|;\s+", normalized)
    claims = []
    for candidate in candidates:
        cleaned = candidate.strip(" -•\t")
        if len(cleaned) < 12:
            continue
        if any(keyword in cleaned.lower() for keyword in CLAIM_KEYWORDS):
            claims.append(cleaned if cleaned.endswith((".", "!", "?")) else f"{cleaned}.")
    return list(dict.fromkeys(claims))[:8]


def _chunk_text(chunk: RetrievedChunk | str) -> str:
    """
    Format a retrieved chunk for prompt context.

    Args:
        chunk: RetrievedChunk instance or raw context string.

    Returns:
        Prompt-ready context text.

    Raises:
        None.
    """
    if isinstance(chunk, RetrievedChunk):
        page = f", Page {chunk.page_number}" if chunk.page_number is not None else ""
        return f"[Source: {chunk.document_name}{page}]\n{chunk.text}"
    return chunk


def _sources_from_chunks(chunks: Sequence[RetrievedChunk | str]) -> list[SourceCitation]:
    """
    Build citations from retrieved chunk metadata.

    Args:
        chunks: Retrieved chunks or raw context strings.

    Returns:
        Deduplicated source citations.

    Raises:
        None.
    """
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


class GeminiService:
    """Dependency-injected Gemini orchestration service."""

    def __init__(self, settings: Settings) -> None:
        """
        Initialize the Gemini service with runtime settings.

        Args:
            settings: Application settings from FastAPI dependency injection.

        Returns:
            None.

        Raises:
            None.
        """
        if settings.gemini_api_key and genai is not None:
            genai.configure(api_key=settings.gemini_api_key)
        self.model = (
            genai.GenerativeModel(GEMINI_MODEL_NAME)
            if genai is not None
            else MissingGeminiModel()
        )

    async def assess_input_safety(self, question: str) -> tuple[bool, str]:
        """
        Class-based safety check entry point for FastAPI dependencies.

        Args:
            question: User question to classify.

        Returns:
            Tuple of is_safe and reason.

        Raises:
            None.
        """
        return await _assess_input_safety_impl(question, self.model)

    async def generate_answer(
        self,
        question: str,
        context_chunks: Sequence[RetrievedChunk | str],
        language: str = "en",
    ) -> dict[str, Any]:
        """
        Class-based answer generation entry point.

        Args:
            question: Voter question.
            context_chunks: Retrieved RAG context.
            language: Response language code.

        Returns:
            Dict with answer, confidence, and sources.

        Raises:
            None.
        """
        return await _generate_answer_impl(question, context_chunks, language, self.model)

    async def extract_claims_from_text(self, text: str) -> list[str]:
        """
        Class-based claim extraction entry point.

        Args:
            text: OCR text from a forward image.

        Returns:
            Extracted claims.

        Raises:
            None.
        """
        return await _extract_claims_from_text_impl(text, self.model)

    async def verify_single_claim(
        self,
        claim: str,
        context_chunks: Sequence[RetrievedChunk | str],
    ) -> ClaimVerification:
        """
        Class-based claim verification entry point.

        Args:
            claim: Single factual claim.
            context_chunks: Retrieved RAG context.

        Returns:
            ClaimVerification with verdict and sources.

        Raises:
            None.
        """
        return await _verify_single_claim_impl(claim, context_chunks, self.model)


def get_gemini_service(settings: Settings = get_settings()) -> GeminiService:
    """
    Build a GeminiService instance for route dependency injection.

    Args:
        settings: Application settings.

    Returns:
        Configured GeminiService instance.

    Raises:
        None.
    """
    return GeminiService(settings)


async def _assess_input_safety_impl(question: str, active_model: Any) -> tuple[bool, str]:
    """
    Use Gemini as a second-layer safety classifier for adversarial prompts.

    Args:
        question: User question to classify.

    Returns:
        Tuple of is_safe and reason. Outages fail closed to protect the API.

    Raises:
        None.
    """
    cache_key = f"safety:{question}"
    cached = cache_service.cache.get(cache_key)
    if cached is not None:
        logger.info("input_safety_cache_hit")
        return bool(cached.get("is_safe", True)), str(cached.get("reason", ""))

    prompt = f"{INPUT_SAFETY_PROMPT_V1}\n\nUSER MESSAGE:\n{question}"
    try:
        response = await asyncio.wait_for(
            asyncio.to_thread(active_model.generate_content, prompt),
            timeout=INPUT_SAFETY_TIMEOUT_SECONDS,
        )
        data = json.loads(_strip_json_fence(response.text))
        result = {
            "is_safe": bool(data.get("is_safe", True)),
            "reason": str(data.get("reason", "")),
        }
        cache_service.cache.set(cache_key, result)
        return result["is_safe"], result["reason"]
    except (asyncio.TimeoutError, json.JSONDecodeError, GoogleAPIError, RuntimeError, ValueError, TypeError) as exc:
        logger.warning("input_safety_classifier_unavailable error=%s", str(exc))
        return False, "Safety system offline. Request rejected for security."


async def _generate_answer_impl(
    question: str,
    context_chunks: Sequence[RetrievedChunk | str],
    language: str = "en",
    active_model: Any = model,
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

    Raises:
        None. Gemini failures return a source-backed fallback answer.
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
            asyncio.to_thread(active_model.generate_content, prompt),
            timeout=GEMINI_TIMEOUT_SECONDS,
        )
        logger.info("gemini_answer_generated question_length=%s", len(question))
        return {
            "answer": response.text,
            "confidence": _similarity_confidence(context_chunks),
            "sources": [source.model_dump() for source in sources],
        }
    except (asyncio.TimeoutError, GoogleAPIError, RuntimeError, ValueError, TypeError) as exc:
        logger.error("gemini_answer_failed error=%s", str(exc))
        return _fallback_answer(question, context_chunks, language)


async def _extract_claims_from_text_impl(text: str, active_model: Any = model) -> list[str]:
    """
    Extracts verifiable factual claims from WhatsApp forward text using Gemini with
    structured JSON output.

    Args:
        text: Raw text extracted from image via OCR.

    Returns:
        List of claim strings ready for RAG verification.

    Raises:
        None. Gemini and JSON parsing failures use keyword fallback extraction.
    """
    prompt = f"{CLAIM_EXTRACTION_PROMPT_V1}\n\nWHATSAPP FORWARD TEXT:\n{text}"

    try:
        response = await asyncio.wait_for(
            asyncio.to_thread(active_model.generate_content, prompt),
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
    except (asyncio.TimeoutError, json.JSONDecodeError, GoogleAPIError, RuntimeError, ValueError, TypeError) as exc:
        logger.error("claim_extraction_failed error=%s", str(exc))
        return _fallback_claims_from_text(text)


async def _verify_single_claim_impl(
    claim: str,
    context_chunks: Sequence[RetrievedChunk | str],
    active_model: Any = model,
) -> ClaimVerification:
    """
    Verifies a single extracted claim against ECI document context.

    Args:
        claim: Single factual claim to verify.
        context_chunks: Retrieved RAG chunks for this claim.

    Returns:
        ClaimVerification with verdict, explanation, confidence, sources.

    Raises:
        None. Model, parsing, and validation failures return UNVERIFIABLE.
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
            asyncio.to_thread(active_model.generate_content, prompt),
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
    except (
        asyncio.TimeoutError,
        json.JSONDecodeError,
        GoogleAPIError,
        RuntimeError,
        ValueError,
        TypeError,
        KeyError,
    ) as exc:
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


async def assess_input_safety(question: str) -> tuple[bool, str]:
    """
    Backward-compatible module wrapper for safety checks.

    Args:
        question: User question to classify.

    Returns:
        Tuple of is_safe and reason.

    Raises:
        None.
    """
    return await _assess_input_safety_impl(question, model)


async def generate_answer(
    question: str,
    context_chunks: Sequence[RetrievedChunk | str],
    language: str = "en",
) -> dict[str, Any]:
    """
    Backward-compatible module wrapper for answer generation.

    Args:
        question: Voter question.
        context_chunks: Retrieved RAG context.
        language: Response language code.

    Returns:
        Dict with answer, confidence, and sources.

    Raises:
        None.
    """
    return await _generate_answer_impl(question, context_chunks, language, model)


async def extract_claims_from_text(text: str) -> list[str]:
    """
    Backward-compatible module wrapper for claim extraction.

    Args:
        text: OCR text from a forward image.

    Returns:
        Extracted claims.

    Raises:
        None.
    """
    return await _extract_claims_from_text_impl(text, model)


async def verify_single_claim(
    claim: str,
    context_chunks: Sequence[RetrievedChunk | str],
) -> ClaimVerification:
    """
    Backward-compatible module wrapper for single-claim verification.

    Args:
        claim: Single factual claim.
        context_chunks: Retrieved RAG context.

    Returns:
        ClaimVerification with verdict and sources.

    Raises:
        None.
    """
    return await _verify_single_claim_impl(claim, context_chunks, model)
