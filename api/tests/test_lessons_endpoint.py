import io

import pymupdf
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from PIL import Image

import app.roles as roles
import app.routers.lessons as router
from app.auth import get_current_user
from app.config import Settings, get_settings
from app.glossary.errors import TooLarge
from app.glossary.generate import Metrics
from app.glossary.openrouter_client import OpenRouterError
from app.glossary.parser import GlossaryParseError
from app.glossary.schema import GlossaryResult, GlossaryTerm
from app.lessons_service import LessonSaveError
from app.main import app
from app.schemas import CreateLessonResponse, CurrentUser, LessonTerm, Profile

TEACHER = CurrentUser(id="teacher-1", email="t@example.com")
FAKE_KEY = "sk-fake-key-123"
JSON_BODY = {
    "title": "La respiration",
    "subject": "Biologie",
    "lesson_date": "2026-11-21",
    "source_text": "Les poumons apportent l'oxygene.",
}
FORM_FIELDS = {"title": "La respiration", "subject": "Biologie", "lesson_date": "2026-11-21"}


def _settings(api_key: str | None = FAKE_KEY) -> Settings:
    return Settings(
        _env_file=None,
        supabase_url="https://example.supabase.co",
        supabase_secret_key="x",
        openrouter_api_key=api_key,
    )


class Recorder:
    def __init__(self):
        self.generate_calls: list[tuple] = []
        self.create_calls: list[tuple] = []
        self.generate_error: Exception | None = None
        self.save_error: Exception | None = None


@pytest.fixture
def recorder(monkeypatch) -> Recorder:
    rec = Recorder()
    term = GlossaryTerm(
        lemma="poumon", forms=["poumon", "poumons"], translation_es="pulmon",
        definition_fr="organe", transparent=False, key_phrase="les poumons",
    )

    def fake_generate(source_text, jpeg_images, model, api_key, http=None):
        rec.generate_calls.append((source_text, list(jpeg_images), model, api_key))
        if rec.generate_error:
            raise rec.generate_error
        return GlossaryResult(terms=[term]), Metrics(0.1, 1, 1, 0.0, 0, 0)

    def fake_create(user, meta, terms, db=None):
        rec.create_calls.append((user, meta, terms))
        if rec.save_error:
            raise rec.save_error
        return CreateLessonResponse(
            lesson_id="lesson-1",
            terms=[LessonTerm(**term.model_dump(), id="t-1", lesson_id="lesson-1")],
        )

    monkeypatch.setattr(router, "generate_glossary", fake_generate)
    monkeypatch.setattr(router, "create_lesson", fake_create)
    return rec


@pytest.fixture
def api_settings():
    holder = {"value": _settings()}
    app.dependency_overrides[get_settings] = lambda: holder["value"]
    yield holder
    app.dependency_overrides.pop(get_settings, None)


@pytest.fixture
def teacher_client(recorder, api_settings, monkeypatch):
    monkeypatch.setattr(
        roles, "fetch_profile", lambda user_id: Profile(display_name="t", role="teacher")
    )
    app.dependency_overrides[get_current_user] = lambda: TEACHER
    yield TestClient(app)
    app.dependency_overrides.pop(get_current_user, None)


def _png() -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (50, 50), "white").save(buffer, "PNG")
    return buffer.getvalue()


def _pdf() -> bytes:
    doc = pymupdf.open()
    doc.new_page().insert_text((72, 72), "Les poumons apportent l'oxygene.")
    return doc.tobytes()


def _post_file(client, filename, content, content_type):
    return client.post(
        "/api/lessons", data=FORM_FIELDS, files={"file": (filename, content, content_type)}
    )


def test_requires_token(recorder, api_settings):
    assert TestClient(app).post("/api/lessons", json=JSON_BODY).status_code == 401


def test_student_is_forbidden(recorder, api_settings, monkeypatch):
    monkeypatch.setattr(
        roles, "fetch_profile", lambda user_id: Profile(display_name="s", role="student")
    )
    app.dependency_overrides[get_current_user] = lambda: TEACHER
    try:
        response = TestClient(app).post("/api/lessons", json=JSON_BODY)
    finally:
        app.dependency_overrides.pop(get_current_user, None)
    assert response.status_code == 403
    assert recorder.generate_calls == []


def test_json_success(teacher_client, recorder):
    response = teacher_client.post("/api/lessons", json=JSON_BODY)

    assert response.status_code == 200
    assert response.json()["lesson_id"] == "lesson-1"
    assert response.json()["terms"][0]["lemma"] == "poumon"
    assert len(recorder.generate_calls) == 1
    source_text, images, _model, api_key = recorder.generate_calls[0]
    assert (source_text, images, api_key) == (JSON_BODY["source_text"], [], FAKE_KEY)
    user, meta, terms = recorder.create_calls[0]
    assert user == TEACHER
    assert meta.source_text == JSON_BODY["source_text"]
    assert [t.lemma for t in terms] == ["poumon"]


def test_multipart_txt_success(teacher_client, recorder):
    response = _post_file(teacher_client, "notes.txt", b"Bonjour la classe", "text/plain")

    assert response.status_code == 200
    assert recorder.generate_calls[0][0] == "Bonjour la classe"
    assert recorder.create_calls[0][1].source_text == "Bonjour la classe"
    assert recorder.create_calls[0][0] == TEACHER


def test_multipart_pdf_success(teacher_client, recorder):
    response = _post_file(teacher_client, "notes.pdf", _pdf(), "application/pdf")

    assert response.status_code == 200
    assert "poumons" in recorder.generate_calls[0][0]
    assert len(recorder.generate_calls) == 1


