from tests.fake_supabase import FakeSupabase

TEACHER = "00000000-0000-4000-8000-000000000001"
STUDENT = "00000000-0000-4000-8000-000000000002"
OTHER_STUDENT = "00000000-0000-4000-8000-000000000003"
L1 = "10000000-0000-4000-8000-000000000001"
L0 = "10000000-0000-4000-8000-000000000000"
STUDENT_SESSION = "20000000-0000-4000-8000-000000000001"
OTHER_SESSION = "20000000-0000-4000-8000-000000000002"


def _term(lemma: str, transparent: bool) -> dict:
    return {
        "id": f"30000000-0000-4000-8000-{len(lemma):012d}",
        "lesson_id": L1,
        "lemma": lemma,
        "forms": [lemma],
        "translation_es": None,
        "definition_fr": None,
        "transparent": transparent,
        "key_phrase": None,
    }


def seeded_fake() -> FakeSupabase:
    return FakeSupabase({
        "lessons": [
            {"id": L0, "teacher_id": TEACHER, "title": "Old lesson", "subject": None,
             "lesson_date": "2026-11-15", "created_at": "2026-11-15T08:00:00+00:00"},
            {"id": L1, "teacher_id": TEACHER, "title": "La chaleur", "subject": "Physique",
             "lesson_date": "2026-11-22", "created_at": "2026-11-20T08:00:00+00:00"},
        ],
        "lesson_terms": [
            _term("mitochondrie", True),
            _term("déchet", False),
            _term("chaleur", False),
        ],
        "word_mastery": [
            {"student_id": STUDENT, "lemma": "déchet", "level": 1, "times_tapped": 2,
             "last_seen_at": "2026-11-20T10:00:00+00:00"},
        ],
        "class_sessions": [
            {"id": STUDENT_SESSION, "lesson_id": L0, "student_id": STUDENT,
             "started_at": "2026-11-15T09:00:00+00:00"},
            {"id": OTHER_SESSION, "lesson_id": L1, "student_id": OTHER_STUDENT,
             "started_at": "2026-11-22T09:00:00+00:00"},
        ],
        "class_events": [
            {"id": "40000000-0000-4000-8000-000000000001", "session_id": STUDENT_SESSION,
             "student_id": STUDENT, "t_sec": 12.0, "type": "word", "lemma": "chaleur",
             "created_at": "2026-11-15T09:01:00+00:00"},
            {"id": "40000000-0000-4000-8000-000000000002", "session_id": OTHER_SESSION,
             "student_id": OTHER_STUDENT, "t_sec": 5.0, "type": "word", "lemma": "déchet",
             "created_at": "2026-11-22T09:01:00+00:00"},
        ],
        "word_states_log": [],
    })
