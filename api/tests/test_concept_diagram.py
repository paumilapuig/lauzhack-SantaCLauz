from app.lost_concepts.diagram import repair_diagram


def step(nodes=(), links=(), words=()):
    return {"fr": "La cellule respire.", "es": "La célula respira.",
            "nodes": list(nodes), "links": list(links), "words": list(words)}


def node(node_id, fr="Glucose", kind="input", inside=None):
    return {"id": node_id, "fr": fr, "kind": kind, "inside": inside}


def test_valid_diagram_is_kept():
    steps = [step(nodes=[node("glucose"), node("oxygene", "Oxygène")]),
             step(nodes=[node("mito", "Mitochondrie", "place")], links=[{"from": "glucose", "to": "mito"}])]

    repaired = repair_diagram(steps)

    assert [n["id"] for n in repaired[0]["nodes"]] == ["glucose", "oxygene"]
    assert repaired[1]["links"] == [{"from": "glucose", "to": "mito", "fr": None}]


def test_ids_are_normalised_and_links_follow():
    steps = [step(nodes=[node("Glucose Sugar!")]), step(nodes=[node("Mito")], links=[{"from": "Glucose Sugar!", "to": "Mito"}])]

    repaired = repair_diagram(steps)

    assert repaired[0]["nodes"][0]["id"] == "glucose-sugar"
    assert repaired[1]["links"] == [{"from": "glucose-sugar", "to": "mito", "fr": None}]


def test_duplicate_nodes_and_links_to_unknown_or_later_nodes_are_dropped():
    steps = [step(nodes=[node("a"), node("a")], links=[{"from": "a", "to": "b"}]),
             step(nodes=[node("b")], links=[{"from": "a", "to": "b"}, {"from": "b", "to": "zzz"}, {"from": "a", "to": "b"}])]

    repaired = repair_diagram(steps)

    assert [n["id"] for n in repaired[0]["nodes"]] == ["a"]
    assert repaired[0]["links"] == []
    assert repaired[1]["links"] == [{"from": "a", "to": "b", "fr": None}]


def test_invalid_nodes_and_words_are_dropped_and_lists_capped():
    steps = [step(nodes=[node("a"), {"id": "x"}, node("b", fr="x" * 41), node("c"), node("d"), node("e")],
                  words=[{"fr": "libère", "es": "libera"}, {"fr": "", "es": "x"}, "oops"] + [{"fr": f"w{i}", "es": "e"} for i in range(10)])]

    repaired = repair_diagram(steps)

    assert [n["id"] for n in repaired[0]["nodes"]] == ["a", "c", "d"]
    assert repaired[0]["words"][0] == {"fr": "libère", "es": "libera"}
    assert len(repaired[0]["words"]) == 8


def test_at_most_ten_nodes_per_concept():
    steps = [step(nodes=[node(f"n{s}{i}") for i in range(3)]) for s in range(5)]

    repaired = repair_diagram(steps)

    assert sum(len(s["nodes"]) for s in repaired) == 10


def test_steps_without_diagram_get_empty_lists():
    repaired = repair_diagram([{"fr": "a", "es": "b", "visual": "c"}, "not a dict"])

    assert repaired[0]["nodes"] == [] and repaired[0]["links"] == [] and repaired[0]["words"] == []
    assert repaired[1] == "not a dict"


def test_unknown_kind_becomes_process_and_inside_must_be_an_earlier_place():
    steps = [step(nodes=[node("mito", "Mitochondrie", "place"), node("glu", kind="blob")]),
             step(nodes=[node("cycle", "Cycle", "process", inside="mito"), node("x", inside="glu"), node("y", inside="nope")])]

    repaired = repair_diagram(steps)

    assert repaired[0]["nodes"][1]["kind"] == "process"
    assert [n["inside"] for n in repaired[1]["nodes"]] == ["mito", None, None]


def test_link_label_is_kept_when_short_and_dropped_when_too_long():
    steps = [step(nodes=[node("a"), node("b")], links=[{"from": "a", "to": "b", "fr": "entre dans"}, {"from": "b", "to": "a", "fr": "x" * 31}])]

    links = repair_diagram(steps)[0]["links"]

    assert links == [{"from": "a", "to": "b", "fr": "entre dans"}, {"from": "b", "to": "a", "fr": None}]