def test_multipart_png_success_stores_empty_source_text(teacher_client, recorder):
    response = _post_file(teacher_client, "photo.png", _png(), "image/png")

    assert response.status_code == 200
    source_text, images, _model, _key = recorder.generate_calls[0]
    assert source_text == "" and len(images) == 1
    assert recorder.create_calls[0][1].source_text == ""


def test_too_large_is_413(teacher_client, recorder, monkeypatch):
    monkeypatch.setattr("app.glossary.upload.MAX_UPLOAD_BYTES", 10)
    response = _post_file(teacher_client, "notes.txt", b"x" * 50, "text/plain")

    assert response.status_code == 413
    assert recorder.generate_calls == []


def test_unsupported_file_is_415(teacher_client, recorder):
    response = _post_file(teacher_client, "notes.docx", b"abc", "application/msword")

    assert response.status_code == 415
    assert recorder.generate_calls == []


def test_unsupported_content_type_is_415(teacher_client, recorder):
    response = teacher_client.post(
        "/api/lessons", content="hello", headers={"content-type": "text/plain"}
    )

    assert response.status_code == 415
    assert recorder.generate_calls == []


def test_blank_json_source_text_is_422_before_llm(teacher_client, recorder):
    response = teacher_client.post("/api/lessons", json={**JSON_BODY, "source_text": "  "})

    assert response.status_code == 422
    assert recorder.generate_calls == []
    assert recorder.create_calls == []


def test_oversized_content_length_is_413_before_parsing(teacher_client, recorder, monkeypatch):
    monkeypatch.setattr("app.glossary.upload.MAX_UPLOAD_BYTES", 10)
    body = b"x" * (2 * 1024 * 1024)
    response = _post_file(teacher_client, "notes.txt", body, "text/plain")

    assert response.status_code == 413
    assert recorder.generate_calls == []


def test_file_read_is_bounded(teacher_client, recorder, monkeypatch):
    seen = []

    def spy(filename, content_type, data):
        seen.append(len(data))
        raise TooLarge("too big")

    monkeypatch.setattr("app.glossary.upload.MAX_UPLOAD_BYTES", 10)
    monkeypatch.setattr(router, "normalize_upload", spy)
    response = _post_file(teacher_client, "notes.txt", b"x" * 50, "text/plain")

    assert response.status_code == 413
    assert seen == [11]


def test_empty_file_is_422(teacher_client, recorder):
    response = _post_file(teacher_client, "notes.txt", b"   ", "text/plain")

    assert response.status_code == 422


def test_malformed_json_is_422(teacher_client, recorder):
    response = teacher_client.post(
        "/api/lessons", content="{not json", headers={"content-type": "application/json"}
    )

    assert response.status_code == 422
    assert recorder.generate_calls == []


def test_json_missing_fields_is_422(teacher_client, recorder):
    response = teacher_client.post("/api/lessons", json={"title": "x"})

    assert response.status_code == 422
    assert isinstance(response.json()["detail"], str)
    assert recorder.generate_calls == []


def test_multipart_missing_fields_is_422(teacher_client, recorder):
    response = teacher_client.post(
        "/api/lessons",
        data={"title": "x"},
        files={"file": ("a.txt", b"hola", "text/plain")},
    )

    assert response.status_code == 422
    assert recorder.generate_calls == []


def test_multipart_missing_file_is_422(teacher_client, recorder):
    response = teacher_client.post("/api/lessons", data=FORM_FIELDS, files={"x": ("a", b"b")})

    assert response.status_code == 422


@pytest.mark.parametrize("error", [OpenRouterError("down"), GlossaryParseError("bad json")])
def test_llm_failures_are_502(teacher_client, recorder, error):
    recorder.generate_error = error
    response = teacher_client.post("/api/lessons", json=JSON_BODY)

    assert response.status_code == 502
    assert recorder.create_calls == []
    assert FAKE_KEY not in response.text


def test_missing_api_key_is_503_without_calling_llm(teacher_client, recorder, api_settings):
    api_settings["value"] = _settings(api_key=None)
    response = _post_file(teacher_client, "notes.txt", b"hola", "text/plain")

    assert response.status_code == 503
    assert response.json() == {"detail": "LLM not configured"}
    assert recorder.generate_calls == []


def test_save_failure_is_500(teacher_client, recorder):
    recorder.save_error = LessonSaveError("could not save lesson")
    response = teacher_client.post("/api/lessons", json=JSON_BODY)

    assert response.status_code == 500
    assert response.json() == {"detail": "could not save lesson"}


def test_multipart_without_text_or_images_is_422(teacher_client, recorder, monkeypatch):
    monkeypatch.setattr(router, "normalize_upload", lambda *args: ("", []))
    response = _post_file(teacher_client, "scan.pdf", b"%PDF", "application/pdf")

    assert response.status_code == 422
    assert recorder.generate_calls == []


@pytest.mark.parametrize("header", ["abc", "-5", "1.5"])
def test_invalid_content_length_header_is_400(header):
    with pytest.raises(HTTPException) as error:
        router._declared_size(header)

    assert error.value.status_code == 400


def test_missing_content_length_header_counts_as_zero():
    assert router._declared_size(None) == 0


def test_text_lessons_use_the_text_model(teacher_client, recorder, api_settings):
    api_settings["value"] = _settings().model_copy(
        update={"openrouter_model": "text/only", "openrouter_vision_model": "vision/model"}
    )

    teacher_client.post("/api/lessons", json=JSON_BODY)

    assert recorder.generate_calls[0][2] == "text/only"


def test_lessons_with_images_use_the_vision_model(teacher_client, recorder, api_settings):
    api_settings["value"] = _settings().model_copy(
        update={"openrouter_model": "text/only", "openrouter_vision_model": "vision/model"}
    )

    _post_file(teacher_client, "page.png", _png(), "image/png")

    assert recorder.generate_calls[0][2] == "vision/model"
