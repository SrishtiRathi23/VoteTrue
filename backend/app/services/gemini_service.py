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

logger = get_logger(__name__)

try:
    from google.api_core.exceptions import GoogleAPIError
    import google.generativeai as genai
except ImportError:
    GoogleAPIError = RuntimeError
    genai = None


class MissingGeminiModel:
    """Placeholder model used when Gemini is unavailable locally."""

    def generate_content(self, prompt: str) -> Any:
        """
        Raise a clear error for unavailable Gemini calls.

        Args:
            prompt: Prompt that would have been sent to Gemini.

        Returns:
            Never returns successfully.

        Raises:
            RuntimeError: Always raised because the SDK is unavailable.
        """
        raise RuntimeError("Gemini SDK is not installed or configured")


class GeminiService:
    """Gemini orchestration service for safety, answers, and claim verification."""

    def __init__(
        self,
        settings: Settings | None = None,
        active_model: Any | None = None,
    ) -> None:
        """
        Initialize Gemini dependencies.

        Args:
            settings: Runtime settings. Defaults to cached application settings.
            active_model: Optional test double or prebuilt Gemini model.

        Returns:
            None.

        Raises:
            None.
        """
        self.settings = settings or get_settings()
        if self.settings.gemini_api_key and genai is not None:
            genai.configure(api_key=self.settings.gemini_api_key)
        self.model = active_model or (
            genai.GenerativeModel(GEMINI_MODEL_NAME)
            if genai is not None
            else MissingGeminiModel()
        )

    async def assess_input_safety(self, question: str) -> tuple[bool, str]:
        """
        Classify whether a user question is safe for neutral election support.

        Args:
            question: User question to classify.

        Returns:
            Tuple of is_safe and reason. Safety outages fail closed.

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
                asyncio.to_thread(self.model.generate_content, prompt),
                timeout=INPUT_SAFETY_TIMEOUT_SECONDS,
            )
            data = json.loads(_strip_json_fence(response.text))
            result = {
                "is_safe": bool(data.get("is_safe", True)),
                "reason": str(data.get("reason", "")),
            }
            cache_service.cache.set(cache_key, result)
            return result["is_safe"], result["reason"]
        except (
            asyncio.TimeoutError,
            json.JSONDecodeError,
            GoogleAPIError,
            RuntimeError,
            ValueError,
            TypeError,
        ) as exc:
            logger.warning("input_safety_classifier_unavailable error=%s", str(exc))
            return False, "Safety system offline. Request rejected for security."

    async def generate_answer(
        self,
        question: str,
        context_chunks: Sequence[RetrievedChunk | str],
        language: str = "en",
    ) -> dict[str, Any]:
        """
        Generate a source-cited answer from retrieved ECI context.

        Args:
            question: Voter question.
            context_chunks: Retrieved RAG chunks.
            language: Response language code.

        Returns:
            Dict with answer, confidence, and source citations.

        Raises:
            None. Gemini failures return a grounded fallback answer.
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
                asyncio.to_thread(self.model.generate_content, prompt),
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
            return _fallback_answer(context_chunks, language)

    async def extract_claims_from_text(self, text: str) -> list[str]:
        """
        Extract verifiable election claims from OCR text.

        Args:
            text: Raw text extracted from a forward image.

        Returns:
            Up to eight claim strings ready for RAG verification.

        Raises:
            None. Model and JSON failures use keyword fallback extraction.
        """
        prompt = f"{CLAIM_EXTRACTION_PROMPT_V1}\n\nWHATSAPP FORWARD TEXT:\n{text}"
        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(self.model.generate_content, prompt),
                timeout=GEMINI_TIMEOUT_SECONDS,
            )
            claims = json.loads(_strip_json_fence(response.text))
            if not isinstance(claims, list):
                return _fallback_claims_from_text(text)
            clean_claims = [str(claim).strip() for claim in claims if str(claim).strip()]
            return (clean_claims or _fallback_claims_from_text(text))[:8]
        except (
            asyncio.TimeoutError,
            json.JSONDecodeError,
            GoogleAPIError,
            RuntimeError,
            ValueError,
            TypeError,
        ) as exc:
            logger.error("claim_extraction_failed error=%s", str(exc))
            return _fallback_claims_from_text(text)

    async def verify_single_claim(
        self,
        claim: str,
        context_chunks: Sequence[RetrievedChunk | str],
    ) -> ClaimVerification:
        """
        Verify one extracted claim against retrieved ECI context.

        Args:
            claim: Single factual claim to verify.
            context_chunks: Retrieved RAG chunks for the claim.

        Returns:
            ClaimVerification with verdict, explanation, confidence, and sources.

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
                asyncio.to_thread(self.model.generate_content, prompt),
                timeout=GEMINI_TIMEOUT_SECONDS,
            )
            data = json.loads(_strip_json_fence(response.text))
            sources = [
                SourceCitation(
                    document_name=str(data["source_document"]),
                    page_number=data.get("source_page"),
                )
            ] if data.get("source_document") else fallback_sources
            return ClaimVerification(
                claim=claim,
                verdict=Verdict(data["verdict"]),
                explanation=str(data["explanation"]),
                confidence=float(data["confidence"]),
                sources=sources,
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


def _similarity_confidence(context_chunks: Sequence[RetrievedChunk | str]) -> float:
    """
    Report confidence from retrieval similarity only.

    Args:
        context_chunks: Retrieved chunks or raw context strings.

    Returns:
        Highest similarity score, or 0.0 when none exists.

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
    context_chunks: Sequence[RetrievedChunk | str],
    language: str,
) -> dict[str, Any]:
    """
    Build a conservative answer from retrieved context.

    Args:
        context_chunks: Retrieved chunks used for grounding.
        language: Response language code.

    Returns:
        Fallback answer with honest confidence and citations.

    Raises:
        IndexError: If called with no context chunks.
    """
    sources = _sources_from_chunks(context_chunks)
    first = context_chunks[0]
    text = first.text if isinstance(first, RetrievedChunk) else str(first)
    prefix = "Official ECI context ke aadhaar par: " if language == "hi" else "Based on official ECI context, "
    return {
        "answer": f"{prefix}{_clean_source_text(text)[:420].strip()}",
        "confidence": _similarity_confidence(context_chunks),
        "sources": [source.model_dump() for source in sources],
    }


