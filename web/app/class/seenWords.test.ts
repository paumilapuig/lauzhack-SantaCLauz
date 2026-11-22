import { describe, expect, it } from "vitest";
import { createSeenWords } from "./seenWords";

const pack = {
  terms: [
    { lemma: "déchet", forms: ["déchets"], transparent: false },
    { lemma: "oxygène", forms: ["oxygène"], transparent: true },
    { lemma: "chaleur", forms: ["chaleur"], transparent: false },
  ],
  mastery: { déchet: 0, oxygène: 3, chaleur: 1 },
  previously_tapped: ["chaleur"],
};

describe("createSeenWords", () => {
  it("lists each glossary word that appeared once, with the state it had", () => {
    const seen = createSeenWords(pack);
    seen.add("les déchets et l'oxygène");
    seen.add("encore des déchets");
    expect(seen.states()).toEqual([
      { lemma: "déchet", state: "yellow" },
      { lemma: "oxygène", state: "green" },
    ]);
  });

  it("marks a word the student already marked at home as orange", () => {
    const seen = createSeenWords(pack);
    seen.add("la chaleur");
    expect(seen.states()).toEqual([{ lemma: "chaleur", state: "orange" }]);
  });

  it("is empty when no glossary word appeared", () => {
    const seen = createSeenWords(pack);
    seen.add("bonjour à tous");
    expect(seen.states()).toEqual([]);
  });
});
