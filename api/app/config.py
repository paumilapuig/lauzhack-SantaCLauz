from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

# Text + vision, JSON mode, ~3 s per lesson (measured Sun 22 Nov). Any OpenRouter model id works for text.
DEFAULT_OPENROUTER_MODEL = "google/gemini-2.5-flash-lite"
# Photos and scanned PDFs need a model that reads images; text-only models (e.g. Llama 3.3) return 404.
DEFAULT_VISION_MODEL = "google/gemini-2.5-flash-lite"


class Settings(BaseSettings):
    """Runtime configuration read from api/.env (see api/.env.example)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str
    supabase_secret_key: str
    cors_origins: str = "http://localhost:3000"
    openrouter_api_key: str | None = None
    openrouter_model: str | None = None
    openrouter_vision_model: str | None = None

    def resolved_model(self) -> str:
        return self.openrouter_model or DEFAULT_OPENROUTER_MODEL

    def resolved_vision_model(self) -> str:
        return self.openrouter_vision_model or DEFAULT_VISION_MODEL

    def model_for(self, has_images: bool) -> str:
        """The model for one call: the vision model whenever the prompt carries images."""
        return self.resolved_vision_model() if has_images else self.resolved_model()

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
