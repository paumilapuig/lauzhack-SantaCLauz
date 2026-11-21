from cache import cache_key, load, save

BASE = ("model-a", "v1", "texte", [b"img1", b"img2"])


def test_same_inputs_same_key():
    assert cache_key(*BASE) == cache_key(*BASE)
    assert len(cache_key(*BASE)) == 64


def test_any_input_change_changes_key():
    keys = {
        cache_key(*BASE),
        cache_key("model-b", "v1", "texte", [b"img1", b"img2"]),
        cache_key("model-a", "v2", "texte", [b"img1", b"img2"]),
        cache_key("model-a", "v1", "autre", [b"img1", b"img2"]),
        cache_key("model-a", "v1", "texte", [b"img1"]),
        cache_key("model-a", "v1", "texte", [b"img2", b"img1"]),
    }
    assert len(keys) == 6


def test_field_boundaries_do_not_collide():
    assert cache_key("ab", "c", "t", []) != cache_key("a", "bc", "t", [])


def test_save_load_round_trip(tmp_path):
    cache_dir = tmp_path / "cache"
    save("k1", {"terms": [1]}, {"seconds": 1.5}, cache_dir)
    assert load("k1", cache_dir) == {"terms": [1]}


def test_missing_returns_none(tmp_path):
    assert load("nope", tmp_path / "cache") is None
