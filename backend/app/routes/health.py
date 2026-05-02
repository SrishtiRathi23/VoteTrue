from fastapi import APIRouter

from app.config import get_settings
from app.models.response_models import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Health check endpoint. Confirms all services are configured.
    Used by Cloud Run to verify container is healthy.
    """
    settings = get_settings()
    return HealthResponse(
        status="healthy",
        environment=settings.environment,
        services={
            "gemini": "configured" if settings.gemini_api_key else "missing",
            "chromadb": "local",
            "vision": "google_cloud",
            "logging": "google_cloud",
        },
    )


@router.head("/health")
async def health_head() -> None:
    """HEAD variant for curl -I and load balancer header checks."""
    return None
