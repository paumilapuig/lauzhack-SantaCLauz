from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

# Open-weights model (Llama 3.3 70B) hosted on OpenRouter.
DEFAULT_OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct"


class Settings(BaseSettings):
    """Runtime configuration read from api/.env (see api/.env.example)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str
    supabase_secret_key: str
    cors_origins: str = "http://localhost:3000"
    openrouter_api_key: str | None = None
    openrouter_model: str | None = None

    def resolved_model(self) -> str:
        return self.openrouter_model or DEFAULT_OPENROUTER_MODEL

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
