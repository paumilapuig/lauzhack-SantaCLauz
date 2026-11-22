"""Shapes of the concept-gap path (docs/API.md › Concept gaps)."""

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

MAX_CONCEPTS = 3
MIN_STEPS = 2  # accepted; the prompt asks for PROMPT_MIN_STEPS
PROMPT_MIN_STEPS = 3
MAX_STEPS = 5
MIN_EXERCISES = 2
MAX_EXERCISES = 3
MIN_OPTIONS = 2
MAX_OPTIONS = 4
MAX_CONCEPT_CHARS = 300
MAX_STEP_FR_CHARS = 200
MAX_STEP_ES_CHARS = 300
MAX_VISUAL_CHARS = 40
MAX_QUESTION_CHARS = 300
MAX_OPTION_CHARS = 150


def _text(max_chars: int):
    return Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=max_chars)]


class LostMoment(BaseModel):
    """One "Me he perdido" press: its number in the prompt, its time and the last <= 60 s of text."""

    n: int = Field(ge=1)
    t_sec: float = Field(ge=0)
    transcript: str


class DiagramNode(BaseModel):
    """A box of the concept's process diagram; `kind` picks its shape and colour in the client."""

    id: str
    fr: str
    kind: Literal["input", "process", "output", "place"]
    inside: str | None = None


class DiagramLink(BaseModel):
    """An arrow between two boxes, with an optional short French label."""

    model_config = ConfigDict(populate_by_name=True)

    from_: str = Field(alias="from", serialization_alias="from")
    to: str
    fr: str | None = None


class WordGloss(BaseModel):
    """Spanish for one harder French word of a step, shown when the student taps it."""

    fr: str
    es: str


class ConceptStep(BaseModel):
    """One step of the explanation: text plus what it adds to the diagram (cleaned by `diagram.py`)."""

    fr: _text(MAX_STEP_FR_CHARS)
    es: _text(MAX_STEP_ES_CHARS)
    visual: Annotated[str, StringConstraints(strip_whitespace=True, max_length=MAX_VISUAL_CHARS)] = ""
    nodes: list[DiagramNode] = []
    links: list[DiagramLink] = []
    words: list[WordGloss] = []


class ConceptExercise(BaseModel):
    """A multiple-choice question; `answer` is the 0-based index of the right option."""

    question: _text(MAX_QUESTION_CHARS)
    options: list[_text(MAX_OPTION_CHARS)] = Field(min_length=MIN_OPTIONS, max_length=MAX_OPTIONS)
    answer: int

    @model_validator(mode="after")
    def _answer_points_to_an_option(self):
        if not 0 <= self.answer < len(self.options):
            raise ValueError("answer must be the index of one of the options")
        return self


class _ConceptBody(BaseModel):
    model_config = ConfigDict(extra="ignore")

    concept: _text(MAX_CONCEPT_CHARS)
    lemmas: list[str] = []
    explanation: list[ConceptStep] = Field(min_length=MIN_STEPS, max_length=MAX_STEPS)
    exercises: list[ConceptExercise] = Field(min_length=MIN_EXERCISES, max_length=MAX_EXERCISES)


class LlmConcept(_ConceptBody):
    """A concept as the LLM returns it: it points at the prompt's moments by number."""

    moments: list[int] = Field(min_length=1)


class ConceptGap(_ConceptBody):
    """A validated concept gap, ready for a `concept_gaps` row (minutes computed by the API)."""

    minutes: list[int]
