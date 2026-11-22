from fastapi import HTTPException, UploadFile

MAX_AUDIO_BYTES = 2 * 1024 * 1024
# Technical tolerance of t_end - t_start per clip kind, in seconds (docs/API.md › Clips).
DURATION_RANGE_SEC = {"word": (1.0, 16.0), "concept": (10.0, 70.0)}
ALLOWED_AUDIO_TYPE = "audio/webm"


def audio_base_type(content_type: str | None) -> str:
    return (content_type or "").split(";")[0].strip().lower()


def read_audio(upload: UploadFile) -> bytes:
    if audio_base_type(upload.content_type) != ALLOWED_AUDIO_TYPE:
        raise HTTPException(status_code=415, detail="Audio must be audio/webm")
    data = upload.file.read(MAX_AUDIO_BYTES + 1)
    if len(data) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio larger than 2 MB")
    if not data:
        raise HTTPException(status_code=422, detail="Empty audio")
    return data


def check_duration(kind: str, t_start: float, t_end: float) -> None:
    if t_end <= t_start:
        raise HTTPException(status_code=422, detail="t_end must be greater than t_start")
    low, high = DURATION_RANGE_SEC[kind]
    if not low <= t_end - t_start <= high:
        raise HTTPException(status_code=422, detail=f"A {kind} clip lasts {low:g}-{high:g} s")
