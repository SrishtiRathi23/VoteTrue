from fastapi import APIRouter, Depends, HTTPException

from app.config import Settings, get_settings
from app.models.request_models import AskRequest
from app.models.response_models import AskResponse
from app.services import cache_service, gemini_service
from app.services.gemini_service import GeminiService
from app.services.rag_service import RAGService
from app.utils.logger import get_logger
from app.utils.validators import reject_prompt_injection

router = APIRouter()
logger = get_logger(__name__)


def get_gemini_service(settings: Settings = Depends(get_settings)) -> GeminiService:
    """
    Provide a request-scoped Gemini service.

    Args:
        settings: Application settings supplied by FastAPI.

    Returns:
        Configured GeminiService instance.

    Raises:
        None.
    """
    return GeminiService(settings)


def get_rag_service() -> RAGService:
    """
    Provide a request-scoped RAG service.

    Args:
        None.

    Returns:
        Configured RAGService instance.

    Raises:
        None.
    """
    return RAGService()


@router.post("/ask", response_model=AskResponse)
async def ask_votetrue(
    request: AskRequest,
    gemini: GeminiService = Depends(get_gemini_service),
    rag: RAGService = Depends(get_rag_service),
) -> AskResponse:
    """
    Core Ask VoteTrue endpoint. Accepts a voter question, retrieves relevant ECI
    document chunks via RAG, and returns a Gemini-generated cited answer.

    Rate limited to 20 requests/minute per IP.
    Results cached for 1 hour for identical queries.

    Args:
        request: Validated voter question and language preference.

    Returns:
        Cited answer with confidence, sources, and response language.

    Raises:
        HTTPException: If the request is rejected by prompt-injection or safety
            controls.
    """
    reject_prompt_injection(request.question)
    is_safe, reason = await gemini.assess_input_safety(request.question)
    if not is_safe:
        logger.warning("ask_input_rejected_by_safety_classifier reason=%s", reason)
        raise HTTPException(
            status_code=400,
            detail="VoteTrue only verifies factual election information from official sources.",
        )

    cache_key = f"{request.language}:{request.question}"
    cached = cache_service.cache.get(cache_key)
    if cached:
        logger.info("ask_cache_returned")
        return AskResponse(**cached)

    context_chunks = await rag.query_documents(request.question)

    if not context_chunks:
        return AskResponse(
            answer=(
                "I could not find relevant information in official ECI documents "
                "to answer this question. Please visit eci.gov.in for authoritative "
                "information."
            ),
            sources=[],
            confidence=0.0,
            language=request.language,
        )

    result = await gemini.generate_answer(
        question=request.question,
        context_chunks=context_chunks,
        language=request.language,
    )

    response_data = {
        "answer": result["answer"],
        "sources": result["sources"],
        "confidence": result["confidence"],
        "language": request.language,
    }

    cache_service.cache.set(cache_key, response_data)
    return AskResponse(**response_data)
