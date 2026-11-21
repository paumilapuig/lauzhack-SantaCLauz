from io import BytesIO

import pytest
from fastapi import HTTPException
from starlette.datastructures import Headers, UploadFile

from app.routers.clips_validation import MAX_AUDIO_BYTES, audio_base_type, read_audio


def make_upload(data: bytes, content_type: str | None = "audio/webm") -> UploadFile:
    headers = Headers({"content-type": content_type}) if content_type else Headers()
    return UploadFile(BytesIO(data), headers=headers)


def test_base_type_strips_codec_params_and_case():
    assert audio_base_type("Audio/WebM;codecs=opus") == "audio/webm"
    assert audio_base_type(None) == ""


def test_webm_with_codecs_passes():
    assert read_audio(make_upload(b"abc", "audio/webm;codecs=opus")) == b"abc"


@pytest.mark.parametrize("content_type", ["audio/ogg", "video/webm", None])
def test_wrong_or_missing_type_is_415(content_type):
    with pytest.raises(HTTPException) as err:
        read_audio(make_upload(b"abc", content_type))
    assert err.value.status_code == 415
    assert err.value.detail == "Audio must be audio/webm"


def test_exactly_max_size_passes():
    data = b"x" * MAX_AUDIO_BYTES
    assert read_audio(make_upload(data)) == data


def test_over_max_size_is_413():
    with pytest.raises(HTTPException) as err:
        read_audio(make_upload(b"x" * (MAX_AUDIO_BYTES + 1)))
    assert err.value.status_code == 413
    assert err.value.detail == "Audio larger than 2 MB"


def test_read_is_bounded():
    reads: list[int] = []

    class SpyFile(BytesIO):
        def read(self, size=-1):
            reads.append(size)
            return super().read(size)

    headers = Headers({"content-type": "audio/webm"})
    read_audio(UploadFile(SpyFile(b"abc"), headers=headers))
    assert reads == [MAX_AUDIO_BYTES + 1]


def test_empty_is_422():
    with pytest.raises(HTTPException) as err:
        read_audio(make_upload(b""))
    assert err.value.status_code == 422
    assert err.value.detail == "Empty audio"
