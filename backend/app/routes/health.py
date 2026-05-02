from fastapi import APIRouter

from app.config import get_settings
from app.models.response_models import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Health check endpoint. Confirms all services are configured.
    Used by Cloud Run to verify container is healthy.

    Args:
        None.

    Returns:
        HealthResponse with environment and service configuration status.

    Raises:
        None.
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
    """
    Serve the HEAD variant for curl and load balancer checks.

    Args:
        None.

    Returns:
        None.

    Raises:
        None.
    """
    return None
