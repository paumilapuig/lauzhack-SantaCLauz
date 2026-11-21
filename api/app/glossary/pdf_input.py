"""Read a lesson PDF from bytes: text if it has a text layer, otherwise prepared page images."""

import pymupdf

from app.glossary.errors import InputError
from app.glossary.image_prep import prepare_image

MIN_TEXT_CHARS = 200
MAX_PAGES = 5
RENDER_DPI = 110


def extract(data: bytes) -> tuple[str, list[bytes]]:
    """Return (text, jpeg_images): images only when the PDF has too little text."""
    try:
        document = pymupdf.open(stream=data, filetype="pdf")
    except Exception as error:
        raise InputError("Cannot read PDF") from error

    with document:
        if document.page_count == 0:
            raise InputError("Empty PDF (no pages)")
        text = "\n".join(page.get_text() for page in document)
        if len(text.strip()) >= MIN_TEXT_CHARS:
            return text, []
        pages = list(document)[:MAX_PAGES]
        return text, [prepare_image(page.get_pixmap(dpi=RENDER_DPI).tobytes("png")) for page in pages]
