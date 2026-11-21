from pydantic import BaseModel, Field, field_validator, model_validator

MIN_KEY_PHRASES = 5
MAX_KEY_PHRASES = 8


class LessonTermInput(BaseModel):
    lemma: str
    forms: list[str]
    translation_es: str
    definition_fr: str
    transparent: bool
    key_phrase: str

    @field_validator("lemma")
    @classmethod
    def lowercase_lemma(cls, lemma: str) -> str:
        return lemma.lower()

    @field_validator("forms")
    @classmethod
    def lowercase_forms(cls, forms: list[str]) -> list[str]:
        return [form.lower() for form in forms]

    @model_validator(mode="after")
    def lemma_is_always_a_form(self) -> "LessonTermInput":
        """The contract says forms include the lemma; LLMs often list only inflections."""
        if self.lemma not in self.forms:
            self.forms = [self.lemma, *self.forms]
        return self


class KeyPhrase(BaseModel):
    text: str
    lemmas: list[str]


class GlossaryResult(BaseModel):
    terms: list[LessonTermInput]
    key_phrases: list[KeyPhrase] = Field(min_length=MIN_KEY_PHRASES, max_length=MAX_KEY_PHRASES)
