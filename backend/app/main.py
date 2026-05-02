"""
VoteTrue Backend API
====================

FastAPI application providing election information verification services for
Indian voters.

Endpoints:
    GET  /api/v1/health        - Service health check
    POST /api/v1/ask           - RAG-powered election Q&A
    POST /api/v1/verify-forward - WhatsApp forward verification

Google Services Used:
    - Gemini 1.5 Flash for answer generation and claim verification
    - Gemini text-embedding-004 for RAG embeddings
    - Google Cloud Vision API for OCR
    - Google Cloud Logging for production logs
    - Google Secret Manager for production credentials
    - Google Cloud Run target deployment

Security:
    - No hardcoded secrets
    - In-memory rate limiting
    - Strict upload validation
    - Security headers on all responses
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.middleware.security import SecurityHeadersMiddleware
from app.routes import ask, health, verify_forward
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)

app = FastAPI(
    title="VoteTrue API",
    description="WhatsApp Forward Verification Engine - grounded in official ECI documents.",
    version="1.0.0",
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url=None,
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimiterMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(ask.router, prefix="/api/v1", tags=["ask"])
app.include_router(verify_forward.router, prefix="/api/v1", tags=["forward-verification"])


@app.on_event("startup")
async def startup_log() -> None:
    """Logs production-readiness signals for Cloud Run startup."""
    logger.info("votetrue_startup environment=%s", settings.environment)
    logger.info("whatsapp_forward_verification_engine_ready")
