import pytest

from app.concept_answers import grade

EXERCISES = [
    {"question": "q1", "options": ["a", "b", "c"], "answer": 0},
    {"question": "q2", "options": ["a", "b"], "answer": 1},
]


def test_all_right_is_understood():
    assert grade(EXERCISES, [0, 1]) == ([True, True], "understood")


def test_one_wrong_is_review():
    _, status = grade(EXERCISES, [0, 0])
    assert status == "review"


def test_correct_false_only_at_wrong_index():
    correct, _ = grade(EXERCISES, [2, 1])
    assert correct == [False, True]


def test_length_mismatch_raises():
    with pytest.raises(ValueError):
        grade(EXERCISES, [0])


@pytest.mark.parametrize("bad", [[0, 2], [3, 1], [-1, 1]])
def test_index_out_of_range_raises(bad):
    with pytest.raises(ValueError):
        grade(EXERCISES, bad)
