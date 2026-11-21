from pydantic import BaseModel, ConfigDict, Field

MAX_CONCEPT_FR_CHARS = 300
MAX_EXPLANATION_ES_CHARS = 600


class LostContext(BaseModel):
    """Transcript fragment around a "Me he perdido" press."""

    event_id: str = Field(min_length=1)
    t_sec: float = Field(ge=0)
    transcript: str


class LostConcept(BaseModel):
    """Short summary of what the teacher was explaining at one lost moment."""

    model_config = ConfigDict(str_strip_whitespace=True)

    event_id: str = Field(min_length=1)
    concept_fr: str = Field(min_length=1, max_length=MAX_CONCEPT_FR_CHARS)
    explanation_es: str = Field(min_length=1, max_length=MAX_EXPLANATION_ES_CHARS)
    lemmas: list[str] = []
