from fastapi import HTTPException, UploadFile

MAX_AUDIO_BYTES = 2 * 1024 * 1024
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
