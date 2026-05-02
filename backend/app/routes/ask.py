from fastapi import APIRouter, HTTPException

from app.models.request_models import AskRequest
from app.models.response_models import AskResponse
from app.services import cache_service, gemini_service, rag_service
from app.utils.logger import get_logger
from app.utils.validators import reject_prompt_injection

router = APIRouter()
logger = get_logger(__name__)


@router.post("/ask", response_model=AskResponse)
async def ask_votetrue(request: AskRequest) -> AskResponse:
    """
    Core Ask VoteTrue endpoint. Accepts a voter question, retrieves relevant ECI
    document chunks via RAG, and returns a Gemini-generated cited answer.

    Rate limited to 20 requests/minute per IP.
    Results cached for 1 hour for identical queries.
    """
    reject_prompt_injection(request.question)
    is_safe, reason = await gemini_service.assess_input_safety(request.question)
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

    context_chunks = await rag_service.query_documents(request.question)

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

    result = await gemini_service.generate_answer(
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
