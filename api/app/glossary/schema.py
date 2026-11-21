from pydantic import BaseModel, field_validator, model_validator

from app.schemas import LessonTermInput

MAX_KEY_PHRASES = 8


class GlossaryTerm(LessonTermInput):
    """Contract term plus the normalisation rules applied to LLM output."""

    @field_validator("lemma")
    @classmethod
    def lowercase_lemma(cls, lemma: str) -> str:
        return lemma.lower()

    @field_validator("forms")
    @classmethod
    def lowercase_forms(cls, forms: list[str]) -> list[str]:
        return [form.lower() for form in forms]

    @model_validator(mode="after")
    def lemma_is_always_a_form(self) -> "GlossaryTerm":
        """The contract says forms include the lemma; LLMs often list only inflections."""
        if self.lemma not in self.forms:
            self.forms = [self.lemma, *self.forms]
        return self


class KeyPhrase(BaseModel):
    text: str
    lemmas: list[str]


class GlossaryResult(BaseModel):
    terms: list[GlossaryTerm]
    key_phrases: list[KeyPhrase] = []
