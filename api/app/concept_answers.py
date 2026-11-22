"""Pure grading of concept exercises (no LLM, no DB)."""


def grade(exercises: list[dict], answers: list[int]) -> tuple[list[bool], str]:
    """Return per-exercise correctness and the resulting gap status.

    Raises ValueError if the answers don't match the exercises.
    """
    if len(answers) != len(exercises):
        raise ValueError("answers length must match exercises length")
    for exercise, chosen in zip(exercises, answers):
        if not 0 <= chosen < len(exercise["options"]):
            raise ValueError("answer index out of range")
    correct = [chosen == exercise["answer"] for exercise, chosen in zip(exercises, answers)]
    return correct, "understood" if all(correct) else "review"
