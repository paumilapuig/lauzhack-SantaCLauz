from app.term_matching import find_lemmas

MITOCHONDRIE = {"lemma": "mitochondrie", "forms": ["mitochondries"]}
OXYGENE = {"lemma": "oxygène", "forms": None}
DECHET = {"lemma": "déchet", "forms": ["déchets"]}


def test_plural_form_maps_to_lemma():
    assert find_lemmas("les mitochondries", [MITOCHONDRIE]) == ["mitochondrie"]


def test_longest_phrase_wins_over_contained_term():
    terms = [
        {"lemma": "carbone", "forms": []},
        {"lemma": "dioxyde de carbone", "forms": []},
    ]
    assert find_lemmas("du dioxyde de carbone", terms) == ["dioxyde de carbone"]


def test_elision_with_straight_and_curly_apostrophe():
    assert find_lemmas("l'oxygène", [OXYGENE]) == ["oxygène"]
    assert find_lemmas("l’oxygène", [OXYGENE]) == ["oxygène"]


def test_match_is_case_insensitive():
    assert find_lemmas("Les Mitochondries", [MITOCHONDRIE]) == ["mitochondrie"]


def test_no_partial_word_match():
    assert find_lemmas("déchetsx", [DECHET]) == []


def test_text_without_terms_returns_empty():
    assert find_lemmas("bonjour tout le monde", [DECHET, OXYGENE]) == []


def test_lemma_found_twice_is_listed_once():
    assert find_lemmas("déchet puis déchets", [DECHET]) == ["déchet"]


def test_lemmas_ordered_by_first_position_in_text():
    assert find_lemmas("l'oxygène et les déchets", [DECHET, OXYGENE]) == [
        "oxygène",
        "déchet",
    ]
