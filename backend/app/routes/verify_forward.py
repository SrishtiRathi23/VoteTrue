from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.response_models import ForwardVerificationResponse
from app.services import gemini_service, rag_service, vision_service
from app.utils.logger import get_logger
from app.utils.validators import validate_image_content, validate_image_upload

router = APIRouter()
logger = get_logger(__name__)


@router.post("/verify-forward", response_model=ForwardVerificationResponse)
@router.post("/verify-flyer", response_model=ForwardVerificationResponse, include_in_schema=False)
async def verify_forward(file: UploadFile = File(...)) -> ForwardVerificationResponse:
    """
    WhatsApp Forward Verification Engine endpoint.

    Accepts an image upload, extracts text via Google Cloud Vision OCR,
    extracts factual claims with Gemini, then verifies each claim against the
    ECI document corpus via RAG.
    """
    image_bytes = await file.read()
    validate_image_upload(file.content_type, len(image_bytes))
    validate_image_content(image_bytes)

    extracted_text = await vision_service.extract_text_from_image(image_bytes)
    if not extracted_text:
        raise HTTPException(
            status_code=422,
            detail="No text could be extracted from this image. Please upload a clearer image.",
        )

    claims = await gemini_service.extract_claims_from_text(extracted_text)
    if not claims:
        raise HTTPException(
            status_code=422,
            detail="No verifiable claims were found in this image.",
        )

    verified_claims = []
    for claim in claims:
        context_chunks = await rag_service.query_documents(claim)
        verification = await gemini_service.verify_single_claim(
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