def _clean_source_text(text: str) -> str:
    """
    Remove source boilerplate from fallback text.

    Args:
        text: Raw chunk text.

    Returns:
        Cleaned text, or the original text if cleaning removes everything.

    Raises:
        None.
    """
    lines = [
        line
        for line in text.splitlines()
        if not line.startswith("Source:") and not line.startswith("Official URL:")
    ]
    return " ".join(lines).strip() or text


def _strip_json_fence(raw_text: str) -> str:
    """
    Remove markdown JSON fences from model output.

    Args:
        raw_text: Raw model text.

    Returns:
        JSON-like text without surrounding fences.

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
    Extract obvious election-rule claims without Gemini.

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
        cleaned = candidate.strip(" -â€¢\t")
        if len(cleaned) >= 12 and any(keyword in cleaned.lower() for keyword in CLAIM_KEYWORDS):
            claims.append(cleaned if cleaned.endswith((".", "!", "?")) else f"{cleaned}.")
    return list(dict.fromkeys(claims))[:8]


def _chunk_text(chunk: RetrievedChunk | str) -> str:
    """
    Format a retrieved chunk for prompts.

    Args:
        chunk: RetrievedChunk or raw context text.

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
    Build deduplicated source citations from retrieved chunks.

    Args:
        chunks: Retrieved chunks or raw context strings.

    Returns:
        Source citations for RetrievedChunk inputs.

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
