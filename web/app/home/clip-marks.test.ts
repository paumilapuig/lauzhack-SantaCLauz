import { describe, expect, it } from "vitest";
import { marksFrom, withMark, withoutMark, withTranslation } from "./clip-marks";

const word = (w: string, clip: string | null, translation: string | null) => ({
  word: w, lemma: null, translation_es: translation, definition_fr: null, key_phrase: "", level: 0, clip_id: clip,
});

describe("clip marks", () => {
  it("groups the marked words by clip with their translation", () => {
    expect(marksFrom([word("déchets", "c1", "desechos"), word("chaleur", "c2", null), word("libre", null, "x")])).toEqual({
      c1: { déchets: "desechos" },
      c2: { chaleur: "" },
    });
  });

  it("adds and removes one word without touching the others", () => {
    const marks = withMark({ c1: { déchets: "desechos" } }, "c1", "Énergie", "energía");
    expect(marks).toEqual({ c1: { déchets: "desechos", énergie: "energía" } });
    expect(withoutMark(marks, "c1", "déchets")).toEqual({ c1: { énergie: "energía" } });
  });

  it("fills in the translation of a word that is still marked, and ignores one she already unmarked", () => {
    const marks = { c1: { énergie: "…" } };
    expect(withTranslation(marks, "c1", "Énergie", "energía")).toEqual({ c1: { énergie: "energía" } });
    expect(withTranslation(marks, "c1", "chaleur", "calor")).toBe(marks);
  });
});
