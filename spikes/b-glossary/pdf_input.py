"""Read a lesson PDF: text if it has a text layer, otherwise page images for the vision model."""

from dataclasses import dataclass
from pathlib import Path

import pymupdf


@dataclass(frozen=True)
class PdfContent:
    text: str
    page_images: list[bytes]
    pages_total: int
    used_vision: bool


def load_pdf(path, min_text_chars: int = 200, max_pages: int = 5, dpi: int = 110) -> PdfContent:
    """Text only when the PDF has enough text (no vision tokens); else render the first pages to PNG."""
    path = Path(path)
    if path.suffix.lower() != ".pdf":
        raise ValueError(f"Not a PDF file: {path.name} (expected .pdf)")
    try:
        document = pymupdf.open(path)
    except Exception as error:
        raise ValueError(f"Cannot read PDF {path.name}: {error}") from error

    with document:
        if document.page_count == 0:
            raise ValueError(f"Empty PDF (no pages): {path.name}")
        text = "\n".join(page.get_text() for page in document)
        if len(text.strip()) >= min_text_chars:
            return PdfContent(text, [], document.page_count, used_vision=False)
        pages = list(document)[:max_pages]
        images = [page.get_pixmap(dpi=dpi).tobytes("png") for page in pages]
        return PdfContent(text, images, document.page_count, used_vision=True)


def lesson_inputs(source_text: str, content: PdfContent) -> tuple[str, list[bytes]]:
    """Merge extra --text with the PDF: the (source_text, image_blobs) pair that `generate` expects."""
    texts = [part for part in (source_text, content.text) if part.strip()]
    return "\n".join(texts), content.page_images


def describe(content: PdfContent) -> str:
    if content.used_vision:
        return f"PDF rendered as {len(content.page_images)} page images (of {content.pages_total} pages)"
    return f"PDF used as text ({content.pages_total} pages, no images sent)"
