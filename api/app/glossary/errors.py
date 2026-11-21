"""Errors raised while turning an uploaded file into lesson input (mapped to HTTP by the router)."""


class InputError(ValueError):
    """The upload is empty or unreadable (HTTP 422)."""


class UnsupportedType(ValueError):
    """The upload is not text, PDF or image (HTTP 415)."""


class TooLarge(ValueError):
    """The upload exceeds the size cap (HTTP 413)."""
