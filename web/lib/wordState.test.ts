import { describe, expect, it } from "vitest";
import { matchLemmas, stateFor, type MatchTerm } from "./wordState";

const terms: MatchTerm[] = [
  { lemma: "déchet", forms: ["déchet", "déchets"], transparent: false },
  { lemma: "dioxyde de carbone", forms: ["dioxyde de carbone"], transparent: false },
  { lemma: "carbone", forms: ["carbone"], transparent: true },
  { lemma: "oxygène", forms: ["oxygène"], transparent: true },
];

describe("matchLemmas", () => {
  it("finds glossary lemmas on word boundaries, case-insensitive", () => {
    expect(matchLemmas("Les DÉCHETS sont là", terms)).toEqual(["déchet"]);
    expect(matchLemmas("des déchetteries", terms)).toEqual([]);
  });

  it("prefers multi-word forms and splits off l'/d' elisions", () => {
    expect(matchLemmas("du dioxyde de carbone et de l'oxygène", terms)).toEqual(["dioxyde de carbone", "oxygène"]);
  });
});

describe("stateFor", () => {
  it("applies the class rules: level ≥ 2 green, else orange if tapped before, else yellow", () => {
    const mastery = { levels: { déchet: 0, oxygène: 3 }, previouslyTapped: ["déchet"] };
    expect(stateFor(terms[3], mastery)).toBe("green");
    expect(stateFor(terms[0], mastery)).toBe("orange");
    expect(stateFor(terms[0], { levels: { déchet: 1 }, previouslyTapped: [] })).toBe("yellow");
  });

  it("falls back to the initial level when the lemma has no mastery entry", () => {
    const none = { levels: {}, previouslyTapped: [] };
    expect(stateFor(terms[2], none)).toBe("green");
    expect(stateFor(terms[0], none)).toBe("yellow");
  });
});
