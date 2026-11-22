from datetime import UTC, datetime

from app.progress_garden import build_week, build_words

NOW = datetime(2026, 11, 19, 12, tzinfo=UTC)  # a Thursday


def test_words_once_each_marked_first_with_level_and_spanish():
    words = build_words(
        mark_lemmas=["noyau", "cellule", "noyau"],
        passed_lemmas=["atome", "cellule"],
        levels={"noyau": 0, "cellule": 2, "atome": 3},
        translations={"noyau": "núcleo", "cellule": "célula"},
    )

    assert [(w.lemma, w.translation_es, w.level) for w in words] == [
        ("noyau", "núcleo", 0),
        ("cellule", "célula", 2),
        ("atome", None, 3),
    ]


def test_words_without_any_level_start_at_zero():
    assert build_words(["ion"], [], {}, {})[0].level == 0


def test_week_runs_monday_to_sunday_and_marks_days_with_practice():
    week = build_week(
        [
            datetime(2026, 11, 16, 9, tzinfo=UTC),
            datetime(2026, 11, 16, 18, tzinfo=UTC),
            datetime(2026, 11, 19, 8, tzinfo=UTC),
            datetime(2026, 11, 12, 8, tzinfo=UTC),  # last week
        ],
        NOW,
    )

    assert [d.date for d in week] == [f"2026-11-{day}" for day in range(16, 23)]
    assert [d.practised for d in week] == [True, False, False, True, False, False, False]
