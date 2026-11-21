import pytest

from app.config import DEFAULT_OPENROUTER_MODEL, Settings


@pytest.fixture(autouse=True)
def clean_openrouter_env(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_MODEL", raising=False)


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
