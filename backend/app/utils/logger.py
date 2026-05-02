import logging
from functools import lru_cache
from typing import Any

from app.config import get_settings


@lru_cache
def _cloud_handler() -> Any:
    """Creates a cached Cloud Logging handler for production."""
    import google.cloud.logging
    from google.cloud.logging.handlers import CloudLoggingHandler

    settings = get_settings()
    client = google.cloud.logging.Client(project=settings.google_cloud_project)
    return CloudLoggingHandler(client)


def get_logger(name: str) -> logging.Logger:
    """
    Returns a logger that writes to Google Cloud Logging in production and stdout
    in development.

    Args:
        name: Logger name, typically __name__ of calling module.

    Returns:
        Configured Python logger instance.
    """
    settings = get_settings()
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    logger.propagate = False

    if logger.handlers:
        return logger

    if settings.environment == "production":
        logger.addHandler(_cloud_handler())
    else:
        handler = logging.StreamHandler()
        handler.setFormatter(
            logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s")
        )
        logger.addHandler(handler)

    return logger
