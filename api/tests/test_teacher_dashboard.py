import pytest

from app.routers import teacher_dashboard as dash

S1, S2, S3 = "s1", "s2", "s3"
SESSIONS = [
    {"id": S1, "student_id": "w4", "started_at": "2026-11-03T09:00:00+00:00"},
    {"id": S2, "student_id": "w4", "started_at": "2026-11-17T09:00:00+00:00"},
    {"id": S3, "student_id": "w1", "started_at": "2026-11-17T10:00:00+00:00"},
]


def test_lost_peaks_bucket_per_minute_most_first():
    events = [{"t_sec": 725.0}, {"t_sec": 760.0}, {"t_sec": 190.0}, {"t_sec": 30.0}, {"t_sec": 59.9}]
    assert dash.lost_peaks(events) == [
        {"minute": 0, "count": 2}, {"minute": 12, "count": 2}, {"minute": 3, "count": 1}]


def test_top_words_count_glossary_marks_only_max_ten():
    marks = [{"lemma": "déchet"}, {"lemma": "déchet"}, {"lemma": "chaleur"}, {"lemma": None}]
    marks += [{"lemma": f"mot{i}"} for i in range(12)]
    top = dash.top_words(marks)
    assert top[:2] == [{"lemma": "déchet", "taps": 2}, {"lemma": "chaleur", "taps": 1}]
    assert len(top) == 10


def test_students_latest_autonomy_and_weekly_skip_unfinished_sessions():
    states = [
        {"session_id": S1, "state": "green"}, {"session_id": S1, "state": "yellow"},
        {"session_id": S2, "state": "green"}, {"session_id": S2, "state": "green"},
        {"session_id": S2, "state": "orange"}, {"session_id": S2, "state": "green"},
    ]
    names = {"w4": "Lucía (semaine 4)", "w1": "Lucía (semaine 1)"}
    students = dash.students(SESSIONS, states, names)
    assert students == [
        {"name": "Lucía (semaine 1)", "autonomy": None, "weekly": []},
        {"name": "Lucía (semaine 4)", "autonomy": pytest.approx(0.75),
         "weekly": [{"week": "2026-W45", "autonomy": 0.5}, {"week": "2026-W47", "autonomy": 0.75}]},
    ]


def test_concept_gaps_by_first_minute_with_student_name():
    gaps = [
        {"student_id": "w1", "concept": "B", "minutes": [14, 2], "lemmas": [], "status": "pending", "attempts": 0},
        {"student_id": "w4", "concept": "A", "minutes": [], "lemmas": ["chaleur"], "status": "review", "attempts": 1},
        {"student_id": "w4", "concept": "C", "minutes": [1], "lemmas": [], "status": "understood", "attempts": 1},
    ]
    result = dash.concept_gaps(gaps, {"w1": "Lucía (semaine 1)", "w4": "Lucía (semaine 4)"})
    assert [g["concept"] for g in result] == ["C", "B", "A"]
    assert result[1] == {"student": "Lucía (semaine 1)", "concept": "B", "minutes": [2, 14],
                         "lemmas": [], "status": "pending", "attempts": 0}
