from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables.
    All secrets are loaded via Secret Manager in production.
    """

    gemini_api_key: str = ""
    google_cloud_project: str = ""
    google_application_credentials: str = ""
    environment: str = "development"
    allowed_origins: str = "http://localhost:3000"
    max_requests_per_minute: int = 20
    redis_url: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def cors_origins(self) -> list[str]:
        """Returns CORS origins from a comma-separated environment value."""
        return [
            origin.strip()
            for origin in self.allowed_origins.split(",")
            if origin.strip()
        ] or ["http://localhost:3000"]


def _secret_manager_gemini_key(settings: Settings) -> str | None:
    """Fetches GEMINI_API_KEY from Secret Manager in production if available."""
    if settings.environment != "production" or not settings.google_cloud_project:
        return None
    try:
        from google.cloud import secretmanager

        client = secretmanager.SecretManagerServiceClient()
        name = (
            f"projects/{settings.google_cloud_project}/secrets/"
            "GEMINI_API_KEY/versions/latest"
        )
        response = client.access_secret_version(request={"name": name})
        return response.payload.data.decode("utf-8")
    except Exception:
        return None


@lru_cache
def get_settings() -> Settings:
    """Returns cached settings instance."""
    settings = Settings()
    secret_key = _secret_manager_gemini_key(settings)
    if secret_key:
        settings.gemini_api_key = secret_key
    return settings
