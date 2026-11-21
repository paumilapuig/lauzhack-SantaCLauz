"""Build the single LLM request that turns a lesson (text and/or images) into a glossary."""

import base64

from image_prep import PreparedImage, prepare_image

PROMPT_VERSION = "v1"

SYSTEM_PROMPT = """You prepare a French vocabulary glossary for a school lesson.
The learner is a 14-year-old Spanish-speaking newcomer with A1-A2 French.
The lesson is given as text and/or photos (textbook page, blackboard, figures).

Reply with strict JSON only (no prose, no markdown) shaped exactly like:
{
  "terms": [
    {"lemma": str, "forms": [str, ...], "translation_es": str,
     "definition_fr": str, "transparent": bool, "key_phrase": str}
  ],
  "key_phrases": [{"text": str, "lemmas": [str, ...]}]
}

Rules:
- Return 10 to 20 terms: the words a beginner needs to follow this lesson.
- lemma is lowercase and must also appear in forms (all inflected forms seen in the lesson).
- translation_es is the Spanish translation of the term.
- definition_fr is a very simple French definition (A1-A2 vocabulary).
- transparent is true when the word is an obvious cognate for a Spanish speaker.
- key_phrase is a sentence copied verbatim from the lesson that contains the term.
- Terms may come from labels inside figures or images.
- key_phrases lists 5 to 8 important sentences from the lesson, each with the lemmas it contains.
"""


def _text_part(text: str) -> dict:
    return {"type": "text", "text": text}


def _image_part(image: PreparedImage) -> dict:
    encoded = base64.b64encode(image.jpeg_bytes).decode("ascii")
    return {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded}"}}


def build_messages(
    source_text: str, image_paths, max_side: int = 1024
) -> tuple[list[dict], list[PreparedImage]]:
    """Return chat messages plus the prepared images (for size metrics)."""
    has_text = bool(source_text.strip())
    if not has_text and not image_paths:
        raise ValueError("Provide lesson text or at least one image")

    prepared = [prepare_image(path, max_side=max_side) for path in image_paths]
    parts = ([_text_part(source_text)] if has_text else []) + [_image_part(i) for i in prepared]
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": parts},
    ]
    return messages, prepared
