from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.config import Settings, get_settings
from app.models.response_models import ForwardVerificationResponse
from app.services.gemini_service import GeminiService
from app.services.rag_service import RAGService
from app.services.vision_service import VisionService
from app.utils.logger import get_logger
from app.utils.validators import validate_image_content, validate_image_upload

router = APIRouter()
logger = get_logger(__name__)


def get_gemini_service(settings: Settings = Depends(get_settings)) -> GeminiService:
    """
    Provide a request-scoped Gemini service for forward verification.

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
    Provide a request-scoped RAG service for claim grounding.

    Args:
        None.

    Returns:
        Configured RAGService instance.

    Raises:
        None.
    """
    return RAGService()


def get_vision_service() -> VisionService:
    """
    Provide a request-scoped Vision OCR service.

    Args:
        None.

    Returns:
        Configured VisionService instance.

    Raises:
        None.
    """
    return VisionService()


@router.post("/verify-forward", response_model=ForwardVerificationResponse)
@router.post("/verify-flyer", response_model=ForwardVerificationResponse, include_in_schema=False)
async def verify_forward(
    file: UploadFile = File(...),
    gemini: GeminiService = Depends(get_gemini_service),
    rag: RAGService = Depends(get_rag_service),
    vision: VisionService = Depends(get_vision_service),
) -> ForwardVerificationResponse:
    """
    WhatsApp Forward Verification Engine endpoint.

    Accepts an image upload, extracts text via Google Cloud Vision OCR,
    extracts factual claims with Gemini, then verifies each claim against the
    ECI document corpus via RAG.

    Args:
        file: Uploaded WhatsApp forward screenshot.

    Returns:
        Extracted text and per-claim verification verdicts.

    Raises:
        HTTPException: If the upload is invalid, OCR finds no text, or no
            verifiable election claims are present.
    """
    image_bytes = await file.read()
    validate_image_upload(file.content_type, len(image_bytes))
    validate_image_content(image_bytes)

    extracted_text = await vision.extract_text_from_image(image_bytes)
    if not extracted_text:
        raise HTTPException(
            status_code=422,
            detail="No text could be extracted from this image. Please upload a clearer image.",
        )

    claims = await gemini.extract_claims_from_text(extracted_text)
    if not claims:
        raise HTTPException(
            status_code=422,
            detail="No verifiable claims were found in this image.",
        )

    verified_claims = []
    for claim in claims:
        context_chunks = await rag.query_documents(claim)
        verification = await gemini.verify_single_claim(
            claim=claim,
            context_chunks=context_chunks,
        )
        verified_claims.append(verification)

    logger.info("forward_claims_verified count=%s", len(verified_claims))
    return ForwardVerificationResponse(
        extracted_text=extracted_text,
        claims=verified_claims,
        total_claims=len(verified_claims),
    )
