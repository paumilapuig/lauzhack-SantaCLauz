import pytest

from app.config import DEFAULT_OPENROUTER_MODEL, DEFAULT_VISION_MODEL, Settings


@pytest.fixture(autouse=True)
def clean_openrouter_env(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_MODEL", raising=False)
    monkeypatch.delenv("OPENROUTER_VISION_MODEL", raising=False)


def test_openrouter_settings_default_to_none():
    settings = Settings(_env_file=None)

    assert settings.openrouter_api_key is None
    assert settings.openrouter_model is None


def test_resolved_model_falls_back_to_default():
    settings = Settings(_env_file=None)

    assert settings.resolved_model() == DEFAULT_OPENROUTER_MODEL


def test_resolved_model_uses_override():
    settings = Settings(_env_file=None, openrouter_model="vendor/custom-model")

    assert settings.resolved_model() == "vendor/custom-model"


def test_default_model_is_gemini_flash_lite():
    assert DEFAULT_OPENROUTER_MODEL == "google/gemini-2.5-flash-lite"


def test_vision_model_defaults_to_a_model_that_reads_images():
    settings = Settings(_env_file=None, openrouter_model="meta-llama/llama-3.3-70b-instruct")

    assert settings.resolved_vision_model() == DEFAULT_VISION_MODEL == "google/gemini-2.5-flash-lite"


def test_vision_model_uses_override():
    settings = Settings(_env_file=None, openrouter_vision_model="vendor/vision")

    assert settings.resolved_vision_model() == "vendor/vision"


def test_model_for_picks_vision_only_when_there_are_images():
    settings = Settings(_env_file=None, openrouter_model="text/m", openrouter_vision_model="vision/m")

    assert settings.model_for(has_images=False) == "text/m"
    assert settings.model_for(has_images=True) == "vision/m"
